/**
 * Definición de rutas de la API
 */
const express = require('express');
const router = express.Router();

const {
    generateVideo,
    getVideoStatus,
    getGeneralStats,
} = require('./controllers/videoController');

const {
    validateProductUrl,
    validateJobId,
    handleValidationErrors,
} = require('./middleware/validator');

// POST /api/generate-video - Generar nuevo video
router.post(
    '/generate-video',
    validateProductUrl,
    handleValidationErrors,
    generateVideo
);

// GET /api/video-status/:jobId - Obtener estado
router.get(
    '/video-status/:jobId',
    validateJobId,
    handleValidationErrors,
    getVideoStatus
);

// GET /api/stats - Estadísticas generales
router.get('/stats', getGeneralStats);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
