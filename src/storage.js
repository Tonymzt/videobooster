/**
 * storage.js - Módulo de almacenamiento en Cloudflare R2
 * CRÍTICO: Todo se maneja en memoria (Buffers), sin archivos temporales
 */

const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getR2Client } = require('./config/r2');
const crypto = require('crypto');

/**
 * Genera un nombre de archivo único con timestamp
 * @param {string} prefix - Prefijo del archivo
 * @param {string} extension - Extensión del archivo
 * @returns {string} Nombre de archivo único
 */
function generateFileName(prefix, extension) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString('hex');
    return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Sube un buffer a R2 y retorna la URL pública
 * @param {Buffer} buffer - Datos en memoria
 * @param {string} fileName - Nombre del archivo (opcional)
 * @param {string} contentType - MIME type (ej: 'audio/mpeg')
 * @returns {Promise<Object>} { success, url, key, size, error }
 */
async function uploadBuffer(buffer, fileName = null, contentType = 'application/octet-stream') {
    try {
        // Validación de input
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('El primer parámetro debe ser un Buffer');
        }

        if (buffer.length === 0) {
            throw new Error('El buffer está vacío');
        }

        // Generar nombre si no se proporciona
        const extension = contentType.split('/')[1] || 'bin';
        const key = fileName || generateFileName('asset', extension);

        const client = getR2Client();
        const bucketName = process.env.R2_BUCKET_NAME;

        // Comando de subida
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        console.log(`📤 Subiendo ${key} (${(buffer.length / 1024).toFixed(2)} KB) a R2...`);

        await client.send(command);

        // Construir URL pública
        const publicUrl = process.env.R2_PUBLIC_URL
            ? `${process.env.R2_PUBLIC_URL}/${key}`
            : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;

        console.log(`✅ Archivo subido: ${publicUrl}`);

        return {
            success: true,
            url: publicUrl,
            key: key,
            size: buffer.length,
            uploadedAt: new Date().toISOString(),
        };

    } catch (error) {
        console.error('❌ Error en uploadBuffer:', error.message);
        return {
            success: false,
            error: error.message,
            code: error.code || 'UPLOAD_ERROR',
        };
    }
}

/**
 * Verifica la conexión con R2 (healthcheck)
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
async function testConnection() {
    try {
        const testBuffer = Buffer.from('test-connection');
        const result = await uploadBuffer(testBuffer, 'healthcheck.txt', 'text/plain');
        return result.success;
    } catch (error) {
        console.error('❌ Error de conexión R2:', error.message);
        return false;
    }
}

module.exports = {
    uploadBuffer,
    testConnection,
    generateFileName,
};
