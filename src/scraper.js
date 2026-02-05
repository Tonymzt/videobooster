/**
 * scraper.js - Módulo principal de extracción de datos
 * Extrae información de productos desde MercadoLibre y Amazon México
 * 
 * CÓMO EJECUTAR:
 * node src/scraper.js
 * 
 * EJEMPLO DE USO DESDE OTRO MÓDULO:
 * const { scrapeProduct } = require('./src/scraper');
 * const result = await scrapeProduct('https://www.mercadolibre.com.mx/...');
 * console.log(result);
 * 
 * LIMITACIONES CONOCIDAS:
 * - Timeout de 30 segundos por URL
 * - Máximo 1 retry automático
 * - Requiere conexión a internet estable
 * - Algunos productos pueden tener selectores diferentes (se usan múltiples fallbacks)
 */

/**
 * ⚠️ DEPRECATED - ESTE MÓDULO YA NO SE USA
 * 
 * Fecha de deprecación: Enero 2026
 * Razón: Pivote arquitectónico - Eliminación de scraping de marketplaces
 * Nuevo flujo: Upload directo de imágenes por el usuario
 * 
 * Este archivo se mantiene temporalmente para referencia histórica.
 * Será eliminado en la próxima versión mayor (v2.0).
 * 
 * NO USAR EN CÓDIGO NUEVO.
 */

console.warn('⚠️ scraper.js está deprecated - No usar en nuevas implementaciones');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { SELECTORS, trySelectors, trySelectorsMultiple } = require('./selectors');
const {
    cleanPrice,
    validateImages,
    truncateText,
    getRandomUserAgent,
    getRandomViewport,
    randomDelay
} = require('./utils');

// Activar plugin stealth para evitar detección
puppeteer.use(StealthPlugin());

/**
 * Detecta la plataforma a partir de la URL
 * @param {string} url - URL del producto
 * @returns {string|null} - 'mercadolibre', 'amazon' o null
 */
function detectPlatform(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const urlLower = url.toLowerCase();

    if (urlLower.includes('mercadolibre.com')) {
        return 'mercadolibre';
    }

    if (urlLower.includes('amazon.com')) {
        return 'amazon';
    }

    return null;
}

/**
 * Extrae hasta 6 imágenes de alta calidad usando múltiples estrategias
 */
async function extractImages(page, selectors, platform) {
    const imageUrls = new Set();
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    try {
        // Método 1: Selectores configurados
        for (const selector of selectorList) {
            try {
                const images = await page.$$eval(selector, (imgs) =>
                    imgs.map(img => {
                        return img.getAttribute('data-old-hires') ||
                            img.getAttribute('data-a-dynamic-image') ||
                            img.getAttribute('data-zoom') ||
                            img.src ||
                            img.getAttribute('data-src');
                    }).filter(Boolean)
                );

                images.forEach(url => {
                    if (url.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(url);
                            Object.keys(parsed).forEach(k => imageUrls.add(k));
                        } catch (e) { }
                    } else {
                        imageUrls.add(url);
                    }
                });
            } catch (e) { continue; }
        }

        // Método 2: Galería de thumbnails (Amazon)
        if (platform === 'amazon') {
            try {
                const thumbnails = await page.$$eval(
                    '#altImages img, .a-dynamic-image, #landingImage',
                    (imgs) => imgs.map(img => img.getAttribute('data-old-hires') || img.src).filter(Boolean)
                );
                thumbnails.forEach(url => imageUrls.add(url));
            } catch (e) { }
        }

        // Método 3: Imágenes de variaciones (MercadoLibre)
        if (platform === 'mercadolibre') {
            try {
                const variations = await page.$$eval(
                    '.ui-pdp-gallery__figure img, img.ui-pdp-image',
                    (imgs) => imgs.map(img => img.getAttribute('data-zoom') || img.src).filter(Boolean)
                );
                variations.forEach(url => imageUrls.add(url));
            } catch (e) { }
        }

        // Convertir Set a Array, limpiar y ordenar
        let finalImages = Array.from(imageUrls)
            .filter(url => {
                const lower = url.toLowerCase();
                const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
                // Aceptamos urls que parezcan imagenes o terminen en extension valida
                return (validExtensions.some(ext => lower.includes(ext)) || lower.includes('images/i')) &&
                    !lower.includes('placeholder') &&
                    !lower.startsWith('data:');
            })
            .filter(url => {
                return !url.includes('_SS') && // Amazon small
                    !url.includes('_AC_US40') && // Amazon thumb
                    !url.match(/\d{2,3}x\d{2,3}\./); // Dimensiones pequeñas explicitas
            });

        // Priorizar imágenes de alta resolución
        finalImages.sort((a, b) => {
            const getSizeScore = (url) => {
                if (url.includes('_SL1500_') || url.includes('1500x1500')) return 3;
                if (url.includes('_SL1000_') || url.includes('1000x1000')) return 2;
                if (url.includes('_SL500_') || url.includes('500x500')) return 1;
                return 0;
            };
            return getSizeScore(b) - getSizeScore(a);
        });

        // Tomar hasta 6 imágenes únicas
        return finalImages.slice(0, 6);

    } catch (error) {
        console.error('Error extractImages:', error.message);
        return [];
    }
}

