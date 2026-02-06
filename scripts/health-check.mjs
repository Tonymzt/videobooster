import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: './frontend/.env.local' });

const keys = {
    openai: process.env.OPENAI_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
    fal: process.env.FAL_KEY,
    removebg: process.env.REMOVE_BG_API_KEY,
    heygen: process.env.HEYGEN_API_KEY,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY
};

async function testAPIs() {
    console.log('🚀 Iniciando Health Check de APIs...\n');

    // 1. OpenAI
    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${keys.openai}` }
        });
        console.log(`🧠 OpenAI (GPT-4o): ${res.status === 200 ? '✅ 200 OK' : '❌ ' + res.status}`);
    } catch (e) { console.log(`🧠 OpenAI: 💥 ERROR - ${e.message}`); }

    // 2. ElevenLabs
    try {
        const res = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': keys.elevenlabs }
        });
        console.log(`🗣️ ElevenLabs: ${res.status === 200 ? '✅ 200 OK' : '❌ ' + res.status}`);
    } catch (e) { console.log(`🗣️ ElevenLabs: 💥 ERROR - ${e.message}`); }

    // 3. Fal.ai
    try {
        // Usamos un endpoint de información simple si hay, o probamos el key
        const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
            method: 'HEAD',
            headers: { 'Authorization': `Key ${keys.fal}` }
        });
        // Si da 405 (Method Not Allowed) es que llegamos al endpoint pero pedimos HEAD donde solo hay POST, 
        // pero valida que la comunicación existe. Si da 401 es la key.
        console.log(`🎨 Fal.ai: ${res.status < 500 && res.status !== 401 ? '✅ Conectado' : '❌ Error ' + res.status}`);
    } catch (e) { console.log(`🎨 Fal.ai: 💥 ERROR - ${e.message}`); }

    // 4. Remove.bg
    try {
        const res = await fetch('https://api.remove.bg/v1.0/account', {
            headers: { 'X-Api-Key': keys.removebg }
        });
        console.log(`✂️ Remove.bg: ${res.status === 200 ? '✅ 200 OK' : '❌ ' + res.status}`);
    } catch (e) { console.log(`✂️ Remove.bg: 💥 ERROR - ${e.message}`); }

    // 5. HeyGen
    try {
        const res = await fetch('https://api.heygen.com/v1/avatar.list', {
            headers: { 'X-Api-Key': keys.heygen }
        });
        console.log(`🎭 HeyGen: ${res.status === 200 ? '✅ 200 OK' : '❌ ' + res.status}`);
    } catch (e) { console.log(`🎭 HeyGen: 💥 ERROR - ${e.message}`); }

    // 6. Supabase
    try {
        const res = await fetch(`${keys.supabase_url}/rest/v1/?apikey=${keys.supabase_key}`, {
            method: 'GET'
        });
        console.log(`⚡ Supabase: ${res.status === 200 ? '✅ 200 OK' : '❌ ' + res.status}`);
    } catch (e) { console.log(`⚡ Supabase: 💥 ERROR - ${e.message}`); }

    console.log('\n🏁 Verificación completada.');
}

testAPIs();
