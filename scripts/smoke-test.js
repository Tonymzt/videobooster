const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

async function runSmokeTest() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🚀 INICIANDO PASO 1: INSERTANDO REGISTRO DE HUMO...\n');

    // 1. Obtener User ID
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'contacto.iaproactiva@gmail.com')
        .single();

    if (userError || !users) {
        console.error('❌ No se encontró el usuario contacto.iaproactiva@gmail.com:', userError?.message);
        return;
    }
    const userId = users.id;
    console.log(`✅ User ID encontrado: ${userId}`);

    // 2. Insertar Job de prueba
    // Mapeamos las columnas según lo que el backend y mis fixes esperan:
    // job_id -> es la clave de búsqueda en el editor
    // product_url -> imagen base
    const smokeTestId = 'smoke_test_' + Date.now();

    const { data: job, error: jobError } = await supabase
        .from('video_jobs')
        .insert({
            job_id: smokeTestId,
            user_id: userId,
            status: 'completed',
            product_url: 'https://fakeimg.pl/1280x720/ff0000/ffffff?text=VideoBoosters+Test',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            progress: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (jobError) {
        console.error('❌ Error insertando registro:', jobError.message);
        console.log('Intentando insertar con menos columnas por si acaso...');

        // Fallback simplificado
        const { data: job2, error: jobError2 } = await supabase
            .from('video_jobs')
            .insert({
                job_id: smokeTestId,
                status: 'completed',
                video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            })
            .select()
            .single();

        if (jobError2) {
            console.error('❌ Error crítico:', jobError2.message);
            return;
        }
        console.log('✅ Registro creado con éxito (fallback).');
    } else {
        console.log('✅ Registro de HUMO creado con éxito.');
    }

    console.log('\n--- DATOS PARA TONY ---');
    console.log(`Job ID: ${smokeTestId}`);
    console.log(`Status: COMPLETED`);
    console.log(`URL de prueba: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`);
    console.log('\nAntigravity: PASO 1 COMPLETADO. Procede a verificar en el dashboard.');
}

runSmokeTest();
