import fal from '@fal-ai/serverless-client';

// KEY REAL DEL USUARIO
process.env.FAL_KEY = "2b4ef553-9014-4887-9d3b-2c39e1ebc0cc:8e516d455573d0f378fae54928866cd6";

async function testGeneration() {
    console.log("🚀 Iniciando prueba en fal.ai (Modelo: ltx-video/fast-i2v)...");

    try {
        const result = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
            input: {
                image_url: "https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/uploads/1770262275207_it33b5.jpg",
                prompt: "Cinematic product showcase, slow camera rotation, studio lighting, 4k",
            },
            logs: true,
            onQueueUpdate: (update) => {
                console.log(`📡 Estado: ${update.status}`);
                if (update.logs) {
                    update.logs.forEach(log => console.log(`   [SERVER] ${log.message}`));
                }
            },
        });

        console.log("════════════════════════════════════════════════════════════");
        console.log("✅ ¡ÉXITO! Video generado:");
        console.log(result.video?.url || result);
        console.log("════════════════════════════════════════════════════════════");

    } catch (error) {
        console.error("❌ Error CRÍTICO en la prueba:", error);
        if (error.body) console.log(error.body);
    }
}

testGeneration();
