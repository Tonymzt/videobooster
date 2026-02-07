import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // En un entorno real, usaría auth.getUser()
        // Para este test de humo y rapidez, buscaremos el último del usuario contacto.iaproactiva@gmail.com
        const { data: user } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', 'contacto.iaproactiva@gmail.com')
            .single();

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const { data: job, error } = await supabase
            .from('video_jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !job) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({
            success: true,
            data: {
                jobId: job.job_id,
                status: job.status.toLowerCase(),
                videoUrl: job.video_url,
                imageUrl: job.product_url,
                progress: 100
            }
        });

    } catch (error) {
        console.error('❌ Error en video-status/latest:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
