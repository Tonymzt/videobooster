/**
 * Cloudflare R2 Client Configuration
 * Compatible con S3 SDK
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configuración de R2 desde variables de entorno
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Subir un archivo a R2 y retornar la URL pública
 */
export async function uploadToR2(buffer, filename, contentType) {
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000', // 1 año
        });

        await r2Client.send(command);

        const url = `${publicUrl}/${filename}`;
        console.log('✅ Archivo subido a R2:', url);

        return {
            success: true,
            url: url,
            filename: filename,
        };

    } catch (error) {
        console.error('❌ Error subiendo a R2:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

export default r2Client;
