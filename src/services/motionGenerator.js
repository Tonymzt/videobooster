/**
 * Servicio de generación de movimiento con Leonardo AI Motion
 * Convierte imágenes estáticas en video con movimiento orgánico
 */
const axios = require('axios');
const logger = require('../utils/logger');
const { downloadToBuffer } = require('../utils/mediaDownloader');
const { uploadBuffer } = require('../storage');

const LEONARDO_CONFIG = {
    apiKey: process.env.LEONARDO_API_KEY,
    enabled: process.env.LEONARDO_ENABLED === 'true',
    baseUrl: 'https://cloud.leonardo.ai/api/rest/v1',
};

/**
 * Generar video con movimiento a partir de una imagen
 * @param {string} imageUrl - URL de la imagen compuesta (fondo + producto)
 * @param {string} jobId - ID del trabajo
 * @param {number} motionStrength - Intensidad del movimiento (1-10, recomendado: 6)
 * @returns {Promise<Object>} { success, videoUrl, generationId }
 */
async function generateMotionVideo(imageUrl, jobId, motionStrength = 6) {
    if (!LEONARDO_CONFIG.enabled) {
        logger.warn('⚠️ Leonardo Motion deshabilitado');
        return { success: false, reason: 'DISABLED' };
    }

    try {
        logger.info(`🎬 Generando video con Leonardo Motion`);
        logger.info(`   Imagen: ${imageUrl}`);
        logger.info(`   Motion Strength: ${motionStrength}`);

        // Paso 1: Iniciar generación de motion
        const requestPayload = {
            imageId: null, // Usaremos URL directa
            isPublic: false,
            isInitImage: false,
            isVariation: false,
            motionStrength: motionStrength, // 1-10 (6 = movimiento moderado y natural)
        };

        // Si Leonardo requiere subir la imagen primero, lo hacemos
        // Por ahora asumimos que acepta URL directa
        logger.info('\n📋 REQUEST PAYLOAD A LEONARDO MOTION:');
        logger.info(JSON.stringify(requestPayload, null, 2));
        logger.info('');

        const createResponse = await axios.post(
            `${LEONARDO_CONFIG.baseUrl}/generations-motion-svd`,
            {
                imageUrl: imageUrl, // URL pública de la imagen
                motionStrength: motionStrength,
                isPublic: false,
            },
            {
                headers: {
                    'Authorization': `Bearer ${LEONARDO_CONFIG.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        logger.info('📥 Respuesta de Leonardo Motion:');
        logger.info(JSON.stringify(createResponse.data, null, 2));
        logger.info('');

        const generationId = createResponse.data.sdGenerationJob?.generationId;

        if (!generationId) {
            throw new Error('No se recibió generationId de Leonardo Motion');
        }

        logger.info(`   ✅ Motion iniciado: ${generationId}`);

        // Paso 2: Polling hasta que complete
        let videoUrl = null;
        let attempts = 0;
        const maxAttempts = 60; // 2 minutos max (motion tarda ~30-60s)

        while (!videoUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;

            logger.info(`   ⏳ Generando motion... (${attempts}/${maxAttempts})`);

            const statusResponse = await axios.get(
                `${LEONARDO_CONFIG.baseUrl}/generations/${generationId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${LEONARDO_CONFIG.apiKey}`,
                    },
                }
            );

            const generation = statusResponse.data.generations_by_pk;
            const status = generation.status;

            logger.debug(`   Estado: ${status}`);

            if (status === 'COMPLETE') {
                // El video está en generated_videos o motionMP4URL
                const motionData = generation.generated_videos?.[0] || generation;
                videoUrl = motionData.motionMP4URL || motionData.url;

                logger.info(`   ✅ Motion generado en ${attempts * 2} segundos`);
                logger.info(`   🎬 URL de video: ${videoUrl}`);
            } else if (status === 'FAILED') {
                throw new Error('Generación de motion falló en Leonardo');
            }
        }

        if (!videoUrl) {
            throw new Error(`Timeout esperando motion (${maxAttempts * 2}s)`);
        }

        // Paso 3: Descargar y subir a R2
        logger.info(`   📥 Descargando video generado...`);
        const videoBuffer = await downloadToBuffer(videoUrl);
        logger.info(`   ✅ Descargado: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

        const fileName = `motion_scene_${jobId}_${Date.now()}.mp4`;
        const uploadResult = await uploadBuffer(videoBuffer, fileName, 'video/mp4');

        if (!uploadResult.success) {
            throw new Error(`Upload falló: ${uploadResult.error}`);
        }

        logger.info(`   ☁️ Motion subido a R2: ${uploadResult.url}`);

        return {
            success: true,
            videoUrl: uploadResult.url,
            generationId,
            duration: 4, // Leonardo Motion genera ~4 segundos
        };

    } catch (error) {
        logger.error(`❌ Error en Leonardo Motion:`);
        logger.error(`   Mensaje: ${error.message}`);

        if (error.response) {
            logger.error(`   Status: ${error.response.status}`);
            logger.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }

        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

/**
 * Verificar disponibilidad de Leonardo Motion
 */
function isMotionAvailable() {
    if (!LEONARDO_CONFIG.enabled) {
        return { available: false, reason: 'DISABLED_IN_CONFIG' };
    }
    if (!LEONARDO_CONFIG.apiKey) {
        return { available: false, reason: 'NO_API_KEY' };
    }
    return { available: true };
}

module.exports = {
    generateMotionVideo,
    isMotionAvailable,
};
