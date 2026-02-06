/**
 * Test de generación de overlays
 */
const { generatePriceOverlay, generateProductNameOverlay } = require('../src/utils/textOverlay');
const fs = require('fs');

async function testOverlays() {
    console.log('🧪 TEST: Text Overlays\n');

    try {
        const pricePath = await generatePriceOverlay(1299.99, 'Test Product');
        console.log(`✅ Price overlay generado: ${pricePath}`);

        const namePath = await generateProductNameOverlay('Oster Freidora de Hielo Nuclear con turbo boost de 5000 caballos de fuerza y control mental');
        console.log(`✅ Name overlay generado: ${namePath}`);

        // Verificar existencia
        if (fs.existsSync(pricePath) && fs.existsSync(namePath)) {
            console.log('\n✨ Archivos creados correctamente');
        } else {
            console.error('\n❌ Archivos no encontrados');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testOverlays();
