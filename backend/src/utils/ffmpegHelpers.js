/**
 * ffmpegHelpers.js - Helpers y utilidades para FFmpeg
 */

const ffmpeg = require('fluent-ffmpeg');
const { VIDEO_CONFIG } = require('../config/video');

/**
 * Verifica que FFmpeg esté instalado
 * @returns {Promise<boolean>}
 */
function checkFFmpegInstallation() {
    return new Promise((resolve, reject) => {
        ffmpeg.getAvailableFormats((err, formats) => {
            if (err) {
                reject(new Error('FFmpeg no está instalado o no está en el PATH'));
            } else {
                console.log('✅ FFmpeg detectado correctamente');
                resolve(true);
            }
        });
    });
}

/**
 * Obtiene la duración de un audio en segundos
 * @param {string} audioPath - Path temporal del audio
 * @returns {Promise<number>}
 */
function getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const duration = metadata.format.duration;
                resolve(duration);
            }
        });
    });
}

/**
 * Genera filtro de Ken Burns (zoom suave)
 * @param {number} duration - Duración en segundos
 * @returns {string} Filtro FFmpeg
 */
function generateKenBurnsFilter(duration) {
    const { width, height, kenBurnsZoom } = VIDEO_CONFIG;

    // Zoom desde 1.0 hasta kenBurnsZoom
    return `zoompan=z='min(zoom+0.0015,${kenBurnsZoom})':d=${duration * VIDEO_CONFIG.fps}:s=${width}x${height}:fps=${VIDEO_CONFIG.fps}`;
}

/**
 * Genera filtro de overlay de precio
 * @param {number} price - Precio del producto
 * @returns {string} Filtro FFmpeg
 */
function generatePriceOverlay(price) {
    const { fontSize, fontColor, padding } = VIDEO_CONFIG.priceOverlay;
    const x = VIDEO_CONFIG.width - padding;
    const y = VIDEO_CONFIG.height - padding;

    // Simplificación temporal para debug: Solo precio sin espacio ni MXN
    const priceText = `\\\\$${price.toLocaleString('es-MX')}`;

    // Usar fuente del sistema (Arial para macOS)
    const fontPath = '/System/Library/Fonts/Supplemental/Arial.ttf';

    // Drawtext con fondo semi-transparente
    // NOTA: 'drawtext' no está disponible en esta versión de FFmpeg (falta libfreetype).
    // Por ahora solo dibujamos la caja de fondo.
    /*
    return `drawbox=x=${x - 300}:y=${y - 100}:w=280:h=80:color=black@0.7:t=fill,` +
        `drawtext=text='${priceText}':fontsize=${fontSize}:fontcolor=${fontColor}:` +
        `x=${x - 290}:y=${y - 90}:fontfile=${fontPath}`;
    */

    // Solo caja por ahora (MVP fallback)
    return `drawbox=x=${x - 300}:y=${y - 100}:w=280:h=80:color=black@0.7:t=fill`;
}

module.exports = {
    checkFFmpegInstallation,
    getAudioDuration,
    generateKenBurnsFilter,
    generatePriceOverlay,
};
