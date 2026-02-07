-- 1. Habilitar RLS (Row Level Security)
ALTER TABLE public.fiscal_data_access_log 
ENABLE ROW LEVEL SECURITY;

-- 2. Política para service_role (backend API)
CREATE POLICY "API Backend - Full Access" 
ON public.fiscal_data_access_log 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 3. Política para usuarios autenticados (solo lectura de sus propios logs)
CREATE POLICY "Users Read Own Logs" 
ON public.fiscal_data_access_log 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Fixes para funciones de encriptación
-- Fijar search_path en función decrypt_sensitive_data
ALTER FUNCTION public.decrypt_sensitive_data(text, text) 
SET search_path = public;

-- También en encrypt_sensitive_data por consistencia
ALTER FUNCTION public.encrypt_sensitive_data(text, text) 
SET search_path = public;
