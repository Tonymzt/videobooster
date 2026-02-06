require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testVanguardPipeline() {
    console.log('🧪 TEST: Pipeline Vanguardia 3.1\n');
    console.log('═'.repeat(60));
    console.log('Este test generará un video usando:');
    console.log('  ✅ Remove.bg - Fondos transparentes');
    console.log('  ✅ Leonardo.ai - Fondo generado por IA');
    console.log('  ✅ HeyGen - Avatar intro');
    console.log('  ✅ OpenAI - Script');
    console.log('  ✅ ElevenLabs - Voz');
    console.log('═'.repeat(60) + '\n');

    const testUrl = 'https://www.amazon.com.mx/dp/B0DKXXWXN4';

    console.log(`📦 Producto de prueba: ${testUrl}\n`);
    console.log('⏳ Generando video... (esto tomará 2-3 minutos)\n');

    try {
        // Crear job
        const response = await axios.post(`${API_URL}/generate-video`, {
            productUrl: testUrl,
        });

        if (response.data.success) {
            const jobId = response.data.jobId;
            console.log(`✅ Job creado: ${jobId}`);
            console.log(`📊 Monitorear en: ${API_URL}/video-status/${jobId}`);
            console.log('\n💡 Espera 2-3 minutos y verifica los logs del backend');
            console.log('   Deberías ver el log de éxito con todas las APIs\n');

            console.log('🔍 Monitoreando progreso...\n');

            // Monitorear progreso cada 5 segundos
            let completed = false;
            let attempts = 0;
            const maxAttempts = 100; // Aumentamos a ~8 min por si acaso

            while (!completed && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;

                const statusResponse = await axios.get(`${API_URL}/video-status/${jobId}`);
                const status = statusResponse.data;

                console.log(`[${new Date().toLocaleTimeString()}] Estado: ${status.status} | Progreso: ${status.progress}%`);

                if (status.status === 'completed') {
                    completed = true;
                    console.log('\n' + '═'.repeat(60));
                    console.log('🎉 VIDEO COMPLETADO');
                    console.log('═'.repeat(60));
                    console.log(`🎬 URL: ${status.videoUrl}`);
                    console.log(`⏱️ Tiempo total: ${attempts * 5} segundos`);
                    console.log('═'.repeat(60) + '\n');
                } else if (status.status === 'failed') {
                    console.error('\n❌ El job falló:', status.error);
                    break;
                }
            }

            if (!completed && attempts >= maxAttempts) {
                console.log('\n⚠️ Timeout: El video aún se está procesando');
                console.log('   Verifica manualmente el estado del job');
            }

        } else {
            console.error(`❌ Error: ${response.data.error}`);
        }
    } catch (error) {
        console.error('\n💥 Error en el test:', error.message);
        if (error.response) {
            console.error('   Respuesta del servidor:', error.response.data);
        }
    }
}

testVanguardPipeline();
