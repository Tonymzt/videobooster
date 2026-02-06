/**
 * debug-images.js - Script de depuración para imágenes de MercadoLibre
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
    const url = 'https://www.mercadolibre.com.mx/apple-ipad-air-11-wi-fi-128-gb-blanco/p/MLM37551542';

    console.log('🔍 Depurando extracción de imágenes...\n');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Probar diferentes selectores
    const selectors = [
        '.ui-pdp-gallery__column img',
        '.ui-pdp-thumbnail img',
        'img.ui-pdp-gallery__figure__image',
        '.ui-pdp-gallery__figure img',
        'img[src*="mlstatic"]'
    ];

    for (const selector of selectors) {
        console.log(`\n📌 Probando selector: ${selector}`);

        const images = await page.evaluate((sel) => {
            const elements = Array.from(document.querySelectorAll(sel));
            return elements.map(img => ({
                src: img.src,
                dataSrc: img.dataset.src,
                className: img.className,
                alt: img.alt
            }));
        }, selector);

        console.log(`   Encontradas: ${images.length} imágenes`);

        if (images.length > 0) {
            console.log('   Primeras 3:');
            images.slice(0, 3).forEach((img, i) => {
                console.log(`   ${i + 1}. src: ${img.src?.substring(0, 80)}...`);
                console.log(`      data-src: ${img.dataSrc || 'N/A'}`);
            });
        }
    }

    await browser.close();
    console.log('\n✅ Depuración completada');
})();
