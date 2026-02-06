-- ==========================================
-- ☢️ PROTOCOLO DE LIMPIEZA TOTAL ☢️
-- ==========================================
-- ADVERTENCIA: Esto borrará TODOS los usuarios y sus datos asociados.
-- Usar solo en desarrollo para reiniciar pruebas.

BEGIN;

-- 1. Desactivar triggers temporalmente para evitar conflictos
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 2. Borrar perfiles públicos (Cascada debería encargarse, pero por seguridad)
TRUNCATE TABLE public.profiles CASCADE;

-- 3. Borrar usuarios de autenticación (Nivel ROOT)
-- Nota: Esto borrará también sesiones, identidades y objetos vinculados por Foreign Keys
DELETE FROM auth.users;

-- 4. Reactivar triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

COMMIT;

-- Verificación final
SELECT count(*) as usuarios_restantes FROM auth.users;
