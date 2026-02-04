/**
 * Servicio de generación de fondos con Leonardo.ai
 * ACTUALIZADO: Fix Error 400
 */
const axios = require('axios');
const logger = require('../utils/logger');
const { downloadToBuffer } = require('../utils/mediaDownloader');
const { uploadBuffer } = require('../storage');

const LEONARDO_CONFIG = {
    apiKey: process.env.LEONARDO_API_KEY,
    enabled: process.env.LEONARDO_ENABLED === 'true',
    baseUrl: 'https://cloud.leonardo.ai/api/rest/v1',
};

/**
 * Modelos verificados de Leonardo.ai (Enero 2025)
 */
const LEONARDO_MODELS = {
    PHOENIX: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3',    // Phoenix - Mejor calidad general
    KINO_XL: 'aa77f04e-3eec-4034-9c07-d0f619684628',    // Kino XL - Cinematográfico
    VISION_XL: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',  // Vision XL - Realista
    ANIME_PASTEL: '1e60896f-3c26-4296-8ecc-53e2afecc132', // Anime style
};

// Usar Kino XL como principal (mejor para fondos comerciales)
const DEFAULT_MODEL = LEONARDO_MODELS.KINO_XL;

/**
 * Detectar categoría del producto basado en título
 */
function detectProductCategory(productTitle) {
    const title = productTitle.toLowerCase();

    const categories = {
        kitchen: ['freidora', 'licuadora', 'cafetera', 'horno', 'microondas', 'batidora', 'tostador', 'olla', 'sartén'],
        electronics: ['auriculares', 'audífonos', 'smartwatch', 'tablet', 'laptop', 'teléfono', 'cámara', 'bocina', 'altavoz'],
        beauty: ['crema', 'perfume', 'maquillaje', 'shampoo', 'loción', 'sérum', 'labial', 'base'],
        fitness: ['pesa', 'mancuerna', 'yoga', 'caminadora', 'bicicleta', 'ejercicio', 'banda', 'colchoneta'],
        home: ['almohada', 'sábana', 'toalla', 'lámpara', 'decoración', 'cojín', 'cortina'],
        toys: ['juguete', 'muñeca', 'lego', 'peluche', 'juego', 'rompecabezas'],
        fashion: ['zapato', 'tenis', 'bolsa', 'cartera', 'reloj', 'ropa', 'playera', 'pantalón'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => title.includes(keyword))) {
            return category;
        }
    }

    return 'general';
}

/**
 * Generar prompt para fondo basado en categoría
 */
function generateBackgroundPrompt(category, productName) {
    const prompts = {
        kitchen: 'Modern luxury kitchen counter, white marble countertop, soft natural window light, minimalist design, blurred background, bokeh effect, professional product photography, 9:16 vertical composition, clean aesthetic',

        electronics: 'Futuristic tech workspace, dark background with subtle blue purple gradient, modern minimal desk, soft neon accent lights, shallow depth of field, premium tech showcase, 9:16 portrait format, cinematic lighting',

        beauty: 'Elegant spa bathroom setting, white marble surface, soft pink ambient lighting, delicate rose petals, minimalist luxury aesthetic, blurred background, beauty product showcase, 9:16 vertical, dreamy bokeh',

        fitness: 'Modern gym interior, motivational atmosphere, natural daylight through windows, wooden floor, gym equipment softly blurred in background, fitness product display, 9:16 portrait orientation, energetic vibe',

        home: 'Cozy modern bedroom, soft natural light, neutral beige tones, minimalist scandinavian decor, warm ambiance, blurred background, home product showcase, 9:16 vertical format, peaceful atmosphere',

        toys: 'Bright cheerful playroom, soft pastel colors, natural light, wooden toys blurred in background, playful atmosphere, child-friendly environment, 9:16 portrait, joyful mood',

        fashion: 'Luxury fashion boutique interior, soft spotlights, minimalist display, marble and gold accents, elegant atmosphere, shallow depth of field, high-end retail setting, 9:16 portrait, sophisticated lighting',

        general: 'Clean modern studio setup, smooth gradient background from light gray to white, soft professional studio lighting, minimal distractions, product photography background, 9:16 vertical format, commercial quality',
    };

    return prompts[category] || prompts.general;
}

/**
 * Generar fondo con Leonardo.ai
 * ACTUALIZADO con logging completo y parámetros corregidos
 */
