-- 🔒 IMPLEMENTACIÓN DE SEGURIDAD FISCAL (CAPA C)
-- CAPA 1: Encriptación en Supabase

-- 1. Habilitar extensión de encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpiar vistas antiguas que puedan causar conflictos de dependencia
DROP VIEW IF EXISTS security_audit_summary;
DROP VIEW IF EXISTS profiles_fiscal_secure;
DROP VIEW IF EXISTS fiscal_security_audit;

-- 2. Crear función de encriptación
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(raw_data TEXT, key_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(raw_data, key_text),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear función de desencriptación
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    key_text
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Agregar columnas encriptadas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rfc_encrypted TEXT,
ADD COLUMN IF NOT EXISTS razon_social_encrypted TEXT,
ADD COLUMN IF NOT EXISTS direccion_fiscal_encrypted TEXT;

-- 5. Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_encrypted_data 
ON profiles(rfc_encrypted) WHERE rfc_encrypted IS NOT NULL;

-- 6. Comentarios de documentación
COMMENT ON COLUMN profiles.rfc_encrypted IS 'RFC encriptado con AES-256';
COMMENT ON COLUMN profiles.razon_social_encrypted IS 'Razón Social encriptada';
COMMENT ON COLUMN profiles.direccion_fiscal_encrypted IS 'Dirección Fiscal encriptada (JSON)';

-- CAPA 2: Tabla de Auditoría
-- Crear tabla de logs de acceso
CREATE TABLE IF NOT EXISTS fiscal_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('read', 'update', 'delete')),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que las columnas existan (por si la tabla ya existía de versiones anteriores)
ALTER TABLE fiscal_data_access_log ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true;
ALTER TABLE fiscal_data_access_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE fiscal_data_access_log ALTER COLUMN ip_address TYPE INET USING ip_address::INET;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fiscal_log_user ON fiscal_data_access_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscal_log_date ON fiscal_data_access_log(created_at DESC);

-- RLS en logs
ALTER TABLE fiscal_data_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own access logs" ON fiscal_data_access_log;
CREATE POLICY "Users can view own access logs"
  ON fiscal_data_access_log FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger de logging automático
CREATE OR REPLACE FUNCTION log_fiscal_data_access()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    NEW.rfc_encrypted IS DISTINCT FROM OLD.rfc_encrypted OR
    NEW.razon_social_encrypted IS DISTINCT FROM OLD.razon_social_encrypted OR
    NEW.direccion_fiscal_encrypted IS DISTINCT FROM OLD.direccion_fiscal_encrypted
  )) THEN
    INSERT INTO fiscal_data_access_log (
      user_id,
      action,
      ip_address
    ) VALUES (
      NEW.id,
      'update',
      inet_client_addr()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fiscal_data_change ON profiles;
CREATE TRIGGER on_fiscal_data_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_fiscal_data_access();

-- CAPA 3: RLS Reforzado
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can only SELECT own profile" ON profiles;
DROP POLICY IF EXISTS "Users can only UPDATE own profile" ON profiles;
DROP POLICY IF EXISTS "Users can SELECT only own profile" ON profiles;
DROP POLICY IF EXISTS "Users can UPDATE only own profile" ON profiles;

-- Políticas ultra-restrictivas
CREATE POLICY "Users can SELECT only own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can UPDATE only own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Bloquear INSERT/DELETE directo
DROP POLICY IF EXISTS "Block direct INSERT" ON profiles;
CREATE POLICY "Block direct INSERT"
  ON profiles FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct DELETE" ON profiles;
CREATE POLICY "Block direct DELETE"
  ON profiles FOR DELETE
  USING (false);

-- Vista de auditoría para admins
CREATE OR REPLACE VIEW fiscal_security_audit AS
SELECT
  fal.created_at,
  p.email,
  fal.action,
  fal.ip_address,
  fal.success,
  fal.error_message,
  CASE
    WHEN fal.ip_address::TEXT ~ '^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)' 
    THEN 'internal'
    ELSE 'external'
  END as source_type
FROM fiscal_data_access_log fal
JOIN profiles p ON p.id = fal.user_id
ORDER BY fal.created_at DESC;
