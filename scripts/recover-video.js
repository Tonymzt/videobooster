const axios = require('axios');
require('dotenv').config({ path: './frontend/.env.local' });

async function recover() {
    const requestId = '136aee91-9699-41c4-a183-46e2dc6ccb41';
    console.log(`🎬 Intentando recuperar video ID: ${requestId}`);

    try {
        const response = await axios.get(`https://queue.fal.run/fal-ai/minimax-video/image-to-video/requests/${requestId}`, {
            headers: {
                'Authorization': `Key ${process.env.FAL_KEY}`
            }
        });

        console.log('Estatus Fal:', response.data.status);
        if (response.data.status === 'COMPLETED') {
            const videoUrl = response.data.response.video.url;
            console.log('✅ Video encontrado:', videoUrl);

            // Ahora lo insertamos/actualizamos en la DB para que Tony lo vea
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

            const { data: user } = await supabase.from('profiles').select('id').eq('email', 'contacto.iaproactiva@gmail.com').single();

            const { error } = await supabase.from('video_jobs').upsert({
                job_id: requestId,
                status: 'completed',
                video_url: videoUrl, // Debería ser R2, pero para que Tony lo vea rápido usamos el de Fal
                user_id: user.id,
                progress: 100
            });

            if (error) console.error('Error insertando en DB:', error);
            else console.log('🚀 DB ACTUALIZADA. Tony debería ver el video al recargar.');
        } else {
            console.log('El video aún no está listo o falló.');
        }
    } catch (err) {
        console.error('Error recuperando de Fal:', err.response?.data || err.message);
    }
}

recover();
