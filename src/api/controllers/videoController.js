/**
 * Controladores de los endpoints de video
 */
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { createJob, getJob, getStats } = require('../../services/database');
const { addVideoJob, getJobStatus } = require('../../queue/videoQueue');

/**
 * POST /api/generate-video
 * Crear un nuevo trabajo de generación de video
 */
async function generateVideo(req, res, next) {
    try {
        const { productUrl, userId } = req.body;

        // Generar ID único para el trabajo
        const jobId = `job_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

        logger.info(`📥 Nueva solicitud de video: ${jobId}`);
        logger.info(`   URL: ${productUrl}`);
        if (userId) logger.info(`   User: ${userId}`);

        // Crear registro en base de datos
        await createJob(jobId, productUrl, userId);

        // Agregar a la cola
        await addVideoJob(jobId, productUrl);

        res.status(202).json({
            success: true,
            message: 'Video en proceso de generación',
            jobId,
            statusUrl: `/api/video-status/${jobId}`,
        });

    } catch (error) {
        logger.error(`Error en generateVideo: ${error.message}`);
        next(error);
    }
}

/**
 * GET /api/video-status/:jobId
 * Obtener estado de un trabajo
 */
async function getVideoStatus(req, res, next) {
    try {
        const { jobId } = req.params;

        // Obtener de la base de datos
        const job = await getJob(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Trabajo no encontrado',
            });
        }

        // Obtener estado de la cola (para progress en tiempo real)
        const queueStatus = await getJobStatus(jobId);

        const response = {
            success: true,
            jobId: job.job_id,
            status: job.status,
            progress: queueStatus?.progress || job.progress,
            productUrl: job.product_url,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
        };

        // Si está completado, incluir URL del video
        if (job.status === 'completed') {
            response.videoUrl = job.video_url;
            response.completedAt = job.completed_at;
            response.metadata = {
                product: job.product_data?.title,
                scenes: job.script_data?.scenes?.length,
            };
        }

        // Si falló, incluir error
        if (job.status === 'failed') {
            response.error = job.error_message;
        }

        res.json(response);

    } catch (error) {
        logger.error(`Error en getVideoStatus: ${error.message}`);
        next(error);
    }
}

/**
 * GET /api/stats
 * Obtener estadísticas generales
 */
async function getGeneralStats(req, res, next) {
    try {
        const stats = await getStats();

        res.json({
            success: true,
            stats,
        });

    } catch (error) {
        logger.error(`Error en getGeneralStats: ${error.message}`);
        next(error);
    }
}

module.exports = {
    generateVideo,
    getVideoStatus,
    getGeneralStats,
};
