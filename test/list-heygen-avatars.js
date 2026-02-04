/**
 * Script helper para listar avatares disponibles en HeyGen
 * Ejecutar: node test/list-heygen-avatars.js
 */
require('dotenv').config();
const axios = require('axios');

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE_URL = 'https://api.heygen.com/v2';

async function listAvatars() {
    console.log('🔍 LISTANDO AVATARES DISPONIBLES EN HEYGEN\n');
    console.log('═'.repeat(60));

    if (!HEYGEN_API_KEY) {
        console.error('❌ HEYGEN_API_KEY no configurada en .env');
        process.exit(1);
    }

    try {
        console.log('📤 Consultando avatares...\n');

        // Endpoint para listar avatares
        const response = await axios.get(
            `${HEYGEN_BASE_URL}/avatars`,
            {
                headers: {
                    'X-Api-Key': HEYGEN_API_KEY,
                },
            }
        );

        const avatars = response.data.data.avatars;

        if (!avatars || avatars.length === 0) {
            console.log('⚠️ No se encontraron avatares en esta cuenta');
            console.log('\n💡 Crea avatares en: https://app.heygen.com/avatars\n');
            return;
        }

        console.log(`✅ Encontrados ${avatars.length} avatares:\n`);
        console.log('─'.repeat(60));

        avatars.forEach((avatar, index) => {
            console.log(`\n${index + 1}. ${avatar.avatar_name || 'Sin nombre'}`);
            console.log(`   ID: ${avatar.avatar_id}`);
            console.log(`   Tipo: ${avatar.avatar_type || 'N/A'}`);
            console.log(`   Género: ${avatar.gender || 'N/A'}`);
            console.log(`   Preview: ${avatar.preview_image_url || 'N/A'}`);
        });

        console.log('\n' + '─'.repeat(60));
        console.log('\n📋 CONFIGURACIÓN PARA .ENV:\n');

        // Tomar los primeros 4 avatares
        const selectedAvatars = avatars.slice(0, 4);

        selectedAvatars.forEach((avatar, index) => {
            console.log(`HEYGEN_AVATAR_ID_${index + 1}=${avatar.avatar_id}`);
        });

        console.log('\n' + '═'.repeat(60));
        console.log('\n💡 Copia estas líneas a tu archivo .env\n');

    } catch (error) {
        console.error('\n❌ Error al listar avatares:');
        console.error(`   Mensaje: ${error.message}`);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

listAvatars();
