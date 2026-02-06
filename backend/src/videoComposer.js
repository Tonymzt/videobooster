/**
 * videoComposer.js - Compositor de Video PRO - VideoBooster MVP
 * Ensambla imágenes + audios + efectos dinámicos en video vertical 9:16
 * Usa Overlays de Canvas y Efectos Ken Burns Variados
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { downloadToBuffer } = require('./utils/mediaDownloader');
const { checkFFmpegInstallation } = require('./utils/ffmpegHelpers'); // Solo checkFFmpeg
const { uploadBuffer } = require('./storage');
const { VIDEO_CONFIG } = require('./config/video');

// Nuevos módulos PRO
const { generatePriceOverlay, generateProductNameOverlay } = require('./utils/textOverlay');
const { generateEffectSequence, getKenBurnsEffect } = require('./utils/kenBurnsEffects');

/**
 * Valida el input del compositor
 */
function validateComposerInput(scriptData, productData) {
    if (!scriptData || !scriptData.scenes || !Array.isArray(scriptData.scenes)) {
        throw new Error('scriptData.scenes debe ser un array');
    }

    if (scriptData.scenes.length === 0) {
        throw new Error('El script no tiene escenas');
    }

    // Validar que cada escena tenga audioUrl
    for (let i = 0; i < scriptData.scenes.length; i++) {
        if (!scriptData.scenes[i].audioUrl) {
            throw new Error(`Escena ${i + 1} no tiene audioUrl`);
        }
    }

    if (!productData || !productData.images || productData.images.length === 0) {
        throw new Error('productData.images debe tener al menos una imagen');
    }

    if (productData.price === undefined) {
        // Si no hay precio, asignar 0 o manejarlo. Pero validateComposerInput original pedia número.
        // productData.price puede ser string en scraper. Convertir si es necesario.
    }
}

/**
 * Crea un archivo temporal
 */
async function createTempFile(buffer, extension) {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `vb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`);
    await fs.writeFile(tempPath, buffer);
    return tempPath;
}

/**
 * Limpia archivos temporales
 */
async function cleanupTempFiles(files) {
    for (const file of files) {
        try {
            await fs.unlink(file);
        } catch (err) {
            console.warn(`⚠️ No se pudo limpiar ${file}:`, err.message);
        }
    }
}

/**
 * Crea un video de una escena con overlay de imagen (en lugar de drawtext)
 */
async function createSceneVideo(imageBuffer, audioBuffer, sceneIndex, price, productName, effectType) {
    const tempFiles = [];

    try {
        // Crear archivos temporales
        const imagePath = await createTempFile(imageBuffer, 'jpg');
        const audioPath = await createTempFile(audioBuffer, 'mp3');
        const outputPath = path.join(os.tmpdir(), `scene_${sceneIndex}_${Date.now()}.mp4`);

        tempFiles.push(imagePath, audioPath);

        // Generar overlays de texto con Canvas
        const priceOverlayPath = await generatePriceOverlay(price, productName);
        const nameOverlayPath = await generateProductNameOverlay(productName);
        tempFiles.push(priceOverlayPath, nameOverlayPath);

        console.log(`🎬 Renderizando escena ${sceneIndex} con efecto: ${effectType}...`);

        // Obtener duración del audio para calcular frames exactos
        const audioDuration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration);
            });
        });

        // Asegurar duración mínima (ej 3s)
        const duration = Math.max(audioDuration, 3);

        // Generar efecto Ken Burns específico con la duración correcta
        const kenBurnsFilter = getKenBurnsEffect(effectType, duration, VIDEO_CONFIG.width, VIDEO_CONFIG.height);

        return new Promise((resolve, reject) => {
            const command = ffmpeg()
                .input(imagePath)
                .loop(duration) // Loop por la duración del audio (+ margen)
                .input(audioPath)
                .input(priceOverlayPath) // Input 2: Precio
                .input(nameOverlayPath)  // Input 3: Nombre
                .complexFilter([
                    // Paso 1: Escalar y cropear imagen base [base]
                    `[0:v]scale=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}:force_original_aspect_ratio=increase,crop=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}[base]`,

                    // Paso 2: Aplicar Ken Burns [moving]
                    `[base]${kenBurnsFilter}[moving]`,

                    // Paso 3: Overlay de nombre del producto (arriba) [withname]
                    `[moving][3:v]overlay=0:0[withname]`,

                    // Paso 4: Overlay de precio (abajo) [final]
                    `[withname][2:v]overlay=0:0[final]`
                ])
                .outputOptions([
                    `-map [final]`,
                    `-map 1:a`, // Audio del input 1
                    `-c:v ${VIDEO_CONFIG.videoCodec}`,
                    `-preset fast`,
                    `-b:v ${VIDEO_CONFIG.videoBitrate}`,
                    `-c:a ${VIDEO_CONFIG.audioCodec}`,
                    `-b:a ${VIDEO_CONFIG.audioBitrate}`,
                    `-t ${duration}`, // Cortar exactamente a la duración
                    `-r ${VIDEO_CONFIG.fps}`,
                ])
                .output(outputPath);

            command
                .on('start', (cmd) => {
                    // console.log(`   FFmpeg iniciado...`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r   Progreso: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', async () => {
                    console.log(`\n   ✅ Escena ${sceneIndex} completada (${duration.toFixed(1)}s)`);
                    await cleanupTempFiles(tempFiles);
                    resolve(outputPath);
                })
                .on('error', async (err) => {
                    console.error(`\n   ❌ Error en escena ${sceneIndex}:`, err.message);
                    await cleanupTempFiles(tempFiles);
                    reject(err);
                })
                .run();
        });

    } catch (error) {
        await cleanupTempFiles(tempFiles);
        throw error;
    }
}

