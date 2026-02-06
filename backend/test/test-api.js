/**
 * Test de endpoints de la API
 */
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
    console.log('🧪 TEST: API Endpoints\n');
    console.log('═'.repeat(60));

    try {
        // Test 1: Health check
        console.log('\n📌 TEST 1: Health Check');
        const health = await axios.get(`${API_BASE}/health`);
        console.log('✅ API funcionando:', health.data.message);

        // Test 2: Stats
        console.log('\n📌 TEST 2: Estadísticas');
        const stats = await axios.get(`${API_BASE}/stats`);
        console.log('✅ Stats obtenidas:', stats.data.stats);

        // Test 3: Generar video
        console.log('\n📌 TEST 3: Generar Video');
        const productUrl = 'https://www.amazon.com.mx/dp/B0DKXXWXN4';

        const generateResponse = await axios.post(`${API_BASE}/generate-video`, {
            productUrl,
        });

        console.log('✅ Job creado:', generateResponse.data.jobId);
        const jobId = generateResponse.data.jobId;

        // Test 4: Obtener estado
        console.log('\n📌 TEST 4: Estado del Job');

        // Esperar un poco y consultar estado
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await axios.get(`${API_BASE}/video-status/${jobId}`);
        console.log('✅ Estado actual:', statusResponse.data.status);
        console.log('   Progreso:', statusResponse.data.progress + '%');

        console.log('\n' + '═'.repeat(60));
        console.log('🎉 TODOS LOS TESTS PASARON');
        console.log('\n💡 TIP: Usa el jobId para monitorear:');
        console.log(`   GET ${API_BASE}/video-status/${jobId}`);

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.response?.data || error.message);
    }
}

testAPI();
