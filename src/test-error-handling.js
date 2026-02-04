/**
 * test-error-handling.js - Pruebas de manejo de errores
 * Valida que el scraper maneje correctamente diferentes escenarios de error
 */

const { scrapeProduct } = require('./scraper');

(async () => {
    console.log('🧪 PRUEBAS DE MANEJO DE ERRORES\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Test 1: URL inválida
    console.log('📦 TEST 1: URL Inválida');
    console.log('───────────────────────────────────────────────────────');
    const test1 = await scrapeProduct('');
    console.log('Resultado:', test1.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test1.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 2: Plataforma no soportada
    console.log('📦 TEST 2: Plataforma No Soportada');
    console.log('───────────────────────────────────────────────────────');
    const test2 = await scrapeProduct('https://www.ebay.com/producto');
    console.log('Resultado:', test2.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test2.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 3: URL 404 (producto no existe)
    console.log('📦 TEST 3: Producto No Existe (404)');
    console.log('───────────────────────────────────────────────────────');
    const test3 = await scrapeProduct('https://www.mercadolibre.com.mx/producto-inexistente-12345/p/MLM99999999');
    console.log('Resultado:', test3.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test3.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 4: URL malformada
    console.log('📦 TEST 4: URL Malformada');
    console.log('───────────────────────────────────────────────────────');
    const test4 = await scrapeProduct('not-a-valid-url');
    console.log('Resultado:', test4.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test4.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Resumen
    const allTests = [test1, test2, test3, test4];
    const passed = allTests.filter(t => !t.success).length;

    console.log('📊 RESUMEN DE PRUEBAS DE ERRORES:');
    console.log(`Total: ${allTests.length}`);
    console.log(`Pasadas: ${passed}/${allTests.length}`);
    console.log(`Estado: ${passed === allTests.length ? '✅ TODAS PASARON' : '❌ ALGUNAS FALLARON'}`);

    process.exit(0);
})();
