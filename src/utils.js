/**
 * utils.js - Funciones auxiliares para el scraper
 * Incluye limpieza de precios, validaciones y helpers generales
 */

/**
 * Limpia y normaliza un string de precio a número
 * Elimina símbolos de moneda, comas, espacios y convierte a float
 * @param {string} priceString - String del precio (ej: "$1,234.56", "$ 1.234,56")
 * @returns {number|null} - Precio como número o null si es inválido
 */
function cleanPrice(priceString) {
  if (!priceString || typeof priceString !== 'string') {
    return null;
  }

  // Eliminar símbolos de moneda, espacios y caracteres especiales
  let cleaned = priceString
    .replace(/[$\s]/g, '')
    .replace(/[^\d.,]/g, '');

  // Detectar formato (usar el último separador como decimal)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Formato europeo: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Formato americano: 1,234.56 -> 1234.56
    cleaned = cleaned.replace(/,/g, '');
  }

  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

/**
 * Valida que un array de URLs de imágenes sea válido
 * @param {Array} images - Array de URLs
 * @returns {boolean} - true si tiene al menos 1 URL válida
 */
function validateImages(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return false;
  }

  // Verificar que al menos una URL sea válida
  const validImages = images.filter(img => {
    return typeof img === 'string' && 
           img.trim().length > 0 && 
           (img.startsWith('http://') || img.startsWith('https://'));
  });

  return validImages.length > 0;
}

/**
 * Trunca un texto a un máximo de caracteres
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima (default: 500)
 * @returns {string} - Texto truncado
 */
function truncateText(text, maxLength = 500) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const cleaned = text.trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.substring(0, maxLength - 3) + '...';
}

/**
 * Genera un User-Agent aleatorio
 * @returns {string} - User-Agent string
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Genera un viewport aleatorio (móvil o desktop)
 * @returns {Object} - Objeto con width y height
 */
function getRandomViewport() {
  const viewports = [
    { width: 1920, height: 1080 }, // Desktop FHD
    { width: 1366, height: 768 },  // Desktop HD
    { width: 1536, height: 864 },  // Desktop HD+
    { width: 390, height: 844 },   // iPhone 12/13/14
    { width: 393, height: 852 }    // iPhone 14 Pro
  ];

  return viewports[Math.floor(Math.random() * viewports.length)];
}

/**
 * Espera un tiempo aleatorio (para simular comportamiento humano)
 * @param {number} min - Tiempo mínimo en ms
 * @param {number} max - Tiempo máximo en ms
 * @returns {Promise} - Promise que se resuelve después del delay
 */
function randomDelay(min = 2000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = {
  cleanPrice,
  validateImages,
  truncateText,
  getRandomUserAgent,
  getRandomViewport,
  randomDelay
};
