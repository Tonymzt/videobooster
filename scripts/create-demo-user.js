/**
 * Script para crear usuario demo en Supabase
 */
require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoUser() {
    console.log('🔧 Creando usuario demo en Supabase...\n');

    const email = 'demo@videobooster.com';
    const password = 'demo123456';

    try {
        // Intentar crear el usuario
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Usuario Demo',
                }
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log('✅ El usuario demo ya existe');
                console.log('\n📧 Credenciales:');
                console.log(`   Email: ${email}`);
                console.log(`   Contraseña: ${password}`);
            } else {
                console.error('❌ Error:', error.message);
            }
        } else {
            console.log('✅ Usuario demo creado exitosamente');
            console.log('\n📧 Credenciales:');
            console.log(`   Email: ${email}`);
            console.log(`   Contraseña: ${password}`);
            console.log(`\n⚠️ Revisa tu email para confirmar la cuenta`);
        }
    } catch (err) {
        console.error('💥 Error:', err.message);
    }
}

createDemoUser();
