/**
 * Configuración de BullMQ para procesamiento asíncrono
 */
const { Queue } = require('bullmq');
const logger = require('../utils/logger');

// Configuración de conexión a Redis
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Crear cola de videos
const videoQueue = new Queue('video-generation', {
    connection,
    defaultJobOptions: {
        attempts: 3, // Reintentar hasta 3 veces
        backoff: {
            type: 'exponential',
            delay: 5000, // Empezar con 5 segundos
        },
        removeOnComplete: {
            count: 100, // Mantener últimos 100 completados
            age: 24 * 3600, // 24 horas
        },
        removeOnFail: {
            count: 50, // Mantener últimos 50 fallidos
        },
    },
});

// Event listeners
videoQueue.on('error', (error) => {
    logger.error(`Queue error: ${error.message}`);
});

logger.info('Video queue initialized');

/**
 * Agregar un trabajo a la cola
 */
async function addVideoJob(jobId, productUrl) {
    try {
        const job = await videoQueue.add(
            'generate-video',
            {
                jobId,
                productUrl,
            },
            {
                jobId, // Usar el mismo ID para tracking
            }
        );

        logger.info(`Job ${jobId} añadido a la cola`);
        return job;
    } catch (error) {
        logger.error(`Error añadiendo job a la cola: ${error.message}`);
        throw error;
    }
}

/**
 * Obtener estado de un trabajo en la cola
 */
async function getJobStatus(jobId) {
    try {
        const job = await videoQueue.getJob(jobId);

        if (!job) {
            return null;
        }

        const state = await job.getState();
        const progress = job.progress;

        return {
            id: job.id,
            state,
            progress,
            data: job.data,
            returnvalue: job.returnvalue,
            failedReason: job.failedReason,
        };
    } catch (error) {
        logger.error(`Error obteniendo estado del job ${jobId}: ${error.message}`);
        return null;
    }
}

module.exports = {
    videoQueue,
    addVideoJob,
    getJobStatus,
};
