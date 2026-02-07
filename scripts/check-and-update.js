const fal = require('@fal-ai/serverless-client');
require('dotenv').config({ path: './frontend/.env.local' });
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

async function check() {
    const requestId = '88367dbe-1bb6-4e94-a3cf-ec110f43d564';
    console.log(`🎬 Consultando Fal.ai para ID: ${requestId}`);

    try {
        const responseUrl = `https://queue.fal.run/fal-ai/minimax-video/requests/${requestId}`;
        const response = await axios.get(responseUrl, {
            headers: { 'Authorization': `Key ${process.env.FAL_KEY}` }
        });

        console.log('Estatus Fal:', response.data.status || 'READY');

        if (response.data.video && response.data.video.url) {
            const videoUrl = response.data.video.url;
            console.log('✅ Video URL encontrado:', videoUrl);

            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            const { data: user } = await supabase.from('profiles').select('id').eq('email', 'contacto.iaproactiva@gmail.com').single();

            const { data, error } = await supabase.from('video_jobs').upsert({
                job_id: requestId,
                status: 'completed',
                video_url: videoUrl,
                user_id: user.id,
                progress: 100,
                updated_at: new Date().toISOString()
            }, { onConflict: 'job_id' }).select();

            if (error) console.error('Error DB:', error);
            else console.log('🚀 DB ACTUALIZADA MANUALMENTE. Tony debería verlo al recargar.');
        } else {
            console.log('El video parece estar en cola o procesándose aún.');
            console.log('Data:', JSON.stringify(response.data, null, 2));
        }
    } catch (err) {
        console.error('Error consultando Fal:', err.response?.status, err.message);
    }
}
check();
