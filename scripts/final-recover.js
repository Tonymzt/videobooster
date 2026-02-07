const axios = require('axios');
require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function recover() {
    const requestId = '136aee91-9699-41c4-a183-46e2dc6ccb41';
    const responseUrl = `https://queue.fal.run/fal-ai/minimax-video/requests/${requestId}`;

    try {
        const response = await axios.get(responseUrl, {
            headers: { 'Authorization': `Key ${process.env.FAL_KEY}` }
        });

        const videoUrl = response.data.video.url;
        console.log('✅ Video URL:', videoUrl);

        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: user } = await supabase.from('profiles').select('id').eq('email', 'contacto.iaproactiva@gmail.com').single();

        await supabase.from('video_jobs').upsert({
            job_id: requestId,
            status: 'completed',
            video_url: videoUrl,
            user_id: user.id,
            progress: 100,
            updated_at: new Date().toISOString()
        });

        console.log('🚀 DB ACTUALIZADA.');
    } catch (err) {
        console.error(err.message);
    }
}
recover();
