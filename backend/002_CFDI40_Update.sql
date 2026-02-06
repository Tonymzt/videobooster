-- ==========================================
-- CORRECCIÓN URGENTE: CUMPLIMIENTO SAT - SAAS
-- ==========================================

-- 1. REINICIAR CATÁLOGO USO CFDI (Solo permitir opciones SaaS)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS sat_uso_cfdi CASCADE;

CREATE TABLE sat_uso_cfdi (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  aplica_fisica BOOLEAN DEFAULT true,
  aplica_moral BOOLEAN DEFAULT true,
  activo BOOLEAN DEFAULT true
);

-- POBLAR SOLO CON USOS VÁLIDOS PARA VIDEOBOOSTER (SAAS)
INSERT INTO sat_uso_cfdi (clave, descripcion, aplica_fisica, aplica_moral) VALUES
('G03', 'Gastos en general (Recomendado para servicios digitales)', true, true),
('D10', 'Pagos por servicios educativos (Capacitación/Cursos)', true, false), -- Solo Físicas
('S01', 'Sin efectos fiscales (Solo contabilidad)', true, true),
('CP01', 'Pagos', true, true)
ON CONFLICT (clave) DO NOTHING;

-- COMENTARIOS DOCUMENTACIÓN
COMMENT ON TABLE sat_uso_cfdi IS 'Catálogo SAT estricto para VideoBooster (SaaS)';

-- SEGURIDAD
ALTER TABLE sat_uso_cfdi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read USO CFDI" ON sat_uso_cfdi FOR SELECT USING (true);


-- 2. ACTUALIZAR TABLA PROFILES
-- --------------------------------------------------
-- Asegurar columnas necesarias
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS uso_cfdi TEXT DEFAULT 'G03',
ADD COLUMN IF NOT EXISTS metodo_pago_preferido TEXT DEFAULT '04'; -- 04 = Tarjeta de crédito

COMMENT ON COLUMN profiles.uso_cfdi IS 'Preferencia de facturación. Default G03 (SaaS)';

-- 3. LIMPIEZA DE DATOS EXISTENTES (Si hay basura, forzar a G03)
UPDATE public.profiles 
SET uso_cfdi = 'G03' 
WHERE uso_cfdi NOT IN ('G03', 'D10', 'S01', 'CP01');
