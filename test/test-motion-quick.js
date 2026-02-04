/**
 * Test rápido de Leonardo Motion API
 * Verificar que el endpoint funciona antes del pipeline completo
 */
require('dotenv').config();
const { generateMotionVideo } = require('../src/services/motionGenerator');

async function testLeonardoMotion() {
    console.log('🧪 TEST RÁPIDO: Leonardo Motion API\n');
    console.log('═'.repeat(60));

    // Usar una imagen de prueba pública
    const testImageUrl = 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/background_test_1770153695412_kitchen_1770153710248.png';

    console.log(`📸 Imagen de prueba: ${testImageUrl}`);
    console.log(`🎬 Generando motion con strength: 6\n`);

    try {
        const result = await generateMotionVideo(testImageUrl, 'test_motion', 6);

        if (result.success) {
            console.log('\n✅ LEONARDO MOTION FUNCIONA');
            console.log('═'.repeat(60));
            console.log(`🎬 Video URL: ${result.videoUrl}`);
            console.log(`⏱️ Duración: ${result.duration}s`);
            console.log('═'.repeat(60));
        } else {
            console.log('\n❌ LEONARDO MOTION FALLÓ');
            console.log('═'.repeat(60));
            console.log(`Razón: ${result.error}`);
            if (result.details) {
                console.log(`Detalles: ${JSON.stringify(result.details, null, 2)}`);
            }
            console.log('═'.repeat(60));
        }
    } catch (error) {
        console.error('\n💥 Error:', error.message);
    }
}

testLeonardoMotion();
