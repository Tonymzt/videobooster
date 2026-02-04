/**
 * Middleware de validación de requests
 */
const { body, param, validationResult } = require('express-validator');

/**
 * Validar URL de producto
 */
const validateProductUrl = [
    body('productUrl')
        .trim()
        .notEmpty()
        .withMessage('productUrl es requerida')
        .isURL()
        .withMessage('productUrl debe ser una URL válida')
        .custom((value) => {
            const allowedDomains = ['mercadolibre.com', 'amazon.com'];
            try {
                const url = new URL(value);
                const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));

                if (!isAllowed) {
                    throw new Error('Solo se permiten URLs de MercadoLibre o Amazon');
                }
            } catch (e) {
                if (e.message.includes('Solo se permiten')) throw e;
                throw new Error('URL inválida');
            }

            return true;
        }),
];

/**
 * Validar jobId
 */
const validateJobId = [
    param('jobId')
        .trim()
        .notEmpty()
        .withMessage('jobId es requerido')
        .isLength({ min: 10 })
        .withMessage('jobId inválido'),
];

/**
 * Middleware para procesar errores de validación
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    next();
}

module.exports = {
    validateProductUrl,
    validateJobId,
    handleValidationErrors,
};