/**
 * Concatena múltiples videos en uno solo
 */
async function concatenateVideos(videoPaths) {
    const outputPath = path.join(os.tmpdir(), `final_${Date.now()}.mp4`);
    const listPath = path.join(os.tmpdir(), `concat_list_${Date.now()}.txt`);

    // Crear archivo de lista para FFmpeg
    const listContent = videoPaths.map(p => `file '${p}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy']) // Copy codec (rápido)
            .output(outputPath)
            .on('end', async () => {
                await fs.unlink(listPath);
                resolve(outputPath);
            })
            .on('error', async (err) => {
                await fs.unlink(listPath);
                reject(err);
            })
            .run();
    });
}

/**
 * Función principal: Distribuir imágenes entre escenas
 */
async function composeVideo(scriptData, productData) {
    const tempFiles = [];

    try {
        await checkFFmpegInstallation();
        validateComposerInput(scriptData, productData);

        console.log('\n🎥 INICIANDO COMPOSICIÓN DE VIDEO DINÁMICA');
        console.log('═'.repeat(60));
        console.log(`📊 Escenas: ${scriptData.scenes.length}`);
        console.log(`🖼️ Imágenes disponibles: ${productData.images.length}`);
        console.log(`💰 Precio: $${productData.price} MXN`);
        console.log(`📦 Producto: ${productData.title.substring(0, 50)}...\n`);

        // Descargar audios
        console.log('📥 Descargando audios...');
        const audioUrls = scriptData.scenes.map(s => s.audioUrl);
        const audioBuffers = await Promise.all(audioUrls.map(url => downloadToBuffer(url)));

        // Descargar TODAS las imágenes disponibles (hasta 6)
        console.log('📥 Descargando imágenes...');
        const imageBuffers = await Promise.all(
            productData.images.map(url => downloadToBuffer(url))
        );

        console.log(`✅ Descargadas ${imageBuffers.length} imágenes\n`);

        if (imageBuffers.length === 0) {
            throw new Error("No se pudieron descargar imágenes");
        }

        // Generar secuencia de efectos variados
        const effectSequence = generateEffectSequence(scriptData.scenes.length);
        console.log('🎬 Efectos Ken Burns asignados:');
        effectSequence.forEach((effect, i) => {
            console.log(`   Escena ${i + 1}: ${effect}`);
        });
        console.log('');

        // Renderizar cada escena
        console.log('🎬 Renderizando escenas...\n');
        const sceneVideos = [];

        for (let i = 0; i < scriptData.scenes.length; i++) {
            // Distribuir imágenes: rotar entre las disponibles
            const imageIndex = i % imageBuffers.length;
            const effectType = effectSequence[i];

            console.log(`📌 Escena ${i + 1}/${scriptData.scenes.length}`);
            console.log(`   Imagen: ${imageIndex + 1}/${imageBuffers.length}`);
            console.log(`   Efecto: ${effectType}`);

            const sceneVideo = await createSceneVideo(
                imageBuffers[imageIndex],
                audioBuffers[i],
                i + 1,
                productData.price,
                productData.title,
                effectType
            );

            sceneVideos.push(sceneVideo);
            tempFiles.push(sceneVideo);
            console.log('');
        }

        // Concatenar
        console.log('🔗 Ensamblando video final...');
        const finalVideoPath = await concatenateVideos(sceneVideos);
        tempFiles.push(finalVideoPath);

        // Subir a R2
        console.log('☁️ Subiendo a Cloudflare R2...');
        const finalBuffer = await fs.readFile(finalVideoPath);
        const fileName = `video_${Date.now()}.mp4`;

        const uploadResult = await uploadBuffer(finalBuffer, fileName, 'video/mp4');

        if (!uploadResult.success) {
            throw new Error(`Error al subir video: ${uploadResult.error}`);
        }

        // Limpiar
        console.log('\n🗑️ Limpiando archivos temporales...');
        await cleanupTempFiles(tempFiles);

        console.log('\n🎉 VIDEO DINÁMICO COMPLETADO');
        console.log('═'.repeat(60));

        return {
            success: true,
            videoUrl: uploadResult.url,
            videoKey: uploadResult.key,
            size: uploadResult.size,
            duration: scriptData.scenes.length * 5, // Estimado
            scenes: scriptData.scenes.length,
            images: imageBuffers.length,
            effects: effectSequence,
            completedAt: new Date().toISOString(),
        };

    } catch (error) {
        console.error('\n💥 ERROR EN COMPOSICIÓN:', error.message);
        console.error(error.stack);

        if (tempFiles.length > 0) {
            await cleanupTempFiles(tempFiles);
        }

        return {
            success: false,
            error: error.message,
            code: 'VIDEO_COMPOSITION_ERROR',
        };
    }
}

/**
 * VANGUARDIA 3.1: Crear escena con 3 capas (Fondo IA + Producto + Overlays)
 */
async function createLayeredScene(
    backgroundBuffer,
    productBuffer,
    audioBuffer,
    sceneIndex,
    price,
    productName,
    effectType
) {
    const tempFiles = [];

    try {
        // Crear archivos temporales
        const backgroundPath = await createTempFile(backgroundBuffer, 'png');
        const productPath = await createTempFile(productBuffer, 'png');
        const audioPath = await createTempFile(audioBuffer, 'mp3');
        const outputPath = path.join(os.tmpdir(), `scene_layered_${sceneIndex}_${Date.now()}.mp4`);

        tempFiles.push(backgroundPath, productPath, audioPath);

        // Generar overlays
        const priceOverlayPath = await generatePriceOverlay(price, productName);
        const nameOverlayPath = await generateProductNameOverlay(productName);
        tempFiles.push(priceOverlayPath, nameOverlayPath);

        console.log(`🎬 Renderizando escena ${sceneIndex} (3 capas + overlays)...`);

        // Obtener duración del audio
        const audioDuration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration);
            });
        });

        const duration = Math.max(audioDuration, 3);
        const kenBurnsFilter = getKenBurnsEffect(effectType, duration, VIDEO_CONFIG.width, VIDEO_CONFIG.height);

        return new Promise((resolve, reject) => {
            const command = ffmpeg()
                .input(backgroundPath)  // Input 0: Fondo IA
                .loop(duration)
                .input(productPath)     // Input 1: Producto transparente
                .loop(duration)
                .input(audioPath)       // Input 2: Audio
                .input(priceOverlayPath)  // Input 3: Overlay precio
                .input(nameOverlayPath)   // Input 4: Overlay nombre
                .complexFilter([
                    // Paso 1: Escalar fondo a 9:16
                    `[0:v]scale=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}:force_original_aspect_ratio=increase,crop=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}[bg]`,

                    // Paso 2: Aplicar Ken Burns al fondo
                    `[bg]${kenBurnsFilter}[bg_moving]`,

                    // Paso 3: Escalar producto (mantener aspect ratio, centrado, 70% altura)
                    `[1:v]scale=w='if(gt(iw/ih,9/16),${VIDEO_CONFIG.width},-1)':h='if(gt(iw/ih,9/16),-1,${VIDEO_CONFIG.height}*0.7)'[product_scaled]`,

                    // Paso 4: Superponer producto sobre fondo (centrado)
                    `[bg_moving][product_scaled]overlay=(W-w)/2:(H-h)/2[with_product]`,

                    // Paso 5: Overlay de nombre (arriba)
                    `[with_product][4:v]overlay=0:0[with_name]`,

                    // Paso 6: Overlay de precio (abajo)
                    `[with_name][3:v]overlay=0:0[final]`
                ])
                .outputOptions([
                    `-map [final]`,
                    `-map 2:a`,
                    `-c:v ${VIDEO_CONFIG.videoCodec}`,
                    `-preset fast`,
                    `-b:v ${VIDEO_CONFIG.videoBitrate}`,
                    `-c:a ${VIDEO_CONFIG.audioCodec}`,
                    `-b:a ${VIDEO_CONFIG.audioBitrate}`,
                    `-t ${duration}`,
                    `-r ${VIDEO_CONFIG.fps}`,
                ])
                .output(outputPath);

            command
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r   Progreso: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', async () => {
                    console.log(`\n   ✅ Escena ${sceneIndex} completada (capas)`);
                    await cleanupTempFiles(tempFiles);
                    resolve(outputPath);
                })
                .on('error', async (err) => {
                    console.error(`\n   ❌ Error: ${err.message}`);
                    await cleanupTempFiles(tempFiles);
                    reject(err);
                })
                .run();
        });

    } catch (error) {
        await cleanupTempFiles(tempFiles);
        throw error;
    }
}

/**
 * VANGUARDIA 3.1: Crear intro con avatar
 */
async function createAvatarIntro(avatarVideoPath, productName) {
    const tempFiles = [];

    try {
        const outputPath = path.join(os.tmpdir(), `intro_with_overlay_${Date.now()}.mp4`);

        // Generar overlay de nombre del producto
        const nameOverlayPath = await generateProductNameOverlay(productName);
        tempFiles.push(nameOverlayPath);

        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(avatarVideoPath)
                .input(nameOverlayPath)
                .complexFilter([
                    '[0:v][1:v]overlay=0:0[final]'
                ])
                .outputOptions([
                    `-map [final]`,
                    `-map 0:a`,
                    `-c:v ${VIDEO_CONFIG.videoCodec}`,
                    `-c:a ${VIDEO_CONFIG.audioCodec}`,
                ])
                .output(outputPath)
                .on('end', async () => {
                    await cleanupTempFiles(tempFiles);
                    resolve(outputPath);
                })
                .on('error', async (err) => {
                    await cleanupTempFiles(tempFiles);
                    reject(err);
                })
                .run();
        });

    } catch (error) {
        await cleanupTempFiles(tempFiles);
        throw error;
    }
}

/**
 * Concatena múltiples videos en uno solo
 */
async function concatenateVideos(videoPaths) {
    const outputPath = path.join(os.tmpdir(), `final_${Date.now()}.mp4`);
    const listPath = path.join(os.tmpdir(), `concat_list_${Date.now()}.txt`);

    // Crear archivo de lista para FFmpeg
    const listContent = videoPaths.map(p => `file '${p}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy']) // Copy codec (rápido)
            .output(outputPath)
            .on('end', async () => {
                await fs.unlink(listPath);
                resolve(outputPath);
            })
            .on('error', async (err) => {
                await fs.unlink(listPath);
                reject(err);
            })
            .run();
    });
}

