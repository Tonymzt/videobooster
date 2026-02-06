require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { downloadToBuffer } = require('../src/utils/mediaDownloader');
const ffmpeg = require('fluent-ffmpeg');
const { VIDEO_CONFIG } = require('../src/config/video');
const { generateKenBurnsFilter, generatePriceOverlay } = require('../src/utils/ffmpegHelpers');
const { uploadBuffer } = require('../src/storage');

/**
 * Test simplificado: Renderizar UNA sola escena
 * Esto verifica que FFmpeg puede procesar imagen + audio correctamente
 */
async function testSingleScene() {
    console.log('🧪 TEST: Renderizado de Escena Individual\n');
    console.log('═'.repeat(60));

    const tempFiles = [];

    try {
        // URLs de prueba (usar URLs reales de tus tests anteriores)
        const imageUrl = 'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg';
        const audioUrl = 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/test-scene-1.mp3'; // ✅ URL real del módulo #003

        // 1. Descargar medios
        console.log('📥 Descargando imagen y audio...');
        const imageBuffer = await downloadToBuffer(imageUrl);
        const audioBuffer = await downloadToBuffer(audioUrl);
        console.log(`✅ Imagen: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`✅ Audio: ${(audioBuffer.length / 1024).toFixed(2)} KB\n`);

        // 2. Crear archivos temporales (necesario para FFmpeg)
        const tempDir = require('os').tmpdir();
        const imagePath = path.join(tempDir, `test_image_${Date.now()}.jpg`);
        const audioPath = path.join(tempDir, `test_audio_${Date.now()}.mp3`);
        const outputPath = path.join(tempDir, `test_scene_${Date.now()}.mp4`);

        await fs.writeFile(imagePath, imageBuffer);
        await fs.writeFile(audioPath, audioBuffer);
        tempFiles.push(imagePath, audioPath);

        console.log('🎬 Renderizando escena con FFmpeg...');

        // 3. Renderizar con FFmpeg
        await new Promise((resolve, reject) => {
            const command = ffmpeg()
                .input(imagePath)
                .loop() // Loop de la imagen
                .input(audioPath)
                .outputOptions([
                    '-vf', `scale=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}:force_original_aspect_ratio=increase,crop=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height},${generateKenBurnsFilter(5)},${generatePriceOverlay(945)}`,
                    '-c:v', VIDEO_CONFIG.videoCodec,
                    '-preset', 'fast',
                    '-b:v', VIDEO_CONFIG.videoBitrate,
                    '-c:a', VIDEO_CONFIG.audioCodec,
                    '-b:a', VIDEO_CONFIG.audioBitrate,
                    '-shortest',
                    '-r', VIDEO_CONFIG.fps.toString(),
                ])
                .output(outputPath);

            command
                .on('start', (cmd) => {
                    console.log(`   Comando FFmpeg iniciado...`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r   Progreso: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log('\n✅ Renderizado completado\n');
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`\n❌ Error de FFmpeg: ${err.message}`);
                    reject(err);
                })
                .run();
        });

        // 4. Verificar video generado
        const videoStats = await fs.stat(outputPath);
        console.log(`📊 Video generado:`);
        console.log(`   Tamaño: ${(videoStats.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`   Path: ${outputPath}\n`);
        tempFiles.push(outputPath);

        // 5. Subir a R2
        console.log('☁️ Subiendo video a R2...');
        const videoBuffer = await fs.readFile(outputPath);
        const uploadResult = await uploadBuffer(videoBuffer, 'test-single-scene.mp4', 'video/mp4');

        if (uploadResult.success) {
            console.log('✅ Video subido a R2\n');
            console.log('🎉 PRUEBA EL VIDEO AQUÍ:');
            console.log(`   ${uploadResult.url}\n`);
            console.log('═'.repeat(60));
        } else {
            throw new Error(`Fallo al subir: ${uploadResult.error}`);
        }

        // 6. Limpiar archivos temporales
        console.log('🗑️ Limpiando archivos temporales...');
        for (const file of tempFiles) {
            try {
                await fs.unlink(file);
                console.log(`   ✅ Eliminado: ${path.basename(file)}`);
            } catch (err) {
                console.warn(`   ⚠️ No se pudo eliminar ${file}`);
            }
        }
        console.log('✅ Limpieza completada');

    } catch (error) {
        console.error('\n💥 ERROR EN TEST:', error.message);
        console.error(error.stack);

        // Limpiar en caso de error
        for (const file of tempFiles) {
            try {
                await fs.unlink(file);
            } catch (err) {
                // Ignorar errores de limpieza
            }
        }

        process.exit(1);
    }
}

testSingleScene();
