-- 🔒 ENDURECIMIENTO DE SEGURIDAD FISCAL - VIDEOBOOSTER
-- Capas 1, 2 y 5

-- 1. Capacidad de Encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función auxiliar para setear la clave en la sesión (Usada por la API)
CREATE OR REPLACE FUNCTION set_session_key(key TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.encryption_key', key, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Funciones de Encriptación (Security Definer para bypass RLS controlado)
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  -- Intentar obtener la clave de la configuración de la sesión
  key := current_setting('app.encryption_key', true);
  IF key IS NULL OR key = '' THEN
    RAISE EXCEPTION 'Encryption key not set in app.encryption_key';
  END IF;

  RETURN encode(
    pgp_sym_encrypt(data, key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted TEXT)
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  key := current_setting('app.encryption_key', true);
  IF key IS NULL OR key = '' THEN
    RAISE EXCEPTION 'Decryption key not set';
  END IF;

  RETURN pgp_sym_decrypt(
    decode(encrypted, 'base64'),
    key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Estructura de Tabla Reforzada
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rfc_encrypted TEXT,
ADD COLUMN IF NOT EXISTS razon_social_encrypted TEXT,
ADD COLUMN IF NOT EXISTS direccion_fiscal_encrypted TEXT;

-- 4. Registro de Auditoría (Logging)
CREATE TABLE IF NOT EXISTS public.fiscal_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'SELECT', 'UPDATE'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vista Segura (El corazón del acceso controlado)
CREATE OR REPLACE VIEW public.profiles_fiscal_secure AS
SELECT
  id,
  full_name,
  account_type,
  CASE 
    WHEN rfc_encrypted IS NOT NULL THEN decrypt_sensitive_data(rfc_encrypted)
    ELSE NULL
  END as rfc,
  CASE 
    WHEN razon_social_encrypted IS NOT NULL THEN decrypt_sensitive_data(razon_social_encrypted)
    ELSE NULL
  END as razon_social,
  CASE 
    WHEN direccion_fiscal_encrypted IS NOT NULL THEN decrypt_sensitive_data(direccion_fiscal_encrypted)::JSONB
    ELSE NULL
  END as direccion_fiscal,
  regimen_fiscal,
  uso_cfdi,
  fiscal_data_completed,
  updated_at
FROM public.profiles;

-- 6. Row Level Security (RLS) Extremo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_data_access_log ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Solo el dueño puede ver su registro (sin desencriptar directamente)
CREATE POLICY "Profiles: Dueño puede ver su registro"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Solo el dueño puede actualizar
CREATE POLICY "Profiles: Dueño puede actualizar"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Logs: Solo el dueño ve sus logs
CREATE POLICY "Logs: Dueño ve sus logs"
ON public.fiscal_data_access_log FOR SELECT
USING (auth.uid() = user_id);

-- 7. Trigger de Auditoría Automática
CREATE OR REPLACE FUNCTION public.log_fiscal_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.rfc_encrypted IS DISTINCT FROM OLD.rfc_encrypted) OR 
     (NEW.razon_social_encrypted IS DISTINCT FROM OLD.razon_social_encrypted) THEN
    INSERT INTO public.fiscal_data_access_log (user_id, accessed_by, action, ip_address)
    VALUES (NEW.id, auth.uid(), 'UPDATE', inet_client_addr()::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_fiscal_update ON public.profiles;
CREATE TRIGGER tr_log_fiscal_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_fiscal_update();

-- 8. Vista de Auditoría (Capa 5)
CREATE OR REPLACE VIEW public.security_audit_summary AS
SELECT
  l.created_at,
  p.full_name,
  l.action,
  l.ip_address
FROM public.fiscal_data_access_log l
JOIN public.profiles p ON p.id = l.user_id
ORDER BY l.created_at DESC;