/**
 * COMPOSITOR VANGUARDIA 3.1
 * Función principal que orquesta todo el video multi-capa
 */
async function composeVideoVanguard(scriptData, productData) {
    const tempFiles = [];
    const logger = require('./utils/logger');

    try {
        await checkFFmpegInstallation();
        validateComposerInput(scriptData, productData);

        logger.info('\n🎥 INICIANDO SUPER COMPOSICIÓN VANGUARDIA 3.2 MOTION');
        logger.info('═'.repeat(60));
        logger.info(`📊 Escenas: ${scriptData.scenes.length}`);
        logger.info(`🖼️ Imágenes sin fondo: ${productData.images.length}`);
        logger.info(`🎨 Fondo IA: ${productData.backgroundUrl ? 'Sí' : 'No'}`);
        logger.info(`🎭 Avatar intro: ${productData.avatarUrl ? 'Sí' : 'No'}`);
        logger.info(`💰 Precio: $${productData.price} MXN\n`);

        const allVideoParts = [];

        // ═══════════════════════════════════════════════════════════
        // PARTE 1: INTRO CON AVATAR (SI DISPONIBLE)
        // ═══════════════════════════════════════════════════════════
        if (productData.avatarUrl) {
            logger.info('🎭 Procesando intro con avatar...');

            // Descargar avatar video
            const avatarBuffer = await downloadToBuffer(productData.avatarUrl);
            const avatarPath = await createTempFile(avatarBuffer, 'mp4');
            tempFiles.push(avatarPath);

            // Agregar overlay de nombre al avatar
            const introWithOverlay = await createAvatarIntro(avatarPath, productData.title);
            tempFiles.push(introWithOverlay);
            allVideoParts.push(introWithOverlay);

            logger.info('✅ Intro con avatar completada\n');
        }

        // ═══════════════════════════════════════════════════════════
        // PARTE 2: ESCENAS CON CAPAS (FONDO + PRODUCTO + OVERLAYS)
        // ═══════════════════════════════════════════════════════════
        logger.info('🎬 Renderizando escenas multi-capa...\n');

        // Descargar audios
        const audioUrls = scriptData.scenes.map(s => s.audioUrl);
        const audioBuffers = await Promise.all(audioUrls.map(url => downloadToBuffer(url)));

        // Descargar imágenes de producto (ya sin fondo)
        const productImageBuffers = await Promise.all(
            productData.images.map(url => downloadToBuffer(url))
        );

        // Descargar o generar fondo
        let backgroundBuffer;
        if (productData.backgroundUrl) {
            logger.info('📥 Descargando fondo generado por IA...');
            backgroundBuffer = await downloadToBuffer(productData.backgroundUrl);
            logger.info('✅ Fondo IA descargado\n');
        } else {
            logger.info('🎨 Generando fondo sólido por defecto...');
            // Generar fondo degradado simple con Canvas
            const { createCanvas } = require('canvas');
            const canvas = createCanvas(1080, 1920);
            const ctx = canvas.getContext('2d');

            // Gradiente suave
            const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1920);

            backgroundBuffer = canvas.toBuffer('image/png');
            logger.info('✅ Fondo por defecto generado\n');
        }

        // Generar secuencia de efectos (ya no se usa, pero mantenemos por compatibilidad)
        const effectSequence = generateEffectSequence(scriptData.scenes.length);

        // Importar función de Motion
        const { createLayeredSceneWithMotion } = require('./videoComposer_motion');

        // Renderizar cada escena con Leonardo Motion
        for (let i = 0; i < scriptData.scenes.length; i++) {
            const productImageIndex = i % productImageBuffers.length;

            logger.info(`📌 Escena ${i + 1}/${scriptData.scenes.length}`);
            logger.info(`   Producto: Imagen ${productImageIndex + 1}/${productImageBuffers.length}`);
            logger.info(`   Método: Leonardo Motion (Video Real)`);

            const sceneVideo = await createLayeredSceneWithMotion(
                backgroundBuffer,  // Mismo fondo para todas (consistencia)
                productImageBuffers[productImageIndex],
                audioBuffers[i],
                i + 1,
                productData.price,
                productData.title,
                `job_${Date.now()}` // jobId para naming
            );

            allVideoParts.push(sceneVideo);
            tempFiles.push(sceneVideo);
            logger.info('');
        }

        // ═══════════════════════════════════════════════════════════
        // PARTE 3: CONCATENAR TODO
        // ═══════════════════════════════════════════════════════════
        logger.info(`🔗 Ensamblando ${allVideoParts.length} partes del video...`);
        const finalVideoPath = await concatenateVideos(allVideoParts);
        tempFiles.push(finalVideoPath);

        // ═══════════════════════════════════════════════════════════
        // PARTE 4: SUBIR A R2
        // ═══════════════════════════════════════════════════════════
        logger.info('☁️ Subiendo video final a R2...');
        const finalBuffer = await fs.readFile(finalVideoPath);
        const fileName = `video_vanguard_${Date.now()}.mp4`;

        const uploadResult = await uploadBuffer(finalBuffer, fileName, 'video/mp4');

        if (!uploadResult.success) {
            throw new Error(`Error al subir video: ${uploadResult.error}`);
        }

        // Limpiar
        logger.info('\n🗑️ Limpiando archivos temporales...');
        await cleanupTempFiles(tempFiles);

        logger.info('\n🎉 SUPER COMPOSICIÓN COMPLETADA');
        logger.info('═'.repeat(60));

        return {
            success: true,
            videoUrl: uploadResult.url,
            videoKey: uploadResult.key,
            size: uploadResult.size,
            duration: (productData.avatarUrl ? 4 : 0) + (scriptData.scenes.length * 5),
            scenes: scriptData.scenes.length,
            hasIntro: !!productData.avatarUrl,
            hasAIBackground: !!productData.backgroundUrl,
            completedAt: new Date().toISOString(),
        };

    } catch (error) {
        logger.error('\n💥 ERROR EN SUPER COMPOSICIÓN:', error.message);

        if (tempFiles.length > 0) {
            await cleanupTempFiles(tempFiles);
        }

        return {
            success: false,
            error: error.message,
            code: 'VANGUARD_COMPOSITION_ERROR',
        };
    }
}

module.exports = {
    composeVideo,
    composeVideoVanguard,
    createLayeredScene,
    createAvatarIntro,
};

