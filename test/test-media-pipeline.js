/**
 * test-media-pipeline.js - Test de integración completa del pipeline de medios
 */

require('dotenv').config();
const { generateVoiceAndUpload, generateScriptAudios } = require('../src/voiceGenerator');

// Escena de prueba de la Freidora Oster
const testScene = {
    text: '¿Cansado de limpiar tu freidora de aire cada vez que la usas?',
    visual_cue: 'Mostrar persona frustrada limpiando freidora',
    duration_est: 4
};

// Script completo de prueba (primeras 3 escenas)
const testScript = {
    scenes: [
        {
            text: '¿Cansado de limpiar tu freidora de aire cada vez que la usas?',
            visual_cue: 'Mostrar persona frustrada limpiando',
            duration_est: 4
        },
        {
            text: 'Esta freidora tiene recubrimiento DiamondForce, 15 veces más fácil de limpiar',
            visual_cue: 'Mostrar imagen del producto',
            duration_est: 5
        },
        {
            text: 'Y cuesta menos de mil pesos. Link en mi perfil',
            visual_cue: 'Precio en pantalla con CTA',
            duration_est: 4
        }
    ]
};

async function testMediaPipeline() {
    console.log('🧪 TEST: PIPELINE DE MEDIOS COMPLETO\n');
    console.log('═'.repeat(50));

    // Test 1: Audio individual
    console.log('\n📌 TEST 1: Generación de Audio Individual');
    console.log('─'.repeat(50));

    const singleResult = await generateVoiceAndUpload(testScene.text, 'test-scene-1.mp3');

    if (singleResult.success) {
        console.log('\n✅ ÉXITO - Audio Individual Generado');
        console.log(`📎 URL: ${singleResult.audioUrl}`);
        console.log(`📊 Tamaño: ${(singleResult.size / 1024).toFixed(2)} KB`);
        console.log(`⏱️ Duración estimada: ${singleResult.duration}s`);
    } else {
        console.error(`\n❌ FALLO: ${singleResult.error}`);
        process.exit(1);
    }

    // Test 2: Script completo
    console.log('\n\n📌 TEST 2: Generación de Script Completo (3 escenas)');
    console.log('─'.repeat(50));

    const scriptResult = await generateScriptAudios(testScript.scenes);

    if (scriptResult.success) {
        console.log('\n✅ ÉXITO - Script Completo Generado');
        console.log(`📊 Escenas procesadas: ${scriptResult.successCount}/${scriptResult.totalScenes}`);

        scriptResult.audios.forEach((audio, index) => {
            console.log(`\n🎬 Escena ${index + 1}:`);
            console.log(`   Texto: "${audio.text.substring(0, 50)}..."`);
            console.log(`   URL: ${audio.audioUrl}`);
            console.log(`   Duración: ${audio.duration}s`);
        });
    } else {
        console.error(`\n❌ FALLO: ${scriptResult.error}`);
        if (scriptResult.errors) {
            console.error('\nErrores por escena:');
            scriptResult.errors.forEach(err => {
                console.error(`  - Escena ${err.sceneIndex + 1}: ${err.error}`);
            });
        }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 TEST DE PIPELINE COMPLETADO');
    console.log('\n📋 Resumen:');
    console.log(`   ✅ Audio individual: ${singleResult.success ? 'OK' : 'FAIL'}`);
    console.log(`   ✅ Script completo: ${scriptResult.success ? 'OK' : 'FAIL'}`);
    console.log(`   📦 Total archivos en R2: ${(scriptResult.successCount || 0) + 1}`);

    process.exit(singleResult.success && scriptResult.success ? 0 : 1);
}

// Ejecutar test
testMediaPipeline().catch(error => {
    console.error('\n💥 Error crítico en el test:', error);
    process.exit(1);
});
