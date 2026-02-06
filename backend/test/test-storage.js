/**
 * test-storage.js - Test unitario del módulo de almacenamiento R2
 */

require('dotenv').config();
const { uploadBuffer, testConnection } = require('../src/storage');

async function testR2Storage() {
    console.log('🧪 TEST: Módulo de Almacenamiento R2\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Test 1: Conexión
    console.log('1️⃣ Probando conexión a R2...');
    const isConnected = await testConnection();
    console.log(isConnected ? '✅ Conexión exitosa\n' : '❌ Fallo de conexión\n');

    if (!isConnected) {
        console.error('⚠️ Revisa tus credenciales R2 en .env');
        process.exit(1);
    }

    // Test 2: Subida de texto
    console.log('2️⃣ Probando subida de archivo de texto...');
    const textBuffer = Buffer.from('Hola desde VideoBooster MVP 🚀', 'utf-8');
    const textResult = await uploadBuffer(textBuffer, 'test-text.txt', 'text/plain');

    if (textResult.success) {
        console.log(`✅ Archivo de texto subido`);
        console.log(`📎 URL: ${textResult.url}\n`);
    } else {
        console.error(`❌ Error: ${textResult.error}\n`);
    }

    // Test 3: Subida de audio simulado
    console.log('3️⃣ Probando subida de archivo de audio (simulado)...');
    const audioBuffer = Buffer.alloc(1024 * 10); // 10KB de datos dummy
    const audioResult = await uploadBuffer(audioBuffer, null, 'audio/mpeg');

    if (audioResult.success) {
        console.log(`✅ Archivo de audio subido`);
        console.log(`📎 URL: ${audioResult.url}`);
        console.log(`📊 Tamaño: ${(audioResult.size / 1024).toFixed(2)} KB\n`);
    } else {
        console.error(`❌ Error: ${audioResult.error}\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Tests de almacenamiento completados');

    process.exit(textResult.success && audioResult.success ? 0 : 1);
}

testR2Storage().catch(error => {
    console.error('💥 Error crítico:', error);
    process.exit(1);
});
