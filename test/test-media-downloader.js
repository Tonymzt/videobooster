require('dotenv').config();
const { downloadToBuffer, downloadMultiple } = require('../src/utils/mediaDownloader');

async function testMediaDownloader() {
    console.log('🧪 TEST: Media Downloader\n');

    // Test 1: Descargar imagen de producto
    console.log('1️⃣ Test: Descarga de imagen individual');
    const imageUrl = 'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg';

    try {
        const imageBuffer = await downloadToBuffer(imageUrl);
        console.log(`✅ Imagen descargada: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`   Tipo de dato: ${Buffer.isBuffer(imageBuffer) ? 'Buffer ✓' : 'ERROR'}\n`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}\n`);
        process.exit(1);
    }

    // Test 2: Descargar múltiples URLs
    console.log('2️⃣ Test: Descarga múltiple (3 imágenes)');
    const urls = [
        'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
        'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
        'https://m.media-amazon.com/images/I/71VwhYv69pL._AC_SX522_.jpg',
    ];

    try {
        const buffers = await downloadMultiple(urls);
        console.log(`✅ ${buffers.length} archivos descargados`);

        buffers.forEach((buf, i) => {
            console.log(`   Archivo ${i + 1}: ${(buf.length / 1024).toFixed(2)} KB`);
        });

        console.log('\n✅ TODOS LOS TESTS PASARON');
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

testMediaDownloader();
