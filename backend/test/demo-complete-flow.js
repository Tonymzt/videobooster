/**
 * demo-complete-flow.js - Demostración del flujo completo
 * Scrapea un producto y genera un guion de video
 */

require('dotenv').config();
const { scrapeProduct } = require('../src/scraper');
const { generateVideoScript } = require('../src/scriptGenerator');

async function completeFlow() {
    console.log('🚀 DEMO: FLUJO COMPLETO - SCRAPER + GENERADOR DE GUIONES\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Paso 1: Scrapear producto
    console.log('📦 PASO 1: SCRAPEANDO PRODUCTO\n');
    console.log('URL: https://www.amazon.com.mx/dp/B0DKXXWXN4');
    console.log('───────────────────────────────────────────────────────\n');

    const productData = await scrapeProduct('https://www.amazon.com.mx/dp/B0DKXXWXN4');

    if (!productData.success) {
        console.error('❌ Error en scraping:', productData.error);
        process.exit(1);
    }

    console.log('✅ Producto scrapeado exitosamente:');
    console.log(`   Título: ${productData.title.substring(0, 60)}...`);
    console.log(`   Precio: $${productData.price} MXN`);
    console.log(`   Imágenes: ${productData.images.length}`);
    console.log(`   Plataforma: ${productData.platform}`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Paso 2: Generar guion
    console.log('🤖 PASO 2: GENERANDO GUION DE VIDEO\n');
    console.log('───────────────────────────────────────────────────────\n');

    const scriptResult = await generateVideoScript(productData);

    if (!scriptResult.success) {
        console.error('❌ Error en generación de guion:', scriptResult.error);
        process.exit(1);
    }

    console.log('✅ Guion generado exitosamente:');
    console.log(`   Escenas: ${scriptResult.script.scenes.length}`);
    console.log(`   Duración total: ${scriptResult.script.scenes.reduce((sum, s) => sum + s.duration_est, 0)}s`);
    console.log(`   Modelo: ${scriptResult.model}`);
    console.log(`   Tokens usados: ${scriptResult.tokensUsed}`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Paso 3: Mostrar resultado final
    console.log('🎬 RESULTADO FINAL: GUION COMPLETO\n');
    console.log('───────────────────────────────────────────────────────\n');

    scriptResult.script.scenes.forEach((scene, index) => {
        console.log(`Escena ${index + 1} (${scene.duration_est}s):`);
        console.log(`   🎥 ${scene.visual_cue}`);
        console.log(`   💬 "${scene.text}"`);
        console.log('');
    });

    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 RESUMEN DEL FLUJO:');
    console.log(`   ✅ Scraping: ${productData.platform} → ${productData.images.length} imágenes`);
    console.log(`   ✅ Guion: ${scriptResult.script.scenes.length} escenas, ${scriptResult.tokensUsed} tokens`);
    console.log(`   🎯 Siguiente paso: Generar voz y video`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Guardar resultado para uso futuro
    const finalOutput = {
        product: productData,
        script: scriptResult.script,
        metadata: {
            scrapedAt: productData.scrapedAt,
            scriptGeneratedAt: scriptResult.generatedAt,
            model: scriptResult.model,
            tokensUsed: scriptResult.tokensUsed
        }
    };

    console.log('💾 Output completo (JSON):');
    console.log(JSON.stringify(finalOutput, null, 2));

    process.exit(0);
}

completeFlow();
