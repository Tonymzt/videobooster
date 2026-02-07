const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: './frontend/.env.local' });

async function verify() {
    console.log('🔍 INICIANDO VALIDACIÓN DE INFRAESTRUCTURA...\n');

    // 1. SUPABASE CHECK
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 [1/2] Revisando Supabase (video_jobs)...');
    const { data: jobs, error: jobError } = await supabase
        .from('video_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (jobError) {
        console.error('❌ Error en Supabase:', jobError.message);
    } else {
        console.log(`✅ Se encontraron ${jobs.length} registros en video_jobs.`);
        jobs.forEach(j => {
            console.log(`   - ID: ${j.job_id} | Status: ${j.status} | Video: ${j.video_url ? 'SI' : 'NO'}`);
        });
    }

    // 2. CLOUDFLARE R2 CHECK
    console.log('\n📦 [2/2] Revisando Cloudflare R2 (videobooster-assets)...');
    const r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME || 'videobooster-assets',
            Prefix: 'videos/',
        });

        const response = await r2Client.send(command);
        const files = response.Contents || [];

        console.log(`✅ Se encontraron ${files.length} archivos en la carpeta /videos de R2.`);
        files.slice(0, 5).forEach(f => {
            console.log(`   - Carpeta: ${f.Key} | Tamaño: ${(f.Size / 1024 / 1024).toFixed(2)} MB | Fecha: ${f.LastModified}`);
        });
        if (files.length > 5) console.log(`   ... y ${files.length - 5} archivos más.`);

    } catch (err) {
        console.error('❌ Error en R2:', err.message);
    }

    console.log('\n🏁 FIN DE VALIDACIÓN.');
}

verify();
