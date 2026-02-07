import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request, { params }) {
    const { jobId } = await params;

    if (!jobId) {
        return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Consultamos la tabla real detected: video_jobs
        const { data: job, error } = await supabase
            .from('video_jobs')
            .select('*')
            .eq('job_id', jobId)
            .single();

        if (error || !job) {
            // Si no existe aún, devolvemos un estado inicial para evitar errores en el frontend
            return NextResponse.json({
                success: true,
                data: {
                    jobId,
                    status: 'pending',
                    progress: 10,
                    message: 'Iniciando proceso en Fal.ai...'
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                jobId: job.job_id,
                status: job.status.toLowerCase(), // 'pending', 'completed', 'failed'
                progress: job.progress || (job.status === 'completed' ? 100 : 50),
                videoUrl: job.video_url,
                imageUrl: job.product_url, // En este flujo, guardamos el Flux preview en product_url
                error: job.error_message
            }
        });

    } catch (error) {
        console.error('❌ Error en video-status API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
