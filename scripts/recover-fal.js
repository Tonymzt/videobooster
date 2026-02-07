const fal = require('@fal-ai/serverless-client');
require('dotenv').config({ path: './frontend/.env.local' });

// Configuración manual del cliente fal para node
process.env.FAL_KEY = process.env.FAL_KEY;

async function recover() {
    const requestId = '136aee91-9699-41c4-a183-46e2dc6ccb41';
    console.log(`🎬 Intentando recuperar video ID: ${requestId}`);

    try {
        const status = await fal.queue.status("fal-ai/minimax-video/image-to-video", {
            requestId: requestId
        });

        console.log('Estatus Fal:', status.status);
        if (status.status === 'COMPLETED') {
            const response = await fal.queue.response("fal-ai/minimax-video/image-to-video", {
                requestId: requestId
            });

            const videoUrl = response.video.url;
            console.log('✅ Video encontrado:', videoUrl);

            // Actualizar DB
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            const { data: user } = await supabase.from('profiles').select('id').eq('email', 'contacto.iaproactiva@gmail.com').single();

            await supabase.from('video_jobs').upsert({
                job_id: requestId,
                status: 'completed',
                video_url: videoUrl,
                user_id: user.id,
                progress: 100
            });

            console.log('🚀 DB ACTUALIZADA. Tony debería ver el video al recargar.');
        } else {
            console.log('El video aún no está listo o falló.');
        }
    } catch (err) {
        console.error('Error recuperando:', err.message);
    }
}

recover();
