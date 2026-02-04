/**
 * voiceGenerator.js - Módulo de generación de voz con ElevenLabs
 * Flujo: Texto -> Audio Buffer -> Upload R2 -> URL
 */

const axios = require('axios');
const { uploadBuffer } = require('./storage');

/**
 * Configuración de ElevenLabs
 */
const voiceConfig = {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'ONwSjVzE9mJ6GatM6pCK',
    apiUrl: 'https://api.elevenlabs.io/v1',
};

/**
 * Valida configuración de ElevenLabs
 * @throws {Error} Si falta la API key
 */
function validateVoiceConfig() {
    if (!voiceConfig.apiKey) {
        throw new Error('ELEVENLABS_API_KEY no está configurada en .env');
    }
}

/**
 * Genera audio desde texto y lo sube a R2
 * @param {string} text - Texto a convertir en voz
 * @param {string} fileName - Nombre opcional para el archivo
 * @returns {Promise<Object>} { success, audioUrl, duration, error }
 */
async function generateVoiceAndUpload(text, fileName = null) {
    try {
        validateVoiceConfig();

        if (!text || text.trim().length === 0) {
            throw new Error('El texto no puede estar vacío');
        }

        console.log(`🎙️ Generando audio para: "${text.substring(0, 50)}..."`);

        // Configuración de voz optimizada para español
        const voiceSettings = {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
        };

        // Llamada a la API de ElevenLabs
        const response = await axios.post(
            `${voiceConfig.apiUrl}/text-to-speech/${voiceConfig.voiceId}`,
            {
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: voiceSettings,
            },
            {
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': voiceConfig.apiKey,
                },
                responseType: 'arraybuffer', // Importante: recibir como buffer
            }
        );

        // Convertir arraybuffer a Buffer de Node.js
        const audioBuffer = Buffer.from(response.data);

        console.log(`✅ Audio generado: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

        // Subir a R2
        const uploadFileName = fileName || `voice_${Date.now()}.mp3`;
        const uploadResult = await uploadBuffer(audioBuffer, uploadFileName, 'audio/mpeg');

        if (!uploadResult.success) {
            throw new Error(`Error al subir audio: ${uploadResult.error}`);
        }

        // Calcular duración aproximada (MP3 bitrate promedio: 128 kbps)
        const estimatedDuration = (audioBuffer.length * 8) / (128 * 1000); // segundos

        return {
            success: true,
            audioUrl: uploadResult.url,
            audioKey: uploadResult.key,
            size: audioBuffer.length,
            duration: Math.round(estimatedDuration),
            text: text,
            generatedAt: new Date().toISOString(),
        };

    } catch (error) {
        console.error('❌ Error en generateVoiceAndUpload:', error.message);

        // Manejo de errores específicos de ElevenLabs
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                return {
                    success: false,
                    error: 'API key de ElevenLabs inválida',
                    code: 'INVALID_API_KEY',
                };
            }

            if (status === 404) {
                return {
                    success: false,
                    error: `Voice ID no encontrado: ${voiceConfig.voiceId}`,
                    code: 'VOICE_NOT_FOUND',
                };
            }

            if (status === 429) {
                return {
                    success: false,
                    error: 'Límite de rate de ElevenLabs excedido',
                    code: 'RATE_LIMIT_EXCEEDED',
                };
            }

            return {
                success: false,
                error: `Error de API ElevenLabs: ${status} - ${JSON.stringify(data)}`,
                code: 'ELEVENLABS_API_ERROR',
            };
        }

        return {
            success: false,
            error: error.message,
            code: error.code || 'VOICE_GENERATION_ERROR',
        };
    }
}

/**
 * Genera audio para múltiples escenas de un script
 * @param {Array} scenes - Array de objetos { text, visual_cue }
 * @returns {Promise<Object>} { success, audios, errors }
 */
async function generateScriptAudios(scenes) {
    try {
        if (!Array.isArray(scenes) || scenes.length === 0) {
            throw new Error('El array de escenas no puede estar vacío');
        }

        console.log(`🎬 Generando audios para ${scenes.length} escenas...`);

        const results = [];
        const errors = [];

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const fileName = `scene_${i + 1}_${Date.now()}.mp3`;

            console.log(`\n🎙️ Escena ${i + 1}/${scenes.length}`);

            const result = await generateVoiceAndUpload(scene.text, fileName);

            if (result.success) {
                results.push({
                    sceneIndex: i,
                    ...result,
                    visual_cue: scene.visual_cue,
                });
            } else {
                errors.push({
                    sceneIndex: i,
                    text: scene.text,
                    error: result.error,
                });
            }

            // Delay entre llamadas para evitar rate limiting
            if (i < scenes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return {
            success: errors.length === 0,
            audios: results,
            errors: errors.length > 0 ? errors : undefined,
            totalScenes: scenes.length,
            successCount: results.length,
        };

    } catch (error) {
        console.error('❌ Error en generateScriptAudios:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}

module.exports = {
    generateVoiceAndUpload,
    generateScriptAudios,
};
