/**
 * Servicio de generación de avatar con HeyGen
 * ACTUALIZADO: Integración con ElevenLabs (Audio-Driven)
 */
const axios = require('axios');
const logger = require('../utils/logger');
const { downloadToBuffer } = require('../utils/mediaDownloader');
const { uploadBuffer } = require('../storage');

const HEYGEN_CONFIG = {
    apiKey: process.env.HEYGEN_API_KEY,
    enabled: process.env.HEYGEN_ENABLED === 'true',
    // Múltiples avatares disponibles
    avatarIds: [
        process.env.HEYGEN_AVATAR_ID_1,
        process.env.HEYGEN_AVATAR_ID_2,
        process.env.HEYGEN_AVATAR_ID_3,
        process.env.HEYGEN_AVATAR_ID_4,
    ].filter(Boolean),
    baseUrl: 'https://api.heygen.com/v2',
};

/**
 * Seleccionar avatar aleatorio
 */
function getRandomAvatar() {
    if (HEYGEN_CONFIG.avatarIds.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * HEYGEN_CONFIG.avatarIds.length);
    return HEYGEN_CONFIG.avatarIds[randomIndex];
}

/**
 * Generar script de intro para avatar
 */
function generateIntroScript(productName) {
    const shortName = productName.split(' ').slice(0, 4).join(' ');
    const scripts = [
        `¡Hola! Mira este increíble ${shortName}`,
        `Te presento ${shortName}. Te va a encantar`,
        `¿Buscas ${shortName}? Este es perfecto`,
        `Descubre ${shortName} que todos quieren`,
        `Checa ${shortName}. Es una maravilla`,
    ];
    return scripts[Math.floor(Math.random() * scripts.length)];
}

/**
 * Generar video de avatar con HeyGen usando Audio de ElevenLabs
 * @param {string} audioUrl - URL del audio generado por ElevenLabs
 * @param {string} jobId - ID del trabajo
 * @param {string} selectedAvatarId - (Opcional) ID de avatar específico
 */
async function generateAvatarWithAudio(audioUrl, jobId, selectedAvatarId = null) {
    if (!HEYGEN_CONFIG.enabled) {
        logger.warn('⚠️ HeyGen deshabilitado en config');
        return { success: false, reason: 'DISABLED' };
    }

    try {
        const selectedAvatar = selectedAvatarId || getRandomAvatar();

        if (!selectedAvatar) {
            logger.error('❌ No hay avatares configurados');
            return { success: false, reason: 'NO_AVATARS_CONFIGURED' };
        }

        logger.info(`🎭 Generando lip-sync con HeyGen`);
        logger.info(`   Avatar: ${selectedAvatar}`);
        logger.info(`   Audio: ${audioUrl}`);

        const requestPayload = {
            video_inputs: [
                {
                    character: {
                        type: 'avatar',
                        avatar_id: selectedAvatar,
                        avatar_style: 'normal',
                    },
                    voice: {
                        type: 'audio',
                        audio_url: audioUrl, // 🚀 USANDO ELEVENLABS
                    },
                    background: {
                        type: 'color',
                        value: '#000000',
                    },
                },
            ],
            dimension: {
                width: 1080,
                height: 1920,
            },
            aspect_ratio: '9:16',
            test: false,
        };

        // Paso 1: Crear generación
        const createResponse = await axios.post(
            `${HEYGEN_CONFIG.baseUrl}/video/generate`,
            requestPayload,
            {
                headers: {
                    'X-Api-Key': HEYGEN_CONFIG.apiKey,
                    'Content-Type': 'application/json',
                }
            }
        );

        const videoId = createResponse.data.data.video_id;
        logger.info(`   ✅ Generación iniciada: ${videoId}`);

        // Paso 2: Polling
        let finalVideoUrl = null;
        let attempts = 0;
        const maxAttempts = 60;

        while (!finalVideoUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            attempts++;

            const statusResponse = await axios.get(
                `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
                {
                    headers: { 'X-Api-Key': HEYGEN_CONFIG.apiKey }
                }
            );

            const status = statusResponse.data.data.status;
            if (status === 'completed') {
                finalVideoUrl = statusResponse.data.data.video_url;
                logger.info(`   ✅ Video generado en ${attempts * 3}s`);
            } else if (status === 'failed') {
                throw new Error(`HeyGen failed: ${JSON.stringify(statusResponse.data.data.error)}`);
            }
        }

        if (!finalVideoUrl) throw new Error('Timeout en HeyGen');

        // Paso 3: Subir a R2
        const videoBuffer = await downloadToBuffer(finalVideoUrl);
        const fileName = `avatar_intro_${jobId}_${Date.now()}.mp4`;
        const uploadResult = await uploadBuffer(videoBuffer, fileName, 'video/mp4');

        return {
            success: true,
            avatarUrl: uploadResult.url,
            videoId
        };

    } catch (error) {
        logger.error(`❌ Error en HeyGen Audio-Driven: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Mantener por compatibilidad pero apuntar a la lógica nueva si se requiere
async function generateAvatarIntro(productName, jobId) {
    // Esta función ahora es un wrapper o se puede integrar en el processor
    logger.warn('⚠️ Se recomienda usar generateAvatarWithAudio con ElevenLabs');
    return { success: false, reason: 'DEPRECATED_USE_AUDIO_DRIVEN' };
}

module.exports = {
    generateAvatarWithAudio,
    generateIntroScript,
    getRandomAvatar,
    isHeyGenAvailable: () => HEYGEN_CONFIG.enabled && HEYGEN_CONFIG.apiKey
};
