/**
 * videoComposer_motion.js - Compositor con Leonardo Motion
 * VANGUARDIA 3.2: Video Real con Movimiento Orgánico
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { createCanvas, loadImage } = require('canvas');
const { downloadToBuffer } = require('./utils/mediaDownloader');
const { uploadBuffer } = require('./storage');
const { VIDEO_CONFIG } = require('./config/video');
const { generateMotionVideo } = require('./services/motionGenerator');

/**
 * Crear archivo temporal
 */
async function createTempFile(buffer, extension) {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `vb_motion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`);
    await fs.writeFile(tempPath, buffer);
    return tempPath;
}

/**
 * Limpiar archivos temporales
 */
async function cleanupTempFiles(files) {
    for (const file of files) {
        try {
            await fs.unlink(file);
        } catch (err) {
            // Ignorar errores de limpieza
        }
    }
}

/**
 * VANGUARDIA 3.2: Crear escena con Leonardo Motion (Video Real)
 * 
 * Flujo:
 * 1. Componer imagen (fondo + producto + overlays) con Canvas
 * 2. Subir imagen a R2
 * 3. Enviar a Leonardo Motion para generar video con movimiento orgánico
 * 4. Agregar audio al video generado
 */
async function createLayeredSceneWithMotion(
    backgroundBuffer,
    productBuffer,
    audioBuffer,
    sceneIndex,
    price,
    productName,
    jobId
) {
    const tempFiles = [];
    const logger = require('./utils/logger');

    try {
        logger.info(`   🎬 Generando con Leonardo Motion...`);

        // ═══════════════════════════════════════════════════════════
        // PASO 1: COMPONER IMAGEN CON CANVAS
        // ═══════════════════════════════════════════════════════════
        logger.info(`   📐 Componiendo imagen (fondo + producto + overlays)...`);

        const canvas = createCanvas(1080, 1920);
        const ctx = canvas.getContext('2d');

        // 1.1: Dibujar fondo
        const backgroundImage = await loadImage(backgroundBuffer);

        // Escalar y centrar el fondo para cubrir todo el canvas
        const bgAspect = backgroundImage.width / backgroundImage.height;
        const canvasAspect = 1080 / 1920;

        let drawWidth, drawHeight, drawX, drawY;
        if (bgAspect > canvasAspect) {
            // Fondo más ancho, ajustar por altura
            drawHeight = 1920;
            drawWidth = drawHeight * bgAspect;
            drawX = (1080 - drawWidth) / 2;
            drawY = 0;
        } else {
            // Fondo más alto, ajustar por ancho
            drawWidth = 1080;
            drawHeight = drawWidth / bgAspect;
            drawX = 0;
            drawY = (1920 - drawHeight) / 2;
        }

        ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);

        // 1.2: Dibujar producto (centrado, 70% de altura)
        const productImage = await loadImage(productBuffer);
        const productHeight = 1920 * 0.7;
        const productWidth = (productImage.width / productImage.height) * productHeight;
        const productX = (1080 - productWidth) / 2;
        const productY = (1920 - productHeight) / 2;
        ctx.drawImage(productImage, productX, productY, productWidth, productHeight);

        // 1.3: Dibujar overlays de texto
        // Nombre del producto (arriba)
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        const displayName = productName.length > 40 ? productName.substring(0, 37) + '...' : productName;
        ctx.fillText(displayName, 540, 150);

        // Precio (abajo)
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 15;
        ctx.fillText(`$${price} MXN`, 540, 1800);

        // Convertir canvas a buffer
        const composedImageBuffer = canvas.toBuffer('image/png');
        logger.info(`   ✅ Imagen compuesta: ${(composedImageBuffer.length / 1024).toFixed(2)} KB`);

        // ═══════════════════════════════════════════════════════════
        // PASO 2: SUBIR IMAGEN A R2
        // ═══════════════════════════════════════════════════════════
        const imageFileName = `composed_scene_${jobId}_${sceneIndex}_${Date.now()}.png`;
        const imageUploadResult = await uploadBuffer(composedImageBuffer, imageFileName, 'image/png');

        if (!imageUploadResult.success) {
            throw new Error(`Error subiendo imagen compuesta: ${imageUploadResult.error}`);
        }

        const composedImageUrl = imageUploadResult.url;
        logger.info(`   ☁️ Imagen subida: ${composedImageUrl}`);

        // ═══════════════════════════════════════════════════════════
        // PASO 3: GENERAR VIDEO CON LEONARDO MOTION
        // ═══════════════════════════════════════════════════════════
        logger.info(`   🎬 Enviando a Leonardo Motion (motion_strength: 6)...`);

        const motionResult = await generateMotionVideo(composedImageUrl, jobId, 6);

        if (!motionResult.success) {
            logger.warn(`   ⚠️ Leonardo Motion falló: ${motionResult.error}`);
            throw new Error(`Leonardo Motion no disponible: ${motionResult.error}`);
        }

        const motionVideoUrl = motionResult.videoUrl;
        logger.info(`   ✅ Video con movimiento generado: ${motionVideoUrl}`);

        // ═══════════════════════════════════════════════════════════
        // PASO 4: DESCARGAR VIDEO Y AGREGAR AUDIO
        // ═══════════════════════════════════════════════════════════
        logger.info(`   🎵 Agregando audio al video...`);

        const motionVideoBuffer = await downloadToBuffer(motionVideoUrl);
        const motionVideoPath = await createTempFile(motionVideoBuffer, 'mp4');
        const audioPath = await createTempFile(audioBuffer, 'mp3');
        const outputPath = path.join(os.tmpdir(), `scene_motion_${sceneIndex}_${Date.now()}.mp4`);

        tempFiles.push(motionVideoPath, audioPath);

        // Obtener duración del audio
        const audioDuration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration);
            });
        });

        // Combinar video de Leonardo Motion con audio
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(motionVideoPath)
                .input(audioPath)
                .outputOptions([
                    '-map 0:v',  // Video de Leonardo Motion
                    '-map 1:a',  // Audio de ElevenLabs
                    `-c:v ${VIDEO_CONFIG.videoCodec}`,
                    `-c:a ${VIDEO_CONFIG.audioCodec}`,
                    `-t ${audioDuration}`,  // Duración del audio
                    '-shortest',  // Terminar cuando el más corto termine
                ])
                .output(outputPath)
                .on('end', () => {
                    logger.info(`   ✅ Escena ${sceneIndex} completada (con Motion)`);
                    resolve();
                })
                .on('error', (err) => {
                    logger.error(`   ❌ Error agregando audio: ${err.message}`);
                    reject(err);
                })
                .run();
        });

        await cleanupTempFiles(tempFiles);
        return outputPath;

    } catch (error) {
        logger.error(`   ❌ Error en createLayeredSceneWithMotion: ${error.message}`);
        await cleanupTempFiles(tempFiles);
        throw error;
    }
}

module.exports = {
    createLayeredSceneWithMotion,
};
