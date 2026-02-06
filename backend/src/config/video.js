/**
 * video.js - Configuración estándar para videos de TikTok/Reels
 */

const VIDEO_CONFIG = {
    // Formato vertical (9:16)
    width: 1080,
    height: 1920,

    // Codec y calidad
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '3000k',
    audioBitrate: '128k',

    // Frame rate
    fps: 30,

    // Efectos
    kenBurnsZoom: 1.1,      // 10% zoom
    kenBurnsDuration: 0.5,  // Segundos para completar zoom

    // Overlay de precio
    priceOverlay: {
        fontSize: 72,
        fontColor: 'white',
        bgColor: 'black@0.7',
        position: 'bottom-right',
        padding: 20,
    },

    // Transiciones
    fadeInDuration: 0.3,
    fadeOutDuration: 0.3,
};

module.exports = { VIDEO_CONFIG };