async function generateBackground(productTitle, jobId) {
    if (!LEONARDO_CONFIG.enabled) {
        logger.warn('⚠️ Leonardo.ai deshabilitado en config');
        return { success: false, reason: 'DISABLED' };
    }

    if (!LEONARDO_CONFIG.apiKey) {
        logger.error('❌ Leonardo.ai API key no configurada');
        return { success: false, reason: 'NO_API_KEY' };
    }

    try {
        const category = detectProductCategory(productTitle);
        const prompt = generateBackgroundPrompt(category, productTitle);

        logger.info(`🎨 Generando fondo Leonardo.ai`);
        logger.info(`   Categoría detectada: ${category}`);
        logger.info(`   Prompt: ${prompt.substring(0, 100)}...`);

        // Dimensiones exactas para ratio 9:16
        // Leonardo acepta múltiplos de 8
        const width = 832;   // 832 / 1472 = 0.5652... ≈ 9/16 = 0.5625
        const height = 1472; // Ratio: 9:16 exacto

        // Payload exacto según documentación de Leonardo.ai
        const requestPayload = {
            height: height,              // INTEGER (no string)
            width: width,                // INTEGER (no string)
            prompt: prompt,
            modelId: DEFAULT_MODEL,      // Kino XL
            num_images: 1,
            guidance_scale: 7,           // 7 es óptimo para realismo
            promptMagic: false,          // Desactivar para mayor control
            photoReal: false,            // Desactivar (solo para Phoenix)
            alchemy: true,               // Activar para mejor calidad
            presetStyle: 'CINEMATIC',    // Estilo cinematográfico
            scheduler: 'LEONARDO',       // Scheduler por defecto
            public: false,               // No hacer pública la imagen
            nsfw: false,                 // Contenido seguro
            num_inference_steps: 30,     // Pasos de inferencia (calidad vs velocidad)
        };

        // 🔍 LOG COMPLETO DEL REQUEST
        logger.info('\n📋 REQUEST PAYLOAD A LEONARDO.AI:');
        logger.info(JSON.stringify(requestPayload, null, 2));
        logger.info('');

        // Paso 1: Crear generación
        logger.info('📤 Enviando request a Leonardo.ai...');

        const generateResponse = await axios.post(
            `${LEONARDO_CONFIG.baseUrl}/generations`,
            requestPayload,
            {
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer ${LEONARDO_CONFIG.apiKey}`,
                    'content-type': 'application/json',
                },
                timeout: 30000, // 30 segundos timeout
            }
        );

        // 🔍 LOG DE RESPUESTA
        logger.info('📥 Respuesta de Leonardo.ai:');
        logger.info(JSON.stringify(generateResponse.data, null, 2));
        logger.info('');

        const generationId = generateResponse.data.sdGenerationJob.generationId;
        logger.info(`   ✅ Generación iniciada: ${generationId}`);

        // Paso 2: Polling hasta que complete
        let imageUrl = null;
        let attempts = 0;
        const maxAttempts = 40; // 80 segundos max (2 segundos × 40)

        while (!imageUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;

            logger.info(`   ⏳ Esperando generación... (${attempts}/${maxAttempts})`);

            const statusResponse = await axios.get(
                `${LEONARDO_CONFIG.baseUrl}/generations/${generationId}`,
                {
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${LEONARDO_CONFIG.apiKey}`,
                    },
                }
            );

            const generation = statusResponse.data.generations_by_pk;

            if (generation.status === 'COMPLETE') {
                imageUrl = generation.generated_images[0].url;
                logger.info(`   ✅ Imagen generada en ${attempts * 2} segundos`);

                // Log de la imagen generada
                logger.info(`   🖼️ URL de imagen: ${imageUrl}`);
            } else if (generation.status === 'FAILED') {
                logger.error(`   ❌ Generación falló en Leonardo.ai`);
                logger.error(`   Razón: ${JSON.stringify(generation)}`);
                throw new Error('Generación falló en Leonardo.ai');
            } else {
                // Status: PENDING
                logger.debug(`   Estado actual: ${generation.status}`);
            }
        }

        if (!imageUrl) {
            throw new Error(`Timeout esperando generación (${maxAttempts * 2} segundos)`);
        }

        // Paso 3: Descargar y subir a R2
        logger.info(`   📥 Descargando imagen generada...`);
        const imageBuffer = await downloadToBuffer(imageUrl);
        logger.info(`   ✅ Descargada: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

        const fileName = `background_${jobId}_${category}_${Date.now()}.png`;
        const uploadResult = await uploadBuffer(imageBuffer, fileName, 'image/png');

        if (!uploadResult.success) {
            throw new Error(`Upload falló: ${uploadResult.error}`);
        }

        logger.info(`   ☁️ Fondo subido a R2: ${uploadResult.url}`);

        return {
            success: true,
            backgroundUrl: uploadResult.url,
            category,
            prompt,
            generationId,
            dimensions: { width, height },
        };

    } catch (error) {
        logger.error(`❌ Error generando fondo con Leonardo.ai:`);
        logger.error(`   Mensaje: ${error.message}`);

        if (error.response) {
            logger.error(`   Status: ${error.response.status}`);
            logger.error(`   Status Text: ${error.response.statusText}`);
            logger.error(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
            logger.error(`   Request URL: ${error.config.url}`);
        }

        if (error.code) {
            logger.error(`   Error Code: ${error.code}`);
        }

        return {
            success: false,
            error: error.message,
            details: error.response?.data || null,
        };
    }
}

/**
 * Verificar disponibilidad del servicio
 */
function isLeonardoAvailable() {
    if (!LEONARDO_CONFIG.enabled) {
        return { available: false, reason: 'DISABLED_IN_CONFIG' };
    }
    if (!LEONARDO_CONFIG.apiKey) {
        return { available: false, reason: 'NO_API_KEY' };
    }
    return { available: true };
}

module.exports = {
    generateBackground,
    detectProductCategory,
    isLeonardoAvailable,
    LEONARDO_MODELS, // Exportar para referencia
};
