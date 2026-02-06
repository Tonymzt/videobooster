/**
 * mediaDownloader.js - Descarga de medios en memoria desde URLs
 * CRÍTICO: Sin archivos temporales en disco
 */

const axios = require('axios');
const { Readable } = require('stream');

/**
 * Descarga una imagen o audio en Buffer
 * @param {string} url - URL del recurso
 * @returns {Promise<Buffer>}
 */
async function downloadToBuffer(url) {
    try {
        console.log(`📥 Descargando: ${url.substring(0, 60)}...`);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            timeout: 30000, // 30 segundos
        });

        const buffer = Buffer.from(response.data);
        console.log(`✅ Descargado: ${(buffer.length / 1024).toFixed(2)} KB`);

        return buffer;
    } catch (error) {
        console.error(`❌ Error descargando ${url}:`, error.message);
        throw new Error(`Download failed: ${error.message}`);
    }
}

/**
 * Descarga múltiples recursos en paralelo
 * @param {Array<string>} urls - Array de URLs
 * @returns {Promise<Array<Buffer>>}
 */
async function downloadMultiple(urls) {
    console.log(`📦 Descargando ${urls.length} recursos en paralelo...`);

    const promises = urls.map(url => downloadToBuffer(url));
    const buffers = await Promise.all(promises);

    console.log(`✅ ${buffers.length} recursos descargados`);
    return buffers;
}

/**
 * Convierte un Buffer en Stream (necesario para FFmpeg)
 * @param {Buffer} buffer
 * @returns {Readable}
 */
function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // EOF
    return stream;
}

module.exports = {
    downloadToBuffer,
    downloadMultiple,
    bufferToStream,
};
