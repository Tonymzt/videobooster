require('dotenv').config();
const {
    checkFFmpegInstallation,
    generateKenBurnsFilter,
    generatePriceOverlay
} = require('../src/utils/ffmpegHelpers');

async function testFFmpegHelpers() {
    console.log('🧪 TEST: FFmpeg Helpers\n');

    // Test 1: Verificar instalación
    console.log('1️⃣ Test: Verificación de FFmpeg');
    try {
        await checkFFmpegInstallation();
        console.log('✅ FFmpeg instalado y funcional\n');
    } catch (error) {
        console.error(`❌ ${error.message}\n`);
        process.exit(1);
    }

    // Test 2: Generar filtro Ken Burns
    console.log('2️⃣ Test: Generación de filtro Ken Burns');
    const kenBurnsFilter = generateKenBurnsFilter(5); // 5 segundos
    console.log('✅ Filtro generado:');
    console.log(`   ${kenBurnsFilter.substring(0, 80)}...\n`);

    // Test 3: Generar overlay de precio
    console.log('3️⃣ Test: Generación de overlay de precio');
    const priceOverlay = generatePriceOverlay(945);
    console.log('✅ Overlay generado:');
    console.log(`   ${priceOverlay.substring(0, 80)}...`);

    console.log('\n✅ TODOS LOS TESTS PASARON');
}

testFFmpegHelpers();
