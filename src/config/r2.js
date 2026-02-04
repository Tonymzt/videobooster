/**
 * r2.js - Configuración de Cloudflare R2 usando SDK de AWS S3
 * R2 es compatible con la API de S3, por eso usamos @aws-sdk/client-s3
 */

const { S3Client } = require('@aws-sdk/client-s3');

const r2Config = {
    region: 'auto', // R2 usa 'auto' como región
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
};

/**
 * Validación de variables de entorno R2
 * @throws {Error} Si falta alguna variable requerida
 */
function validateR2Config() {
    const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno R2: ${missing.join(', ')}`);
    }
}

/**
 * Obtiene una instancia configurada del cliente R2
 * @returns {S3Client} Cliente S3 configurado para R2
 */
function getR2Client() {
    validateR2Config();
    return new S3Client(r2Config);
}

module.exports = { getR2Client, validateR2Config };
