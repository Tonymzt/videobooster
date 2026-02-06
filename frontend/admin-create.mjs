
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Faltan variables de entorno (SUPABASE_URL o SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TARGET_USER = {
    email: 'tonyreyesmzt@gmail.com',
    password: 'VideoBooster2026!', // Contraseña Fuerte 💪
    user_metadata: {
        username: 'tonymzt',
        full_name: 'Tony Reyes',
        account_type: 'business' // Negocio 🏢
    },
    email_confirm: true // Nace confirmado ✨
};

async function createMasterUser() {
    console.log(`\n🏗️  CREANDO USUARIO MAESTRO: ${TARGET_USER.email}...`);

    try {
        // 1. Verificar si existe (y borrarlo si es necesario para asegurar limpieza)
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === TARGET_USER.email);

        if (existingUser) {
            console.log('⚠️  El usuario ya existe. Eliminando para recrear limpio...');
            await supabase.auth.admin.deleteUser(existingUser.id);
            console.log('🗑️  Usuario anterior eliminado.');
        }

        // 2. Crear Usuario
        const { data, error } = await supabase.auth.admin.createUser({
            email: TARGET_USER.email,
            password: TARGET_USER.password,
            email_confirm: true, // Importante: Confirmado automáticamente
            user_metadata: TARGET_USER.user_metadata
        });

        if (error) throw error;

        console.log(`
✅ ¡USUARIO CREADO CON ÉXITO!
-------------------------------------------
👤 Email:    ${TARGET_USER.email}
🔑 Password: ${TARGET_USER.password}
🏢 Tipo:     ${TARGET_USER.user_metadata.account_type}
-------------------------------------------
🚀 YA PUEDES INICIAR SESIÓN (Login) DIRECTAMENTE.
        `);

    } catch (error) {
        console.error('❌ Error creando usuario:', error.message);
    }
}

createMasterUser();
