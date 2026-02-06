/**
 * Procesador de trabajos de la cola - VANGUARDIA 3.1
 * Orquesta todos los módulos del pipeline multi-API
 */
const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const { updateJobStatus, completeJob, failJob } = require('../services/database');
const { processProductImages } = require('../services/imageProcessor');
const { generateBackground } = require('../services/backgroundGenerator');
const { generateAvatarIntro } = require('../services/avatarGenerator');
const { generateVideoScript } = require('../scriptGenerator');
const { generateScriptAudios } = require('../voiceGenerator');
const { composeVideoVanguard } = require('../videoComposer');

// Configuración de conexión a Redis
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

/**
 * Función principal VANGUARDIA 3.1 - Pipeline de 7 pasos
 */
async function processVideoJob(job) {
    const { jobId, productUrl } = job.data;

    try {
        logger.info(`\n${'═'.repeat(60)}`);
        logger.info(`🚀 INICIANDO JOB VANGUARDIA 3.1: ${jobId}`);
        logger.info(`📦 Producto: ${productUrl}`);
        logger.info('═'.repeat(60));

        // ═══════════════════════════════════════════════════════════
        // PASO 1: RECUPERAR DATOS (Ex-Scraping)
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 1/7: Recuperando datos del producto...');
        await updateJobStatus(jobId, { status: 'preparing', progress: 5 });
        await job.updateProgress(5);

        // AHORA: Los datos vienen directo del job.data si ya fueron subidos,
        // o se recuperan de la DB si es una URL conocida.
        let productData = job.data.productData || {
            success: true,
            title: "Producto VideoBooster",
            images: job.data.images || [],
            price: ""
        };

        logger.info(`✅ Datos listos: ${productData.title}`);
        logger.info(`📷 Imágenes a procesar: ${productData.images.length}`);

        await updateJobStatus(jobId, {
            status: 'preparing',
            progress: 10,
            product_data: productData,
        });
        await job.updateProgress(10);

        // ═══════════════════════════════════════════════════════════
        // PASO 2: PROCESAMIENTO DE IMÁGENES (REMOVE.BG)
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 2/7: Removiendo fondos con Remove.bg...');
        await updateJobStatus(jobId, { status: 'processing_images', progress: 15 });
        await job.updateProgress(15);

        const imageProcessingResult = await processProductImages(
            productData.images,
            jobId
        );

        const processedImageUrls = imageProcessingResult.images.map(img => img.processedUrl);
        productData.images = processedImageUrls;

        logger.info(`✅ Imágenes procesadas: ${imageProcessingResult.summary.processed}/${imageProcessingResult.summary.total}`);

        await updateJobStatus(jobId, {
            status: 'processing_images',
            progress: 20,
            product_data: productData,
        });
        await job.updateProgress(20);

        // ═══════════════════════════════════════════════════════════
        // PASO 3: GENERAR FONDO CON LEONARDO.AI (NUEVO) ⭐
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 3/7: Generando fondo IA con Leonardo.ai...');
        await updateJobStatus(jobId, { status: 'generating_background', progress: 25 });
        await job.updateProgress(25);

        const backgroundResult = await generateBackground(productData.title, jobId);

        if (backgroundResult.success) {
            logger.info(`✅ Fondo generado: ${backgroundResult.category}`);
            productData.backgroundUrl = backgroundResult.backgroundUrl;
            productData.backgroundCategory = backgroundResult.category;
        } else {
            logger.warn(`⚠️ Fondo IA no disponible (${backgroundResult.reason}), usando fondo sólido`);
            productData.backgroundUrl = null; // Se usará fondo sólido en compositor
        }

        await updateJobStatus(jobId, {
            status: 'generating_background',
            progress: 30,
            product_data: productData,
        });
        await job.updateProgress(30);

        // ═══════════════════════════════════════════════════════════
        // PASO 4: GENERAR AVATAR INTRO CON HEYGEN (NUEVO) ⭐
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 4/7: Generando avatar intro con HeyGen + ElevenLabs...');
        await updateJobStatus(jobId, { status: 'generating_avatar', progress: 35 });
        await job.updateProgress(35);

        const { generateIntroScript, generateAvatarWithAudio } = require('../services/avatarGenerator');
        const { generateVoiceAndUpload } = require('../voiceGenerator');

        const introScript = generateIntroScript(productData.title);

        try {
            // 1. Generar voz de la intro con ElevenLabs (Consistencia 100%)
            logger.info(`🎙️ Generando voz de la intro con ElevenLabs...`);
            const introVoiceResult = await generateVoiceAndUpload(introScript, `intro_voice_${jobId}.mp3`);

            if (introVoiceResult.success) {
                // 2. Generar video de HeyGen usando ese audio
                logger.info(`🎭 Enviando audio a HeyGen para lip-sync...`);
                const avatarResult = await generateAvatarWithAudio(introVoiceResult.audioUrl, jobId);

                if (avatarResult.success) {
                    logger.info(`✅ Avatar generado con éxito`);
                    productData.avatarUrl = avatarResult.avatarUrl;
                    productData.avatarScript = introScript;
                } else {
                    throw new Error(`HeyGen falló: ${avatarResult.error}`);
                }
            } else {
                throw new Error(`ElevenLabs falló en intro: ${introVoiceResult.error}`);
            }
        } catch (avatarError) {
            logger.warn(`⚠️ Omitiendo avatar intro: ${avatarError.message}`);
            productData.avatarUrl = null;
        }

        await updateJobStatus(jobId, {
            status: 'generating_avatar',
            progress: 40,
            product_data: productData,
        });
        await job.updateProgress(40);

        // ═══════════════════════════════════════════════════════════
        // PASO 5: GENERACIÓN DE SCRIPT
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 5/7: Generando guion con IA...');
        await updateJobStatus(jobId, { status: 'scripting', progress: 45 });
        await job.updateProgress(45);

        const scriptResult = await generateVideoScript(productData);

        if (!scriptResult.success) {
            throw new Error(`Script generation falló: ${scriptResult.error}`);
        }

        const scriptData = scriptResult.script;

        await updateJobStatus(jobId, {
            status: 'scripting',
            progress: 55,
            script_data: scriptData,
        });
        await job.updateProgress(55);

        logger.info(`✅ Script generado: ${scriptData.scenes.length} escenas`);

        // ═══════════════════════════════════════════════════════════
        // PASO 6: GENERACIÓN DE AUDIOS
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 6/7: Generando audios con ElevenLabs...');
        await updateJobStatus(jobId, { status: 'generating_voice', progress: 60 });
        await job.updateProgress(60);

        const audioResult = await generateScriptAudios(scriptData.scenes);

        if (!audioResult.success) {
            throw new Error(`Voice generation falló: ${audioResult.error}`);
        }

        const audioUrls = audioResult.audios.map(a => a.audioUrl);

        scriptData.scenes = scriptData.scenes.map((scene, i) => ({
            ...scene,
            audioUrl: audioResult.audios[i].audioUrl,
        }));

        await updateJobStatus(jobId, {
            status: 'generating_voice',
            progress: 75,
            audio_urls: audioUrls,
        });
        await job.updateProgress(75);

        logger.info(`✅ Audios generados: ${audioUrls.length} archivos`);

        // ═══════════════════════════════════════════════════════════
        // PASO 7: SUPER COMPOSICIÓN DE VIDEO (ACTUALIZADO) ⭐
        // ═══════════════════════════════════════════════════════════
        logger.info('\n📌 PASO 7/7: Componiendo video multi-capa...');
        await updateJobStatus(jobId, { status: 'rendering', progress: 80 });
        await job.updateProgress(80);

        const videoResult = await composeVideoVanguard(scriptData, productData);

        if (!videoResult.success) {
            throw new Error(`Video composition falló: ${videoResult.error}`);
        }

        await job.updateProgress(95);

        logger.info(`✅ Video renderizado: ${videoResult.videoUrl}`);

        // ═══════════════════════════════════════════════════════════
        // COMPLETAR JOB
        // ═══════════════════════════════════════════════════════════
        await completeJob(jobId, videoResult.videoUrl, {
            scenes: videoResult.scenes,
            size: videoResult.size,
            duration: videoResult.duration,
            images_processed: imageProcessingResult.summary.processed,
            has_ai_background: !!productData.backgroundUrl,
            has_avatar_intro: !!productData.avatarUrl,
            vanguard_version: '3.1',
        });

        await job.updateProgress(100);

        // ═══════════════════════════════════════════════════════════
        // LOG DE ÉXITO MULTI-API
        // ═══════════════════════════════════════════════════════════
        logger.info('\n' + '═'.repeat(60));
        logger.info('🎉 JOB VANGUARDIA 3.1 COMPLETADO');
        logger.info('═'.repeat(60));
        logger.info(`📦 Producto: ${productData.title.substring(0, 50)}...`);
        logger.info(`🎬 Video URL: ${videoResult.videoUrl}`);
        logger.info('');
        logger.info('📊 APIs UTILIZADAS:');
        logger.info(`   ✅ Remove.bg: ${imageProcessingResult.summary.processed}/${imageProcessingResult.summary.total} imágenes`);
        logger.info(`   ${productData.backgroundUrl ? '✅' : '⚠️'} Leonardo.ai: ${productData.backgroundUrl ? 'Fondo generado' : 'No disponible'}`);
        logger.info(`   ${productData.avatarUrl ? '✅' : '⚠️'} HeyGen: ${productData.avatarUrl ? 'Avatar generado' : 'No disponible'}`);
        logger.info(`   ✅ OpenAI: ${scriptData.scenes.length} escenas`);
        logger.info(`   ✅ ElevenLabs: ${audioUrls.length} audios`);
        logger.info('');
        logger.info('🎨 CARACTERÍSTICAS:');
        logger.info(`   • Escenas: ${videoResult.scenes}`);
        logger.info(`   • Imágenes sin fondo: ${imageProcessingResult.summary.processed}`);
        logger.info(`   • Fondo IA: ${productData.backgroundCategory || 'N/A'}`);
        logger.info(`   • Intro avatar: ${productData.avatarUrl ? 'Sí' : 'No'}`);
        logger.info(`   • Duración: ~${videoResult.duration}s`);
        logger.info(`   • Tamaño: ${(videoResult.size / (1024 * 1024)).toFixed(2)} MB`);
        logger.info('═'.repeat(60) + '\n');

        return {
            success: true,
            jobId,
            videoUrl: videoResult.videoUrl,
            metadata: {
                product: productData.title,
                scenes: videoResult.scenes,
                duration: videoResult.duration,
                apisUsed: {
                    removeBg: imageProcessingResult.summary.processed > 0,
                    leonardo: !!productData.backgroundUrl,
                    heygen: !!productData.avatarUrl,
                    openai: true,
                    elevenlabs: true,
                },
            },
        };

    } catch (error) {
        logger.error(`\n💥 ERROR EN JOB ${jobId}: ${error.message}`);
        logger.error(error.stack);

        await failJob(jobId, error.message);

        throw error;
    }
}

// Crear worker
const worker = new Worker('video-generation', processVideoJob, {
    connection,
    concurrency: 2, // Procesar hasta 2 videos simultáneamente
});

// Event listeners
worker.on('completed', (job) => {
    logger.info(`✅ Worker: Job ${job.id} completado`);
});

worker.on('failed', (job, err) => {
    logger.error(`❌ Worker: Job ${job?.id} falló: ${err.message}`);
});

worker.on('error', (error) => {
    logger.error(`❌ Worker error: ${error.message}`);
});

logger.info('Video worker initialized (concurrency: 2)');

module.exports = worker;