/**
 * Extrae datos de un producto desde su URL
 * @param {string} url - URL del producto
 * @param {number} retryCount - Número de reintentos (uso interno)
 * @returns {Promise<Object>} - Objeto con los datos extraídos
 */
async function scrapeProduct(url, retryCount = 0) {
    const startTime = Date.now();
    let browser = null;

    try {
        // Validar URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida o no proporcionada');
        }

        // Detectar plataforma
        const platform = detectPlatform(url);
        if (!platform) {
            throw new Error('Plataforma no soportada. Solo MercadoLibre y Amazon México');
        }

        console.log(`🔍 Iniciando scraping de ${platform}...`);
        console.log(`📍 URL: ${url}`);

        // Configuración anti-bloqueo
        const userAgent = getRandomUserAgent();
        const viewport = getRandomViewport();

        console.log(`🎭 User-Agent: ${userAgent.substring(0, 50)}...`);
        console.log(`📱 Viewport: ${viewport.width}x${viewport.height}`);

        // Lanzar navegador
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });

        const page = await browser.newPage();

        // Configurar User-Agent y viewport
        await page.setUserAgent(userAgent);
        await page.setViewport(viewport);

        // Configurar timeout de navegación
        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(30000);

        // Navegar a la URL
        console.log('🌐 Navegando a la página...');
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Delay aleatorio para simular comportamiento humano
        console.log('⏳ Esperando carga completa...');
        await randomDelay(2000, 3000);

        // Extraer datos según la plataforma
        const selectors = SELECTORS[platform];

        console.log('📊 Extrayendo datos...');

        // Título
        const title = await trySelectors(page, selectors.title);
        if (!title) {
            throw new Error('No se pudo extraer el título del producto');
        }

        // Precio
        const priceRaw = await trySelectors(page, selectors.price);
        const price = cleanPrice(priceRaw);
        if (!price) {
            throw new Error('No se pudo extraer el precio del producto');
        }

        // Descripción
        let description = await trySelectors(page, selectors.description);

        // Para Amazon, si la descripción son bullets, formatear
        if (platform === 'amazon' && description) {
            const bullets = await page.$$eval(
                '#feature-bullets li',
                items => items.map(item => item.textContent.trim()).filter(t => t.length > 0)
            ).catch(() => []);

            if (bullets.length > 0) {
                description = bullets.join(' • ');
            }
        }

        description = truncateText(description || 'Sin descripción disponible', 500);

        // Imágenes (usando nueva función multi-imagen)
        const finalImages = await extractImages(page, selectors.images, platform);

        if (!finalImages || finalImages.length === 0) {
            console.warn('⚠️ No se encontraron imágenes con el método avanzado, intentando fallback básico...');
            const fallbackImages = await trySelectorsMultiple(page, selectors.images, 'src');
            if (fallbackImages.length > 0) {
                finalImages.push(...fallbackImages.slice(0, 6));
            }
        }

        if (!finalImages || finalImages.length === 0) {
            throw new Error('No se pudieron extraer imágenes válidas del producto');
        }

        console.log(`📸 Imágenes extraídas: ${finalImages.length}`);

        // Cerrar navegador
        await browser.close();
        browser = null;

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Scraping completado en ${elapsedTime}s`);

        // Retornar resultado exitoso
        return {
            platform,
            title,
            price,
            description,
            images: finalImages,
            scrapedAt: new Date().toISOString(),
            success: true
        };

    } catch (error) {
        // Cerrar navegador si está abierto
        if (browser) {
            await browser.close().catch(() => { });
        }

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Error en scraping (${elapsedTime}s): ${error.message}`);

        // Retry automático (solo 1 intento adicional)
        if (retryCount === 0) {
            console.log('🔄 Reintentando...');
            await randomDelay(3000, 5000);
            return scrapeProduct(url, 1);
        }

        // Retornar resultado de error
        return {
            platform: detectPlatform(url),
            success: false,
            error: error.message,
            scrapedAt: new Date().toISOString()
        };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    (async () => {
        const testUrls = require('../test/test-urls.json');

        console.log('🚀 INICIANDO PRUEBAS DEL SCRAPER\n');
        console.log('═══════════════════════════════════════════════════════\n');

        // Probar MercadoLibre
        console.log('📦 TEST 1: MERCADOLIBRE');
        console.log('───────────────────────────────────────────────────────');
        const mlResult = await scrapeProduct(testUrls.mercadolibre.url);
        console.log('\n📋 RESULTADO:');
        console.log(JSON.stringify(mlResult, null, 2));
        console.log('\n═══════════════════════════════════════════════════════\n');

        // Probar Amazon
        console.log('📦 TEST 2: AMAZON');
        console.log('───────────────────────────────────────────────────────');
        const amzResult = await scrapeProduct(testUrls.amazon.url);
        console.log('\n📋 RESULTADO:');
        console.log(JSON.stringify(amzResult, null, 2));
        console.log('\n═══════════════════════════════════════════════════════\n');

        // Resumen
        console.log('📊 RESUMEN DE PRUEBAS:');
        console.log(`MercadoLibre: ${mlResult.success ? '✅ ÉXITO' : '❌ FALLO'}`);
        console.log(`Amazon: ${amzResult.success ? '✅ ÉXITO' : '❌ FALLO'}`);

        process.exit(0);
    })();
}

module.exports = { scrapeProduct };
