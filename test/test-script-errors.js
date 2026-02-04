/**
 * test-error-handling.js - Pruebas de manejo de errores del generador de guiones
 */

require('dotenv').config();
const { generateVideoScript } = require('../src/scriptGenerator');

async function testErrorHandling() {
    console.log('🧪 PRUEBAS DE MANEJO DE ERRORES - GENERADOR DE GUIONES\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Test 1: Producto sin título
    console.log('📦 TEST 1: Producto sin título');
    console.log('───────────────────────────────────────────────────────');
    const test1 = await generateVideoScript({
        price: 945,
        description: "Descripción de prueba"
    });
    console.log('Resultado:', test1.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test1.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 2: Producto sin precio
    console.log('📦 TEST 2: Producto sin precio');
    console.log('───────────────────────────────────────────────────────');
    const test2 = await generateVideoScript({
        title: "Producto de prueba",
        description: "Descripción de prueba"
    });
    console.log('Resultado:', test2.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test2.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 3: Producto sin descripción
    console.log('📦 TEST 3: Producto sin descripción');
    console.log('───────────────────────────────────────────────────────');
    const test3 = await generateVideoScript({
        title: "Producto de prueba",
        price: 945
    });
    console.log('Resultado:', test3.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test3.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 4: Precio no numérico
    console.log('📦 TEST 4: Precio no numérico');
    console.log('───────────────────────────────────────────────────────');
    const test4 = await generateVideoScript({
        title: "Producto de prueba",
        price: "945",
        description: "Descripción de prueba"
    });
    console.log('Resultado:', test4.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test4.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 5: Producto null
    console.log('📦 TEST 5: Producto null');
    console.log('───────────────────────────────────────────────────────');
    const test5 = await generateVideoScript(null);
    console.log('Resultado:', test5.success ? '❌ FALLO' : '✅ ÉXITO');
    console.log('Error:', test5.error);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // Resumen
    const allTests = [test1, test2, test3, test4, test5];
    const passed = allTests.filter(t => !t.success).length;

    console.log('📊 RESUMEN DE PRUEBAS DE ERRORES:');
    console.log(`Total: ${allTests.length}`);
    console.log(`Pasadas: ${passed}/${allTests.length}`);
    console.log(`Estado: ${passed === allTests.length ? '✅ TODAS PASARON' : '❌ ALGUNAS FALLARON'}`);

    process.exit(passed === allTests.length ? 0 : 1);
}

testErrorHandling();
