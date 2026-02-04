/**
 * Test de debugging para Leonardo.ai y HeyGen
 * Muestra logs completos de requests y responses
 */
require('dotenv').config();
const { generateBackground } = require('../src/services/backgroundGenerator');
const { generateAvatarIntro } = require('../src/services/avatarGenerator');

async function testAPIsDebug() {
    console.log('🧪 TEST: Debugging de APIs (Leonardo + HeyGen)\n');
    console.log('═'.repeat(60));
    console.log('Este test mostrará los requests completos a cada API');
    console.log('═'.repeat(60) + '\n');

    const testProduct = 'Freidora de Aire Oster';
    const testJobId = `test_${Date.now()}`;

    // ═══════════════════════════════════════════════════════════
    // TEST 1: LEONARDO.AI
    // ═══════════════════════════════════════════════════════════
    console.log('\n📌 TEST 1: Leonardo.ai Background Generator');
    console.log('─'.repeat(60));

    const leonardoResult = await generateBackground(testProduct, testJobId);

    if (leonardoResult.success) {
        console.log('\n✅ LEONARDO.AI - ÉXITO');
        console.log(`   Categoría: ${leonardoResult.category}`);
        console.log(`   URL: ${leonardoResult.backgroundUrl}`);
        console.log(`   Dimensiones: ${leonardoResult.dimensions.width}x${leonardoResult.dimensions.height}`);
    } else {
        console.log('\n❌ LEONARDO.AI - FALLO');
        console.log(`   Razón: ${leonardoResult.reason || leonardoResult.error}`);
        if (leonardoResult.details) {
            console.log(`   Detalles: ${JSON.stringify(leonardoResult.details, null, 2)}`);
        }
    }

    console.log('\n' + '─'.repeat(60));

    // ═══════════════════════════════════════════════════════════
    // TEST 2: HEYGEN
    // ═══════════════════════════════════════════════════════════
    console.log('\n📌 TEST 2: HeyGen Avatar Generator');
    console.log('─'.repeat(60));

    const heygenResult = await generateAvatarIntro(testProduct, testJobId);

    if (heygenResult.success) {
        console.log('\n✅ HEYGEN - ÉXITO');
        console.log(`   Script: "${heygenResult.script}"`);
        console.log(`   URL: ${heygenResult.avatarUrl}`);
        console.log(`   Duración: ${heygenResult.duration}s`);
    } else {
        console.log('\n❌ HEYGEN - FALLO');
        console.log(`   Razón: ${heygenResult.reason || heygenResult.error}`);
        if (heygenResult.details) {
            console.log(`   Detalles: ${JSON.stringify(heygenResult.details, null, 2)}`);
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🏁 TEST COMPLETADO');
    console.log('═'.repeat(60) + '\n');

    // Resumen
    console.log('📊 RESUMEN:');
    console.log(`   Leonardo.ai: ${leonardoResult.success ? '✅ OK' : '❌ FAIL'}`);
    console.log(`   HeyGen: ${heygenResult.success ? '✅ OK' : '❌ FAIL'}`);
    console.log('');
}

testAPIsDebug().catch(error => {
    console.error('\n💥 Error crítico:', error);
    process.exit(1);
});
