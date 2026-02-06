/**
 * Script helper para listar voces disponibles en HeyGen
 * Ejecutar: node test/list-heygen-voices.js
 */
require('dotenv').config();
const axios = require('axios');

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE_URL = 'https://api.heygen.com/v1';

async function listVoices() {
    console.log('🔍 LISTANDO VOCES DISPONIBLES EN HEYGEN\n');
    console.log('═'.repeat(60));

    if (!HEYGEN_API_KEY) {
        console.error('❌ HEYGEN_API_KEY no configurada en .env');
        process.exit(1);
    }

    try {
        console.log('📤 Consultando voces...\n');

        // Endpoint para listar voces
        const response = await axios.get(
            `${HEYGEN_BASE_URL}/voices`,
            {
                headers: {
                    'X-Api-Key': HEYGEN_API_KEY,
                },
            }
        );

        const voices = response.data.data.voices;

        if (!voices || voices.length === 0) {
            console.log('⚠️ No se encontraron voces');
            return;
        }

        // Filtrar voces en español
        const spanishVoices = voices.filter(v =>
            v.language && (
                v.language.toLowerCase().includes('spanish') ||
                v.language.toLowerCase().includes('español') ||
                v.language_code === 'es' ||
                v.language_code === 'es-ES' ||
                v.language_code === 'es-MX'
            )
        );

        console.log(`✅ Encontradas ${spanishVoices.length} voces en español:\n`);
        console.log('─'.repeat(60));

        spanishVoices.forEach((voice, index) => {
            console.log(`\n${index + 1}. ${voice.display_name || voice.name}`);
            console.log(`   ID: ${voice.voice_id}`);
            console.log(`   Idioma: ${voice.language || voice.language_code}`);
            console.log(`   Género: ${voice.gender || 'N/A'}`);
            console.log(`   Acento: ${voice.accent || 'N/A'}`);
        });

        console.log('\n' + '─'.repeat(60));
        console.log('\n📋 VOCES RECOMENDADAS PARA .ENV:\n');

        // Seleccionar las primeras 2 voces (masculina y femenina si es posible)
        const maleVoice = spanishVoices.find(v => v.gender === 'male');
        const femaleVoice = spanishVoices.find(v => v.gender === 'female');

        if (maleVoice) {
            console.log(`# Voz masculina: ${maleVoice.display_name || maleVoice.name}`);
            console.log(`HEYGEN_VOICE_MALE=${maleVoice.voice_id}`);
        }

        if (femaleVoice) {
            console.log(`\n# Voz femenina: ${femaleVoice.display_name || femaleVoice.name}`);
            console.log(`HEYGEN_VOICE_FEMALE=${femaleVoice.voice_id}`);
        }

        console.log('\n' + '═'.repeat(60));
        console.log('\n💡 Copia estas líneas a tu archivo .env\n');

    } catch (error) {
        console.error('\n❌ Error al listar voces:');
        console.error(`   Mensaje: ${error.message}`);

        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

listVoices();
