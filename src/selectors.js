/**
 * selectors.js - Selectores CSS por plataforma
 * Define los selectores para extraer datos de MercadoLibre y Amazon
 */

/**
 * ⚠️ DEPRECATED - ESTE MÓDULO YA NO SE USA
 * 
 * Selectores para Amazon y MercadoLibre (obsoletos)
 * Ver scraper.js para más información sobre la deprecación
 */

console.warn('⚠️ selectors.js está deprecated - Scraping eliminado del sistema');

const SELECTORS = {
    mercadolibre: {
        title: [
            '.ui-pdp-title',
            'h1.ui-pdp-title',
            'h1[class*="ui-pdp-title"]',
            'h1[class*="title"]'
        ],
        price: [
            '.ui-pdp-price__amount .andes-money-amount__fraction',
            '.andes-money-amount__fraction',
            'span.andes-money-amount__fraction',
            '.price-tag-fraction'
        ],
        description: [
            '.ui-pdp-description__content',
            'p.ui-pdp-description__content',
            '.ui-pdp-description p',
            'div[class*="description"]'
        ],
        images: [
            '.ui-pdp-gallery__column img',
            '.ui-pdp-thumbnail img',
            'img.ui-pdp-gallery__figure__image',
            '.ui-pdp-gallery__figure img',
            'img[src*="mlstatic"]',
            'img[data-src*="mlstatic"]'
        ]
    },
    amazon: {
        title: [
            '#productTitle',
            'h1#productTitle',
            'span#productTitle',
            'h1[id*="title"]'
        ],
        price: [
            '.a-price-whole',
            'span.a-price-whole',
            '.a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            'span[class*="price"]'
        ],
        description: [
            '#feature-bullets ul',
            '.a-unordered-list.a-vertical',
            '#productDescription',
            'div#feature-bullets',
            'div[id*="description"]'
        ],
        images: [
            '#landingImage',
            '#imgBlkFront',
            '.a-dynamic-image',
            'img[data-a-dynamic-image]',
            'img[class*="product"]'
        ]
    }
};

/**
 * Intenta extraer texto usando múltiples selectores
 * @param {Object} page - Página de Puppeteer
 * @param {Array} selectors - Array de selectores CSS
 * @returns {Promise<string|null>} - Texto extraído o null
 */
async function trySelectors(page, selectors) {
    for (const selector of selectors) {
        try {
            const element = await page.$(selector);
            if (element) {
                const text = await page.evaluate(el => el.textContent, element);
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            }
        } catch (error) {
            // Continuar con el siguiente selector
            continue;
        }
    }
    return null;
}

/**
 * Intenta extraer múltiples elementos (como imágenes)
 * @param {Object} page - Página de Puppeteer
 * @param {Array} selectors - Array de selectores CSS
 * @param {string} attribute - Atributo a extraer (default: 'src')
 * @returns {Promise<Array>} - Array de valores extraídos
 */
async function trySelectorsMultiple(page, selectors, attribute = 'src') {
    for (const selector of selectors) {
        try {
            const elements = await page.$$(selector);
            if (elements && elements.length > 0) {
                const values = await Promise.all(
                    elements.map(el =>
                        page.evaluate((element, attr) => {
                            // Para imágenes de Amazon con data-a-dynamic-image
                            if (attr === 'src' && element.hasAttribute('data-a-dynamic-image')) {
                                try {
                                    const data = JSON.parse(element.getAttribute('data-a-dynamic-image'));
                                    const urls = Object.keys(data);
                                    return urls[0]; // Retornar la primera URL (mayor resolución)
                                } catch (e) {
                                    return element.getAttribute(attr);
                                }
                            }

                            // Para imágenes con lazy loading (data-src)
                            if (attr === 'src') {
                                const dataSrc = element.getAttribute('data-src');
                                const src = element.getAttribute('src');

                                // Preferir data-src si existe y no es un placeholder
                                if (dataSrc && !dataSrc.startsWith('data:image')) {
                                    return dataSrc;
                                }

                                // Sino, usar src si no es placeholder
                                if (src && !src.startsWith('data:image')) {
                                    return src;
                                }
                            }

                            return element.getAttribute(attr);
                        }, el, attribute)
                    )
                );

                // Filtrar valores válidos
                const validValues = values.filter(v => v && v.trim().length > 0);
                if (validValues.length > 0) {
                    return validValues;
                }
            }
        } catch (error) {
            // Continuar con el siguiente selector
            continue;
        }
    }
    return [];
}

module.exports = {
    SELECTORS,
    trySelectors,
    trySelectorsMultiple
};
