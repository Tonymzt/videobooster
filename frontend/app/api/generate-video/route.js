import { NextResponse } from 'next/server';

// Configuración de Leonardo AI
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * Genera un video usando Leonardo AI para imagen + Fal.ai para video
 */
async function generateVideoWithLeonardo(params) {
    const { prompt, model, cameraMove, shotType, cameraAngle, duration, referenceImageUrl } = params;

    // Construir el prompt enriquecido
    const enrichedPrompt = `${prompt}. Camera: ${cameraMove}, Shot: ${shotType}, Angle: ${cameraAngle}`;

    // Variables de estado
    let leonardoImageId = null;
    let imageUrl = null;
    let generationId = null;

    try {
        // PASO 0: Subir imagen de referencia si existe
        if (referenceImageUrl) {
            console.log('📸 Subiendo imagen de referencia a Leonardo:', referenceImageUrl);
            try {
                // Paso 0.1: Solicitar URL presigned
                const initImageResponse = await fetch(`${LEONARDO_API_URL}/init-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ extension: 'jpg' })
                });

                if (!initImageResponse.ok) throw new Error(`Init-image falló: ${initImageResponse.status}`);
                const initData = await initImageResponse.json();

                const uploadObj = initData.uploadInitImage;
                if (!uploadObj?.url || !uploadObj?.fields || !uploadObj?.id) {
                    throw new Error('Datos incompletos de Leonardo init-image');
                }

                // Paso 0.2: Descargar de R2
                const r2Response = await fetch(referenceImageUrl);
                if (!r2Response.ok) throw new Error('Falló descarga R2');
                const imageBlob = await r2Response.blob();

                // Paso 0.3-0.5: Subir a S3
                const fields = JSON.parse(uploadObj.fields);
                const formData = new FormData();
                Object.keys(fields).forEach(key => formData.append(key, fields[key]));
                formData.append('file', imageBlob, 'image.jpg');

                const uploadResponse = await fetch(uploadObj.url, { method: 'POST', body: formData });
                if (!uploadResponse.ok) throw new Error('Falló upload a S3 Leonardo');

                leonardoImageId = uploadObj.id;
                console.log('✅ Imagen subida a Leonardo ID:', leonardoImageId);

                // Esperar propagación
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (e) {
                console.warn('⚠️ Falló subida de ref image, continuando sin ella:', e.message);
            }
        }

        // PASO 1: Generar imagen base (Vision XL)
        const modelId = '5c232a9e-9061-4777-980a-ddc8e65647c6';
        const generationPayload = {
            prompt: enrichedPrompt,
            modelId: modelId,
            width: 1024,
            height: 576,
            num_images: 1,
            presetStyle: "CINEMATIC",
            alchemy: true,
            photoReal: false,
        };

        if (leonardoImageId) {
            generationPayload.controlnets = [{
                initImageId: leonardoImageId,
                initImageType: "UPLOADED",
                preprocessorId: 133,
                weight: 0.75
            }];
        }

        console.log('🎬 Generando imagen base...');
        const imageResponse = await fetch(`${LEONARDO_API_URL}/generations`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(generationPayload)
        });

        if (!imageResponse.ok) throw new Error(`Leonardo Image Gen falló: ${imageResponse.status}`);
        const imageData = await imageResponse.json();
        generationId = imageData.sdGenerationJob.generationId;

        // Polling Imagen
        let attempts = 0;
        while (!imageUrl && attempts < 40) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusRes = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}` }
            });
            if (statusRes.ok) {
                const data = await statusRes.json();
                const job = data.generations_by_pk;
                if (job?.status === 'COMPLETE' && job.generated_images?.[0]?.url) {
                    imageUrl = job.generated_images[0].url;
                } else if (job?.status === 'FAILED') {
                    throw new Error('Generación de imagen falló');
                }
            }
            attempts++;
        }

        if (!imageUrl) throw new Error('Timeout generando imagen base');
        console.log('✅ Imagen Base Lista:', imageUrl);

        // PASO 2: Generar Video (FAL.AI)
        console.log('🎬 Iniciando Fal.ai (Minimax)...');
        try {
            const fal = (await import('@fal-ai/serverless-client')).default;

            // Webhook dynamic URL
            // Ojo: process.env.NEXT_PUBLIC_APP_URL debe ser definida en Cloud Run
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
            const webhookUrl = appUrl ? `${appUrl}/api/webhooks/fal` : null;

            const falPayload = {
                input: {
                    image_url: imageUrl,
                    prompt: enrichedPrompt,
                },
                webhookUrl: webhookUrl
            };

            const { request_id } = await fal.queue.submit("fal-ai/minimax-video/image-to-video", falPayload);
            console.log('🚀 Video Job enviado a Fal:', request_id);

            // Intentar guardar en DB (si falla, no rompe el flujo, pero avisa)
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                );

                await supabase.from('video_generations').insert({
                    generation_id: request_id,
                    prompt: enrichedPrompt,
                    image_url: imageUrl,
                    status: 'PENDING',
                    provider: 'FAL_AI_MINIMAX'
                });
            } catch (dbErr) {
                console.warn('⚠️ No se pudo guardar en DB (posible falta de tabla/env):', dbErr.message);
            }

            return {
                success: true,
                videoId: request_id,
                status: 'PROCESSING',
                videoUrl: null,
                imageUrl: imageUrl,
                message: 'Video procesándose en segundo plano'
            };

        } catch (falErr) {
            console.error('Fal Error:', falErr);
            // Fallback a devolver solo la imagen
            return {
                success: true,
                videoUrl: imageUrl,
                imageUrl: imageUrl,
                isImageOnly: true,
                error: 'Fallo motor de video, devolviendo imagen estática'
            };
        }

    } catch (error) {
        console.error('💥 Error Pipeline:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Genera audio con ElevenLabs
 */
async function generateAudioWithElevenLabs(text, voiceId = 'EXAVITQu4vr4xnSDxMaL') {
    if (!text || !ELEVENLABS_API_KEY) return null;

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.statusText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        return Buffer.from(audioBuffer).toString('base64');

    } catch (error) {
        console.error('Error en ElevenLabs:', error);
        return null;
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            prompt,
            model,
            cameraMove,
            shotType,
            cameraAngle,
            audioEnabled,
            dubbingText,
            duration,
            referenceImages
        } = body;

        // Validación
        if (!prompt || prompt.trim().length < 10) {
            return NextResponse.json(
                { error: 'El prompt debe tener al menos 10 caracteres' },
                { status: 400 }
            );
        }

        if (!LEONARDO_API_KEY) {
            return NextResponse.json(
                { error: 'Leonardo API key no configurada' },
                { status: 500 }
            );
        }

        // Preparar URL de imagen de referencia
        let referenceImageUrl = null;
        if (referenceImages && referenceImages.length > 0) {
            referenceImageUrl = referenceImages[0];
        }

        console.log('🎬 Iniciando generación de video:', { prompt: prompt.substring(0, 30) });

        // Generar video 
        const videoResult = await generateVideoWithLeonardo({
            prompt,
            model,
            cameraMove,
            shotType,
            cameraAngle,
            duration,
            referenceImageUrl
        });

        // Generar audio si está habilitado
        let audioBase64 = null;
        if (audioEnabled && dubbingText) {
            audioBase64 = await generateAudioWithElevenLabs(dubbingText);
        }

        return NextResponse.json({
            success: true,
            jobId: `job_${Date.now()}`,
            videoUrl: videoResult.videoUrl,
            imageUrl: videoResult.imageUrl,
            audioBase64,
            generationId: videoResult.generationId,
            params: { prompt, model }
        });

    } catch (error) {
        console.error('❌ Error en generate-video API:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
