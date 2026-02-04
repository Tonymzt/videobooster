/**
 * test-script.js - Script de prueba para el generador de guiones
 * Prueba la generación de guiones con un producto real (Freidora Oster)
 */

require('dotenv').config();
const { generateVideoScript } = require('../src/scriptGenerator');

// Producto de prueba (Freidora Oster ya scrapeada)
const testProduct = {
    platform: "amazon",
    title: "Oster® Freidora de Aire Manual, Recubrimiento Oster® DiamondForce, 4L de Capacidad, con Controles de Tiempo y Temperatura",
    price: 945,
    description: "Recubrimiento Oster DiamondForce: Hasta 15 veces más fácil de limpiar*.​ Hasta 12 veces más resistente a rayaduras*: No se agrieta, pela o raya • 4L de capacidad: Permite cocinar un pollo de hasta 2.3Kg • Control Manual • Cocina hasta con 99% menos aceite*** • Perilla de temperatura ajustable de hasta 200ºC • Control de temporizador ajustable de hasta 60 minutos • Sistema de manejo de cables que mantiene el cable ordenado y listo para usar",
    scrapedAt: "2026-02-03T00:51:48.129Z"
};

async function testScriptGeneration() {
    console.log('🧪 INICIANDO PRUEBA DE GENERACIÓN DE GUION\n');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📦 PRODUCTO DE PRUEBA:');
    console.log(`   Título: ${testProduct.title}`);
    console.log(`   Precio: $${testProduct.price} MXN`);
    console.log(`   Plataforma: ${testProduct.platform}`);
    console.log('\n───────────────────────────────────────────────────────\n');

    const result = await generateVideoScript(testProduct);

    console.log('\n═══════════════════════════════════════════════════════\n');

    if (result.success) {
        console.log('✅ GUION GENERADO EXITOSAMENTE\n');
        console.log('📊 METADATA:');
        console.log(`   Modelo: ${result.model}`);
        console.log(`   Tokens usados: ${result.tokensUsed}`);
        console.log(`   Generado: ${result.generatedAt}`);
        console.log(`   Escenas: ${result.script.scenes.length}`);

        const totalDuration = result.script.scenes.reduce((sum, s) => sum + s.duration_est, 0);
        console.log(`   Duración total: ${totalDuration}s`);

        console.log('\n🎬 GUION COMPLETO:\n');
        console.log(JSON.stringify(result.script, null, 2));

        console.log('\n───────────────────────────────────────────────────────\n');
        console.log('📝 PREVIEW DE ESCENAS:\n');

        result.script.scenes.forEach((scene, index) => {
            console.log(`Escena ${index + 1} (${scene.duration_est}s):`);
            console.log(`   🎥 Visual: ${scene.visual_cue}`);
            console.log(`   💬 Texto: "${scene.text}"`);
            console.log('');
        });

    } else {
        console.error('❌ ERROR EN GENERACIÓN DE GUION\n');
        console.error(`   Código: ${result.error}`);
        if (result.message) {
            console.error(`   Mensaje: ${result.message}`);
        }
    }

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(result.success ? 0 : 1);
}

testScriptGeneration();
