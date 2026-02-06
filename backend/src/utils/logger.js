/**
 * Sistema de logging profesional con Winston
 */
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'videobooster-api' },
    transports: [
        // Logs de error a archivo
        new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
        // Todos los logs a archivo
        new winston.transports.File({ filename: path.join('logs', 'combined.log') }),
    ],
});

// En desarrollo, también log a consola con colores
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

module.exports = logger;
