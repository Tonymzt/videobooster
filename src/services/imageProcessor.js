/**
 * Servicio de procesamiento de imágenes
 * - Background removal con Remove.bg
 * - Fallback a imágenes originales si falla
 */

const https = require('https');
const { Buffer } = require('buffer');
const logger = require('../utils/logger');
const { downloadToBuffer } = require('../utils/mediaDownloader');
const { uploadBuffer } = require('../storage');

/**
 * Configuración de Remove.bg
 */
const REMOVEBG_CONFIG = {
    apiKey: process.env.REMOVE_BG_API_KEY,
    enabled: process.env.REMOVEBG_ENABLED === 'true',
    apiUrl: 'https://api.remove.bg/v1.0/removebg',
};

/**
 * Estadísticas de uso (para tracking)
 */
let stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
};

/**
 * Obtener estadísticas de uso
 */
function getStats() {
    return { ...stats };
}

/**
 * Resetear estadísticas
 */
function resetStats() {
    stats = { total: 0, success: 0, failed: 0, skipped: 0 };
}

/**
 * Verificar si el servicio está habilitado y configurado
 */
function isRemoveBgAvailable() {
    if (!REMOVEBG_CONFIG.enabled) {
        return { available: false, reason: 'DISABLED_IN_CONFIG' };
    }

    if (!REMOVEBG_CONFIG.apiKey || REMOVEBG_CONFIG.apiKey.includes('tu-key-aqui')) {
        return { available: false, reason: 'NO_API_KEY' };
    }

    return { available: true };
}

/**
 * Remover fondo de una imagen usando Remove.bg API
 * @param {Buffer} imageBuffer - Buffer de la imagen original
 * @returns {Promise<Object>} { success, buffer, error }
 */
