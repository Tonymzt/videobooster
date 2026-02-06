require('dotenv').config();
const {
    processProductImages,
    processSingleImage,
    isRemoveBgAvailable,
    getStats
} = require('../src/services/imageProcessor');

async function testImageProcessor() {
    console.log('🧪 TEST: Image Processor Service\n');
    console.log('═'.repeat(60));

    // Test 1: Verificar disponibilidad
    console.log('\n📌 TEST 1: Verificar disponibilidad de Remove.bg');
    const availability = isRemoveBgAvailable();
    console.log(`   Disponible: ${availability.available ? '✅ SÍ' : '❌ NO'}`);
    if (!availability.available) {
        console.log(`   Razón: ${availability.reason}`);
        console.log('\n⚠️ ADVERTENCIA: Remove.bg no está disponible');
        console.log('   El sistema usará imágenes originales como fallback');
    } else {
        console.log('   API Key configurada correctamente.');
    }
    console.log('');

    // Test 2: Procesar imagen única
    console.log('📌 TEST 2: Procesar imagen única');
    // Usamos una imagen de Amazon real
    const testImageUrl = 'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg';

    try {
        const result = await processSingleImage(testImageUrl, 'test_product', 0);

        console.log('   Resultado:');
        console.log(`   - Original: ${result.originalUrl.substring(0, 60)}...`);
        console.log(`   - Procesada: ${result.processedUrl.substring(0, 60)}...`);
        console.log(`   - Fondo removido: ${result.processed ? '✅ SÍ' : '❌ NO'}`);
        if (!result.processed) {
            console.log(`   - Razón: ${result.failReason || 'Servicio deshabilitado'}`);
        }
        console.log('');
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
    }

    // Test 3: Procesar múltiples imágenes
    console.log('📌 TEST 3: Procesar array de imágenes (3 imágenes)');
    const testImages = [
        'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
        'https://m.media-amazon.com/images/I/814y0oFyJBL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/91dnnE5SWHL._AC_SL1500_.jpg',
    ];

    try {
        const results = await processProductImages(testImages, 'test_batch');

        console.log('\n   📊 Resumen:');
        console.log(`   - Total: ${results.summary.total}`);
        console.log(`   - Procesadas: ${results.summary.processed}`);
        console.log(`   - Fallback: ${results.summary.fallback}`);

        console.log('\n   📋 Detalle por imagen:');
        results.images.forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.processed ? '✅ Procesada' : '⚠️ Original'} (${img.processedUrl.substring(0, 40)}...)`);
            if (!img.processed) {
                console.log(`      Razón: ${img.failReason}`);
            }
        });
        console.log('');
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
    }

    // Estadísticas finales
    console.log('📊 Estadísticas de uso:');
    const stats = getStats();
    console.log(`   Total requests: ${stats.total}`);
    console.log(`   Exitosos: ${stats.success}`);
    console.log(`   Fallidos: ${stats.failed}`);
    console.log(`   Omitidos: ${stats.skipped}`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ TEST COMPLETADO\n');
}

testImageProcessor().catch(error => {
    console.error('\n💥 Error crítico:', error);
    process.exit(1);
});
