/**
 * Cliente de Supabase para persistencia de trabajos
 */
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Validar variables de entorno
// Usamos SERVICE_KEY como fallback si ANON_KEY no está presente
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!process.env.SUPABASE_URL || !supabaseKey) {
    throw new Error('SUPABASE_URL y una key (ANON o SERVICE) son requeridas');
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    supabaseKey
);

/**
 * Crear un nuevo trabajo en la base de datos
 */
async function createJob(jobId, productUrl, userId = null) {
    try {
        const jobData = {
            job_id: jobId,
            product_url: productUrl,
            status: 'pending',
            progress: 0,
        };

        if (userId) {
            jobData.user_id = userId;
        }

        const { data, error } = await supabase
            .from('video_jobs')
            .insert(jobData)
            .select()
            .single();

        if (error) throw error;

        logger.info(`Job creado en DB: ${jobId}`);
        return data;
    } catch (error) {
        logger.error(`Error creando job en DB: ${error.message}`);
        throw error;
    }
}

/**
 * Actualizar estado de un trabajo
 */
async function updateJobStatus(jobId, updates) {
    try {
        const { data, error } = await supabase
            .from('video_jobs')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('job_id', jobId)
            .select()
            .single();

        if (error) throw error;

        logger.info(`Job ${jobId} actualizado: ${updates.status || 'data update'}`);
        return data;
    } catch (error) {
        logger.error(`Error actualizando job ${jobId}: ${error.message}`);
        throw error;
    }
}

/**
 * Obtener información de un trabajo
 */
async function getJob(jobId) {
    try {
        const { data, error } = await supabase
            .from('video_jobs')
            .select('*')
            .eq('job_id', jobId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Job no encontrado
            }
            throw error;
        }

        return data;
    } catch (error) {
        logger.error(`Error obteniendo job ${jobId}: ${error.message}`);
        throw error;
    }
}

/**
 * Marcar job como completado
 */
async function completeJob(jobId, videoUrl, metadata = {}) {
    return updateJobStatus(jobId, {
        status: 'completed',
        video_url: videoUrl,
        progress: 100,
        completed_at: new Date().toISOString(),
    });
}

/**
 * Marcar job como fallido
 */
async function failJob(jobId, errorMessage) {
    return updateJobStatus(jobId, {
        status: 'failed',
        error_message: errorMessage,
    });
}

/**
 * Obtener estadísticas generales
 */
async function getStats() {
    try {
        // Nota: count() es más eficiente que traer todos los datos
        const { count: total, error: totalError } = await supabase
            .from('video_jobs')
            .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Obtener contadores por estado (esto puede optimizarse en producción con una RPC o view)
        const { data, error } = await supabase
            .from('video_jobs')
            .select('status');

        if (error) throw error;

        const stats = {
            total: total || 0,
            pending: data.filter(j => j.status === 'pending').length,
            processing: data.filter(j => !['pending', 'completed', 'failed'].includes(j.status)).length,
            completed: data.filter(j => j.status === 'completed').length,
            failed: data.filter(j => j.status === 'failed').length,
        };

        return stats;
    } catch (error) {
        logger.error(`Error obteniendo stats: ${error.message}`);
        throw error;
    }
}

module.exports = {
    supabase,
    createJob,
    updateJobStatus,
    getJob,
    completeJob,
    failJob,
    getStats,
};
