-- ==========================================
-- MIGRACIÓN B2B: INFRAESTRUCTURA COMPLETA �️
-- ==========================================

-- 1. Crear tabla PROFILES (Si no existe)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  
  -- Columnas B2B (Nuevas)
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business')),
  rfc TEXT,
  razon_social TEXT,
  regimen_fiscal TEXT,
  direccion_fiscal JSONB,
  fiscal_data_completed BOOLEAN DEFAULT false,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Habilitar RLS (Seguridad)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Quién puede ver/editar qué)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- 2. Trigger para crear perfil automático al registro
-- ---------------------------------------------------
-- Función que maneja el nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, username, account_type)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email, -- Si quieres guardar el email en profile también
    new.raw_user_meta_data->>'username',
    COALESCE(new.raw_user_meta_data->>'account_type', 'personal') -- Default a personal si no viene
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- El Trigger en sí (se dispara después de INSERT en auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Índices para velocidad B2B
-- -----------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(account_type) WHERE account_type = 'business';


-- 4. Catálogos SAT (Regímenes Fiscales)
-- -------------------------------------
CREATE TABLE IF NOT EXISTS sat_regimenes_fiscales (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  persona_fisica BOOLEAN DEFAULT true,
  persona_moral BOOLEAN DEFAULT true,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poblar catálogo SAT
INSERT INTO sat_regimenes_fiscales (clave, descripcion, persona_fisica, persona_moral) VALUES
('601', 'General de Ley Personas Morales', false, true),
('603', 'Personas Morales con Fines no Lucrativos', false, true),
('605', 'Sueldos y Salarios e Ingresos Asimilados a Salarios', true, false),
('606', 'Arrendamiento', true, true),
('608', 'Demás ingresos', true, false),
('610', 'Residentes en el Extranjero sin Establecimiento Permanente en México', true, true),
('611', 'Ingresos por Dividendos (socios y accionistas)', true, false),
('612', 'Personas Físicas con Actividades Empresariales y Profesionales', true, false),
('614', 'Ingresos por intereses', true, false),
('615', 'Régimen de los ingresos por obtención de premios', true, false),
('616', 'Sin obligaciones fiscales', true, false),
('620', 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', false, true),
('621', 'Incorporación Fiscal', true, false),
('622', 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', false, true),
('623', 'Opcional para Grupos de Sociedades', false, true),
('624', 'Coordinados', false, true),
('625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', true, false),
('626', 'Régimen Simplificado de Confianza', true, true)
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE sat_regimenes_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogos SAT públicos" ON sat_regimenes_fiscales FOR SELECT USING (true);


-- 5. Actualizar Tracking de Generaciones (Si la tabla existe)
-- -----------------------------------------------------------
-- Solo corre esto si ya creaste la tabla video_generations o video_jobs, si no, saltalo.
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_generations') THEN
    ALTER TABLE video_generations
    ADD COLUMN IF NOT EXISTS account_type TEXT,
    ADD COLUMN IF NOT EXISTS tenant_business_name TEXT,
    ADD COLUMN IF NOT EXISTS is_branded BOOLEAN DEFAULT false;
  END IF;
END $$;
