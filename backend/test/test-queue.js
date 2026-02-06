/**
 * Test del sistema de colas
 */
require('dotenv').config();
const logger = require('../src/utils/logger');
const { videoQueue, addVideoJob } = require('../src/queue/videoQueue');

async function testQueue() {
    console.log('🧪 TEST: Sistema de Colas (BullMQ)\n');
    console.log('═'.repeat(60));

    try {
        // Test 1: Verificar conexión a Redis
        console.log('\n📌 TEST 1: Conexión a Redis');
        await videoQueue.waitUntilReady();
        console.log('✅ Redis conectado correctamente (Queue Ready)\n');

        // Test 2: Limpiar cola existente (para empezar limpio)
        console.log('📌 TEST 2: Limpiar cola existente');
        await videoQueue.obliterate({ force: true });
        console.log('✅ Cola limpiada\n');

        // Test 3: Agregar job de prueba
        console.log('📌 TEST 3: Agregar job a la cola');
        const testJobId = `test_${Date.now()}`;
        const testUrl = 'https://www.amazon.com.mx/dp/B0DKXXWXN4';

        const job = await addVideoJob(testJobId, testUrl);
        console.log(`✅ Job agregado: ${job.id}`);
        console.log(`   Datos:`, job.data);

        // Test 4: Verificar que el job está en la cola
        console.log('\n📌 TEST 4: Verificar job en cola');
        const retrievedJob = await videoQueue.getJob(testJobId);

        if (retrievedJob) {
            console.log('✅ Job encontrado en la cola');
            console.log(`   ID: ${retrievedJob.id}`);
            console.log(`   Estado: ${await retrievedJob.getState()}`);
        } else {
            throw new Error('Job no encontrado en la cola');
        }

        // Test 5: Ver estadísticas de la cola
        console.log('\n📌 TEST 5: Estadísticas de la cola');
        const counts = await videoQueue.getJobCounts();
        console.log('✅ Estadísticas:', counts);

        // Test 6: Remover job de prueba
        console.log('\n📌 TEST 6: Limpiar job de prueba');
        await retrievedJob.remove();
        console.log('✅ Job removido\n');

        console.log('═'.repeat(60));
        console.log('🎉 TODOS LOS TESTS DE COLA PASARON');
        console.log('\n⚠️  NOTA: El worker NO está procesando jobs aún');
        console.log('   Eso se probará en el siguiente checkpoint\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testQueue();
