/**
 * Funciones para interactuar con el backend
 */
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Generar un nuevo video
 */
export async function generateVideo(params, userId) {
    try {
        const response = await axios.post(`${API_BASE}/api/generate-video`, {
            ...params,
            userId,
        });

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.message,
        };
    }
}

/**
 * Obtener estado de un video
 */
export async function getVideoStatus(jobId) {
    try {
        const response = await axios.get(`${API_BASE}/api/video-status/${jobId}`);
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.message,
        };
    }
}

/**
 * Obtener todos los videos del usuario (desde Supabase)
 */
export async function getUserVideos(supabase, userId) {
    try {
        const { data, error } = await supabase
            .from('video_jobs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
