/**
 * test-ffmpeg-check.js - Verificación de instalación de FFmpeg
 */

const { checkFFmpegInstallation } = require('../src/utils/ffmpegHelpers');

async function testFFmpeg() {
    console.log('🎬 Verificando instalación de FFmpeg...\n');

    try {
        await checkFFmpegInstallation();
        console.log('\n✅ FFmpeg está correctamente instalado y configurado');
        console.log('🎉 Listo para renderizar videos!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\n💡 Solución: Ejecuta ./install-ffmpeg.sh');
        process.exit(1);
    }
}

testFFmpeg();
