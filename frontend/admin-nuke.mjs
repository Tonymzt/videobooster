
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Hardcoded credentials for absolute certainty during debug
const supabaseUrl = 'https://sbdejytqnucpokrfrjzq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZGVqeXRxbnVjcG9rcmZyanpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA4MDA4OCwiZXhwIjoyMDg1NjU2MDg4fQ.qKYO6fv5ucwxbtFLDi6o8wqRAhI999tPXfMipddHFtY';

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Faltan credenciales en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function nukeUsers() {
    console.log('☢️  INICIANDO PROTOCOLO DE LIMPIEZA TOTAL DE USUARIOS...');

    // 1. Obtener todos los usuarios (paginado)
    let allUsers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });

        if (error) {
            console.error('❌ Error listando usuarios:', error.message);
            return;
        }

        allUsers = [...allUsers, ...users];
        if (users.length < 1000) {
            hasMore = false;
        } else {
            page++;
        }
    }

    console.log(`📋 Encontrados ${allUsers.length} usuarios para eliminar.`);

    if (allUsers.length === 0) {
        console.log('✅ La base de datos ya está limpia.');
        return;
    }

    // 2. Eliminar usuarios
    console.log('🔥 Eliminando usuarios...');

    for (const user of allUsers) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
            console.error(`❌ Falló eliminación de ${user.email}:`, error.message);
        } else {
            console.log(`✅ Eliminado: ${user.email} (${user.id})`);
        }
    }

    console.log('✨ LIMPIEZA COMPLETADA ✨');
    console.log('La tabla Profiles se limpiará automáticamente (Cascade Delete) si está configurada correctamente.');
}

nukeUsers();
