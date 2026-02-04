require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { downloadToBuffer } = require('../src/utils/mediaDownloader');
const ffmpeg = require('fluent-ffmpeg');
const { VIDEO_CONFIG } = require('../src/config/video');
const { generateKenBurnsFilter, generatePriceOverlay } = require('../src/utils/ffmpegHelpers');
const { uploadBuffer } = require('../src/storage');

/**
 * Test: Renderizar 3 escenas y concatenarlas
 */
async function testMultiScene() {
    console.log('🧪 TEST: Renderizado Multi-Escena (3 escenas)\n');
    console.log('═'.repeat(60));

    const tempFiles = [];
    const sceneVideos = [];

    try {
        // URLs de prueba - URLs reales generadas en el paso anterior
        const scenes = [
            {
                imageUrl: 'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
                audioUrl: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/scene_1_1770096421350.mp3',
                text: 'Escena 1'
            },
            {
                imageUrl: 'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
                audioUrl: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/scene_2_1770096423570.mp3',
                text: 'Escena 2'
            },
            {
                imageUrl: 'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
                audioUrl: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/scene_3_1770096426442.mp3',
                text: 'Escena 3'
            }
        ];

        // Renderizar cada escena
        console.log('🎬 Renderizando escenas individuales...\n');

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            console.log(`📌 Escena ${i + 1}/3`);

            // Descargar medios
            console.log('   📥 Descargando medios...');
            const imageBuffer = await downloadToBuffer(scene.imageUrl);
            const audioBuffer = await downloadToBuffer(scene.audioUrl);

            // Crear archivos temporales
            const tempDir = require('os').tmpdir();
            const imagePath = path.join(tempDir, `scene${i}_image_${Date.now()}.jpg`);
            const audioPath = path.join(tempDir, `scene${i}_audio_${Date.now()}.mp3`);
            const outputPath = path.join(tempDir, `scene${i}_video_${Date.now()}.mp4`);

            await fs.writeFile(imagePath, imageBuffer);
            await fs.writeFile(audioPath, audioBuffer);
            tempFiles.push(imagePath, audioPath);

            // Renderizar
            console.log('   🎬 Renderizando...');
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(imagePath)
                    .loop()
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
                    .output(outputPath)
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            process.stdout.write(`\r   Progreso: ${progress.percent.toFixed(1)}%`);
                        }
                    })
                    .on('end', () => {
                        console.log('\n   ✅ Escena completada\n');
                        resolve();
                    })
                    .on('error', reject)
                    .run();
            });

            sceneVideos.push(outputPath);
            tempFiles.push(outputPath);
        }

        // Concatenar todas las escenas
        console.log('🔗 Concatenando 3 escenas en video final...');
        const finalOutputPath = path.join(require('os').tmpdir(), `final_multi_${Date.now()}.mp4`);
        const listPath = path.join(require('os').tmpdir(), `concat_list_${Date.now()}.txt`);

        // Crear archivo de lista
        const listContent = sceneVideos.map(p => `file '${p}'`).join('\n');
        await fs.writeFile(listPath, listContent);
        tempFiles.push(listPath);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(listPath)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions(['-c copy'])
                .output(finalOutputPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r   Progreso: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log('\n✅ Concatenación completada\n');
                    resolve();
                })
                .on('error', reject)
                .run();
        });

        tempFiles.push(finalOutputPath);

        // Verificar video final
        const finalStats = await fs.stat(finalOutputPath);
        console.log(`📊 Video final generado:`);
        console.log(`   Tamaño: ${(finalStats.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`   Escenas: 3`);
        console.log(`   Path: ${finalOutputPath}\n`);

        // Subir a R2
        console.log('☁️ Subiendo video final a R2...');
        const videoBuffer = await fs.readFile(finalOutputPath);
        const uploadResult = await uploadBuffer(videoBuffer, 'test-multi-scene-final.mp4', 'video/mp4');

        if (uploadResult.success) {
            console.log('✅ Video final subido a R2\n');
            console.log('🎉 PRUEBA EL VIDEO COMPLETO AQUÍ:');
            console.log(`   ${uploadResult.url}\n`);
            console.log('═'.repeat(60));
            console.log('✅ TEST COMPLETADO - 3 ESCENAS CONCATENADAS');
        } else {
            throw new Error(`Fallo al subir: ${uploadResult.error}`);
        }

        // Limpiar
        console.log('\n🗑️ Limpiando archivos temporales...');
        for (const file of tempFiles) {
            try {
                await fs.unlink(file);
                console.log(`   ✅ Eliminado base: ${path.basename(file)}`);
            } catch (err) {
                // Ignorar
            }
        }
        console.log('✅ Limpieza completada');

    } catch (error) {
        console.error('\n💥 ERROR EN TEST:', error.message);

        // Limpiar en caso de error
        for (const file of tempFiles) {
            try {
                await fs.unlink(file);
            } catch (err) {
                // Ignorar
            }
        }

        process.exit(1);
    }
}

testMultiScene();
