/**
 * scriptGenerator.js - Generador de guiones de video usando OpenAI GPT-4o
 * Convierte datos de productos en scripts virales para TikTok/Reels
 */

require('dotenv').config();
const OpenAI = require('openai');
const { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } = require('./prompts/videoScript');

/**
 * Genera un guion de video viral a partir de datos de producto
 * @param {Object} productData - JSON del scraper
 * @param {string} productData.title - Título del producto
 * @param {number} productData.price - Precio en MXN
 * @param {string} productData.description - Descripción del producto
 * @returns {Promise<Object>} { success: boolean, script?: Object, error?: string }
 */
async function generateVideoScript(productData) {
    const startTime = Date.now();

    try {
        // Validación 1: Verificar que OPENAI_API_KEY existe
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY no está configurada en .env');
        }

        // Validación 2: Verificar campos obligatorios del producto
        if (!productData || typeof productData !== 'object') {
            throw new Error('productData debe ser un objeto válido');
        }

        const requiredFields = ['title', 'price', 'description'];
        for (const field of requiredFields) {
            if (!productData[field]) {
                throw new Error(`Campo obligatorio faltante: ${field}`);
            }
        }

        // Validación 3: Validar tipos de datos
        if (typeof productData.title !== 'string') {
            throw new Error('title debe ser un string');
        }

        if (typeof productData.price !== 'number') {
            throw new Error('price debe ser un número');
        }

        if (typeof productData.description !== 'string') {
            throw new Error('description debe ser un string');
        }

        console.log('🤖 Iniciando generación de guion con OpenAI...');
        console.log(`📦 Producto: ${productData.title.substring(0, 50)}...`);
        console.log(`💰 Precio: $${productData.price} MXN`);

        // Sanitizar descripción si supera 500 caracteres
        const sanitizedProduct = {
            ...productData,
            description: productData.description.length > 500
                ? productData.description.substring(0, 500) + '...'
                : productData.description
        };

        // Inicializar cliente de OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 45000 // Timeout de 45 segundos
        });

        // Generar prompt del usuario
        const userPrompt = USER_PROMPT_TEMPLATE(sanitizedProduct);

        console.log('📡 Enviando solicitud a OpenAI...');

        // Llamada a la API de OpenAI
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
            max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,
            response_format: { type: 'json_object' } // Forzar respuesta JSON
        });

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Respuesta recibida en ${elapsedTime}s`);

        // Extraer contenido de la respuesta
        const responseContent = completion.choices[0].message.content;

        // Validación 4: Validar que el JSON sea parseable
        let scriptData;
        try {
            scriptData = JSON.parse(responseContent);
        } catch (parseError) {
            throw new Error(`JSON de OpenAI no parseable: ${parseError.message}`);
        }

        // Validación 5: Verificar que scenes tenga al menos 3 escenas
        if (!scriptData.scenes || !Array.isArray(scriptData.scenes)) {
            throw new Error('El JSON debe contener un array "scenes"');
        }

        if (scriptData.scenes.length < 3) {
            throw new Error(`El guion debe tener al menos 3 escenas (recibido: ${scriptData.scenes.length})`);
        }

        if (scriptData.scenes.length > 10) {
            console.warn(`⚠️  Advertencia: El guion tiene ${scriptData.scenes.length} escenas (máximo recomendado: 10)`);
            // Truncar a 10 escenas
            scriptData.scenes = scriptData.scenes.slice(0, 10);
        }

        // Validar estructura de cada escena
        for (let i = 0; i < scriptData.scenes.length; i++) {
            const scene = scriptData.scenes[i];
            if (!scene.visual_cue || !scene.text || !scene.duration_est) {
                throw new Error(`Escena ${i + 1} tiene campos faltantes (visual_cue, text, duration_est)`);
            }
        }

        console.log(`📊 Guion generado: ${scriptData.scenes.length} escenas`);
        console.log(`🎬 Duración estimada: ${scriptData.scenes.reduce((sum, s) => sum + s.duration_est, 0)}s`);

        // Retornar resultado exitoso
        return {
            success: true,
            script: scriptData,
            generatedAt: new Date().toISOString(),
            model: completion.model,
            tokensUsed: completion.usage.total_tokens
        };

    } catch (error) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Error en generación de guion (${elapsedTime}s): ${error.message}`);

        // Manejo de errores específicos de OpenAI
        if (error.code === 'insufficient_quota') {
            return {
                success: false,
                error: 'API_QUOTA_EXCEEDED',
                message: 'Cuota de API de OpenAI excedida'
            };
        }

        if (error.code === 'invalid_api_key') {
            return {
                success: false,
                error: 'INVALID_API_KEY',
                message: 'API key de OpenAI inválida'
            };
        }

        if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
            return {
                success: false,
                error: 'API_TIMEOUT',
                message: 'Timeout de 45 segundos excedido'
            };
        }

        // Error genérico
        return {
            success: false,
            error: `OPENAI_ERROR: ${error.message}`,
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = { generateVideoScript };
