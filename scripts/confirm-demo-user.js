/**
 * Script para confirmar manualmente al usuario demo
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmUser() {
    console.log('🔧 Confirmando usuario demo en Supabase...');

    const email = 'demo@videobooster.com';

    try {
        // 1. Obtener el ID del usuario
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const demoUser = users.find(u => u.email === email);

        if (!demoUser) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        // 2. Confirmar el correo
        const { data, error } = await supabase.auth.admin.updateUserById(
            demoUser.id,
            { email_confirm: true }
        );

        if (error) throw error;

        console.log(`✅ Usuario ${email} confirmado exitosamente.`);
        console.log('\nYa puedes iniciar sesión en el dashboard.');

    } catch (err) {
        console.error('💥 Error:', err.message);
    }
}

confirmUser();