async function removeBackground(imageBuffer) {
    stats.total++;

    return new Promise((resolve) => {
        const formData = {
            image_file_b64: imageBuffer.toString('base64'),
            size: 'regular', // 'regular' = gratis, 'hd' = créditos extra
            format: 'png',   // Mantener transparencia
        };

        const postData = JSON.stringify(formData);

        const options = {
            method: 'POST',
            hostname: 'api.remove.bg',
            path: '/v1.0/removebg',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': REMOVEBG_CONFIG.apiKey,
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = https.request(options, (res) => {
            const chunks = [];

            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const buffer = Buffer.concat(chunks);

                if (res.statusCode === 200) {
                    stats.success++;
                    logger.info(`✅ Background removed successfully (${buffer.length} bytes)`);
                    resolve({
                        success: true,
                        buffer,
                        originalSize: imageBuffer.length,
                        processedSize: buffer.length,
                    });
                } else {
                    // Error de API
                    stats.failed++;
                    let errorMessage = 'Unknown error';
                    try {
                        const errorData = JSON.parse(buffer.toString());
                        errorMessage = errorData.errors?.[0]?.title || errorMessage;
                    } catch (e) {
                        errorMessage = buffer.toString().substring(0, 100);
                    }

                    logger.warn(`⚠️ Remove.bg API error (${res.statusCode}): ${errorMessage}`);

                    // Casos especiales
                    if (res.statusCode === 403) {
                        logger.error('🚫 Remove.bg: API Key inválida o sin créditos');
                    } else if (res.statusCode === 429) {
                        logger.error('🚫 Remove.bg: Rate limit excedido');
                    }

                    resolve({
                        success: false,
                        error: errorMessage,
                        statusCode: res.statusCode,
                    });
                }
            });
        });

        req.on('error', (error) => {
            stats.failed++;
            logger.error(`❌ Remove.bg request error: ${error.message}`);
            resolve({
                success: false,
                error: error.message,
            });
        });

        // Timeout de 30 segundos
        req.setTimeout(30000, () => {
            stats.failed++;
            req.destroy();
            logger.error('❌ Remove.bg request timeout');
            resolve({
                success: false,
                error: 'Request timeout',
            });
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Procesar un array de URLs de imágenes
 * - Descarga cada imagen
 * - Intenta remover el fondo
 * - Si falla, usa la original
 * - Sube las procesadas a R2
 * 
 * @param {Array<string>} imageUrls - URLs de las imágenes originales
 * @param {string} productId - ID del producto (para nombrar archivos)
 * @returns {Promise<Object>} { success, images, stats }
 */
async function processProductImages(imageUrls, productId) {
    logger.info(`\n🖼️ Procesando ${imageUrls.length} imágenes del producto...`);

    // Verificar disponibilidad del servicio
    const availability = isRemoveBgAvailable();

    if (!availability.available) {
        logger.warn(`⚠️ Remove.bg no disponible: ${availability.reason}`);
        logger.warn(`   → Usando imágenes originales sin procesar`);
        stats.skipped += imageUrls.length;

        // Retornar URLs originales sin procesar
        return {
            success: true,
            images: imageUrls.map((url, i) => ({
                originalUrl: url,
                processedUrl: url, // Mismo URL
                index: i,
                processed: false,
                reason: availability.reason,
            })),
            stats: getStats(),
        };
    }

    const results = [];

    // Limitar número de imágenes a procesar para ahorrar créditos (máx 6)
    const imagesToProcess = imageUrls.slice(0, 6);

    for (let i = 0; i < imagesToProcess.length; i++) {
        const url = imagesToProcess[i];
        logger.info(`\n📥 Imagen ${i + 1}/${imagesToProcess.length}`);
        logger.info(`   URL: ${url.substring(0, 60)}...`);

        try {
            // Paso 1: Descargar imagen original
            const originalBuffer = await downloadToBuffer(url);
            logger.info(`   ✅ Descargada: ${(originalBuffer.length / 1024).toFixed(2)} KB`);

            // Paso 2: Intentar remover fondo
            logger.info(`   🎨 Removiendo fondo...`);
            const result = await removeBackground(originalBuffer);

            let finalBuffer;
            let processed = false;
            let failReason = null;

            if (result.success) {
                finalBuffer = result.buffer;
                processed = true;
                logger.info(`   ✅ Fondo removido: ${(result.processedSize / 1024).toFixed(2)} KB`);
            } else {
                // Usar imagen original si falla
                finalBuffer = originalBuffer;
                processed = false;
                failReason = result.error;
                logger.warn(`   ⚠️ Usando imagen original (motivo: ${result.error})`);
            }

            // Paso 3: Subir a R2
            const fileName = `product_${productId}_img_${i + 1}_${processed ? 'nobg' : 'original'}.png`;
            const uploadResult = await uploadBuffer(
                finalBuffer,
                fileName,
                'image/png'
            );

            if (!uploadResult.success) {
                throw new Error(`Upload failed: ${uploadResult.error}`);
            }

            logger.info(`   ☁️ Subida a R2: ${uploadResult.url}`);

            results.push({
                originalUrl: url,
                processedUrl: uploadResult.url,
                index: i,
                processed,
                failReason,
                size: finalBuffer.length,
            });

        } catch (error) {
            logger.error(`   ❌ Error procesando imagen ${i + 1}: ${error.message}`);
            stats.failed++;

            // En caso de error total, usar URL original
            results.push({
                originalUrl: url,
                processedUrl: url, // Fallback a original
                index: i,
                processed: false,
                failReason: error.message,
                error: true,
            });
        }
    }

    // Resumen
    const processedCount = results.filter(r => r.processed).length;
    const fallbackCount = results.filter(r => !r.processed).length;

    logger.info(`\n📊 RESUMEN DE PROCESAMIENTO:`);
    logger.info(`   Total: ${imagesToProcess.length}`);
    logger.info(`   Procesadas: ${processedCount} (fondo removido)`);
    logger.info(`   Originales: ${fallbackCount} (fallback)`);
    logger.info(`   URLs finales: ${results.length}`);

    return {
        success: true,
        images: results,
        stats: getStats(),
        summary: {
            total: imagesToProcess.length,
            processed: processedCount,
            fallback: fallbackCount,
        },
    };
}

/**
 * Procesar una sola imagen (versión simplificada)
 */
async function processSingleImage(imageUrl, productId, index = 0) {
    const result = await processProductImages([imageUrl], productId);
    return result.images[0];
}

module.exports = {
    removeBackground,
    processProductImages,
    processSingleImage,
    isRemoveBgAvailable,
    getStats,
    resetStats,
};
