/**
 * Servidor Express principal
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const apiRoutes = require('./api/routes');
const errorHandler = require('./api/middleware/errorHandler');

// Importar worker (para inicializarlo)
require('./queue/processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Rutas
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
    });
});

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
    logger.info(`\n${'═'.repeat(60)}`);
    logger.info(`🚀 VideoBooster API Server`);
    logger.info(`📡 Puerto: ${PORT}`);
    logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📊 Endpoints:`);
    logger.info(`   POST   /api/generate-video`);
    logger.info(`   GET    /api/video-status/:jobId`);
    logger.info(`   GET    /api/stats`);
    logger.info(`   GET    /api/health`);
    logger.info('═'.repeat(60) + '\n');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app;
