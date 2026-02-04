/**
 * Test para validar extracción de multi-imágenes
 */
const { scrapeProduct } = require('../src/scraper');

async function testMultiImage() {
    console.log('🧪 TEST: Scraper Multi-Imagen\n');

    // URL de prueba Amazon (Producto con varias fotos: Oster Freidora)
    const url = 'https://www.amazon.com.mx/dp/B0DKXXWXN4';

    try {
        const result = await scrapeProduct(url);

        if (!result.success) {
            throw new Error(result.error);
        }

        console.log(`\n📸 Imágenes extraídas: ${result.images.length}`);
        result.images.forEach((img, i) => console.log(`   ${i + 1}. ${img.substring(0, 80)}...`));

        if (result.images.length > 3) {
            console.log('\n✅ ÉXITO: Se obtuvieron más de 3 imágenes');
        } else {
            console.log('\n⚠️ AVISO: Se obtuvieron 3 o menos imágenes (verificar si el producto tiene más)');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testMultiImage();
