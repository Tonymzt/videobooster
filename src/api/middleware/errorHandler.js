/**
 * Middleware de manejo de errores global
 */
const logger = require('../../utils/logger');

function errorHandler(err, req, res, next) {
    logger.error(`Error en ${req.method} ${req.path}: ${err.message}`);
    logger.error(err.stack);

    // Errores de validación ya fueron manejados
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

module.exports = errorHandler;
