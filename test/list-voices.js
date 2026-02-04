/**
 * list-voices.js - Script para listar las voces disponibles en ElevenLabs
 */

require('dotenv').config();
const axios = require('axios');

async function listVoices() {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            console.error('❌ ELEVENLABS_API_KEY no está configurada en .env');
            process.exit(1);
        }

        console.log('🎙️ Listando voces disponibles en ElevenLabs...\n');

        const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': apiKey,
            },
        });

        const voices = response.data.voices;

        console.log(`✅ Se encontraron ${voices.length} voces:\n`);
        console.log('═'.repeat(80));

        voices.forEach((voice, index) => {
            console.log(`\n${index + 1}. ${voice.name}`);
            console.log(`   ID: ${voice.voice_id}`);
            console.log(`   Categoría: ${voice.category || 'N/A'}`);
            console.log(`   Idiomas: ${voice.labels?.language || 'N/A'}`);
            console.log(`   Descripción: ${voice.labels?.description || 'N/A'}`);
        });

        console.log('\n' + '═'.repeat(80));
        console.log('\n💡 Para usar una voz, copia su ID y actualiza ELEVENLABS_VOICE_ID en .env');

    } catch (error) {
        console.error('❌ Error al listar voces:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        process.exit(1);
    }
}

listVoices();
