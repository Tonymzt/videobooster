
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA4MDA4OCwiZXhwIjoyMDg1NjU2MDg4fQ.qKYO6fv5ucwxbtFLDi6o8wqRAhI999tPXfMipddHFtY';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Falta URL o SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
}
console.log('🔑 Key cargada:', supabaseServiceKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmUser(email) {
    console.log(`🔍 Buscando usuario: ${email}...`);

    // 1. Obtener ID del usuario (Admin API)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Error listando usuarios:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ Usuario no encontrado. ¿Seguro que te registraste?');
        return;
    }

    console.log(`✅ Usuario encontrado: ${user.id}`);

    if (user.email_confirmed_at) {
        console.log('🎉 El usuario YA estaba confirmado.');
        return;
    }

    // 2. Confirmar usuario
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (updateError) {
        console.error('❌ Error confirmando usuario:', updateError);
    } else {
        console.log('🚀 ¡EXITO! Usuario confirmado manualmente.');
        console.log('👉 Ahora puedes iniciar sesión con tu contraseña.');
    }
}

// Ejecutar para Tony
confirmUser('tonyreyesmzt@gmail.com');
