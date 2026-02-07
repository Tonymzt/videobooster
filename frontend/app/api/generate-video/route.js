import { NextResponse } from 'next/server';

// Configuración de Fal.ai
const FAL_KEY = process.env.FAL_KEY;

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * Genera un video usando Fal.ai (Flux para imagen + Minimax para video)
 */
async function generateVideoPipeline(params) {
    const { prompt, cameraMove, shotType, cameraAngle, referenceImageUrl } = params;

    // Construir el prompt enriquecido evitanto duplicados si viene del Brain
    const enrichedPrompt = prompt.includes(cameraMove)
        ? prompt
        : `${prompt}. Camera: ${cameraMove}, Shot: ${shotType}, Angle: ${cameraAngle}`;

    try {
        const fal = (await import('@fal-ai/serverless-client')).default;
        let imageUrl = referenceImageUrl;

        // PASO 1: Si no hay imagen de referencia, generamos una con Fal (Flux)
        if (!imageUrl) {
            console.log('🎨 Generando imagen base con Fal (Flux)...');
            const fluxResult = await fal.subscribe("fal-ai/flux/schnell", {
                input: {
                    prompt: enrichedPrompt,
                    image_size: "landscape_16_9"
                }
            });
            imageUrl = fluxResult.images[0].url;
            console.log('✅ Imagen Base Lista:', imageUrl);
        }

        // PASO 2: Generar Video (FAL.AI Minimax)
        console.log('🎬 Iniciando Fal.ai (Minimax)...');

        const appUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.NODE_ENV === 'production' ? 'https://videobooster-frontend-308931734317.us-east1.run.app' : null);

        const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
        const webhookUrl = appUrl
            ? (webhookSecret ? `${appUrl}/api/webhooks/fal?token=${webhookSecret}` : `${appUrl}/api/webhooks/fal`)
            : null;

        console.log('🔗 Usando Webhook URL:', webhookUrl ? webhookUrl.split('?')[0] + '?...' : 'null');

        const falPayload = {
            input: {
                image_url: imageUrl,
                prompt: enrichedPrompt,
            }
        };

        if (webhookUrl) {
            falPayload.webhookUrl = webhookUrl;
        }

        const { request_id } = await fal.queue.submit("fal-ai/minimax-video/image-to-video", falPayload);
        console.log('🚀 Video Job enviado a Fal:', request_id);

        // Guardar en DB
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            await supabase.from('video_jobs').insert({
                job_id: request_id,
                product_url: imageUrl,
                status: 'pending',
                progress: 10
            });
        } catch (dbErr) {
            console.warn('⚠️ No se pudo guardar en DB:', dbErr.message);
        }

        return {
            success: true,
            videoId: request_id,
            status: 'PROCESSING',
            imageUrl: imageUrl,
            message: 'Video procesándose vía Fal.ai'
        };

    } catch (error) {
        console.error('💥 Error Pipeline Fal:', error);
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

        if (!FAL_KEY) {
            return NextResponse.json(
                { error: 'FAL_KEY no configurada' },
                { status: 500 }
            );
        }

        // Preparar URL de imagen de referencia
        let referenceImageUrl = null;
        if (referenceImages && referenceImages.length > 0) {
            referenceImageUrl = referenceImages[0];
        }

        console.log('🎬 Iniciando generación de video (Fal.ai Pure):', { prompt: prompt.substring(0, 30) });

        let enhancedPrompt = prompt;
        let enhancedDubbingText = dubbingText;

        // Si usuario activó "IA Magic", usar Brain primero
        if (body.useBrain) {
            console.log('🧠 IA Magic activa, llamando al Brain...');
            try {
                // Llamamos internamente a la lógica del brain o vía fetch si es necesario
                // Para consistencia con el plan, usamos fetch a la URL base
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3001}`;
                const brainResponse = await fetch(`${appUrl}/api/brain`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        description: prompt,
                        imageUrl: referenceImageUrl,
                        cameraMovement: cameraMove || 'static',
                        shotType: shotType || 'medium',
                        angle: cameraAngle || 'eye_level',
                        model: 'minimax'
                    })
                });

                if (brainResponse.ok) {
                    const brainData = await brainResponse.json();
                    enhancedPrompt = brainData.visual_prompt;
                    enhancedDubbingText = brainData.narration_script;
                    console.log('🧠 Brain enhanced prompt:', enhancedPrompt);
                } else {
                    console.warn('⚠️ Brain API falló, usando prompt original');
                }
            } catch (brainErr) {
                console.error('❌ Error llamando al Brain:', brainErr);
            }
        }

        // Generar video con el nuevo pipeline de Fal
        const videoResult = await generateVideoPipeline({
            prompt: enhancedPrompt,
            cameraMove,
            shotType,
            cameraAngle,
            duration,
            referenceImageUrl
        });

        if (!videoResult.success) {
            throw new Error(videoResult.error);
        }

        // Generar audio si está habilitado
        let audioBase64 = null;
        if (audioEnabled && enhancedDubbingText) {
            audioBase64 = await generateAudioWithElevenLabs(enhancedDubbingText);
        }

        return NextResponse.json({
            success: true,
            jobId: videoResult.videoId,
            videoUrl: null, // Viene por webhook
            imageUrl: videoResult.imageUrl,
            audioBase64,
            generationId: videoResult.videoId,
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
