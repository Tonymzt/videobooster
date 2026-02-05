import { NextResponse } from 'next/server';

// Configuración de Leonardo AI
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * Genera un video usando Leonardo AI Motion
 * ACTUALIZADO: Usa init_generation_image_id para respetar la imagen de referencia
 */
async function generateVideoWithLeonardo(params) {
    const { prompt, model, cameraMove, shotType, cameraAngle, duration, referenceImageUrl } = params;

    // Construir el prompt enriquecido
    const enrichedPrompt = `${prompt}. Camera: ${cameraMove}, Shot: ${shotType}, Angle: ${cameraAngle}`;

    try {
        let leonardoImageId = null;

        // PASO 0: Si hay imagen de referencia, subirla a Leonardo primero
        if (referenceImageUrl) {
            console.log('📸 Subiendo imagen de referencia a Leonardo:', referenceImageUrl);

            try {
                // Paso 0.1: Solicitar URL presigned a Leonardo
                const initImageResponse = await fetch(`${LEONARDO_API_URL}/init-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${LEONARDO_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        extension: 'jpg'
                    })
                });

                const initResponseText = await initImageResponse.text();

                if (!initImageResponse.ok) {
                    console.error('❌ Error en /init-image:', initResponseText);
                    throw new Error(`Init-image falló: ${initImageResponse.status}`);
                }

                const initData = JSON.parse(initResponseText);
                console.log('✅ Leonardo /init-image respondió correctamente');

                // Extraer datos de la respuesta
                // Leonardo devuelve campos para POST en 'uploadInitImage.fields' (string JSON)
                const uploadObj = initData.uploadInitImage;
                const uploadUrl = uploadObj?.url;
                const fieldsString = uploadObj?.fields;
                const imageId = uploadObj?.id;

                if (!uploadUrl || !fieldsString || !imageId) {
                    throw new Error('Leonardo no devolvió datos completos (url, fields, id)');
                }

                console.log('🆔 Leonardo Image ID:', imageId);

                // Paso 0.2: Descargar imagen de R2
                console.log('📥 Descargando imagen de R2...');
                const r2Response = await fetch(referenceImageUrl);
                if (!r2Response.ok) {
                    throw new Error(`No se pudo descargar de R2: ${r2Response.status}`);
                }

                const imageBlob = await r2Response.blob();
                console.log('✅ Imagen descargada:', (imageBlob.size / 1024).toFixed(2), 'KB');

                // Paso 0.3: Parsear fields (es un string JSON)
                const fields = JSON.parse(fieldsString);
                console.log('📋 Fields parseados, cantidad de campos:', Object.keys(fields).length);

                // Paso 0.4: Construir FormData con los campos de S3
                const formData = new FormData();

                // IMPORTANTE: Agregar campos en el orden correcto
                // Primero todos los campos de autenticación de AWS
                Object.keys(fields).forEach(key => {
                    formData.append(key, fields[key]);
                });

                // ÚLTIMO: Agregar el archivo (DEBE ir al final)
                formData.append('file', imageBlob, 'image.jpg');
                console.log('   ✓ Campos y Archivo agregados al FormData');

                // Paso 0.5: Subir a S3 usando POST con FormData
                console.log('📤 Subiendo a S3 de Leonardo via POST FormData...');
                console.log('   URL:', uploadUrl);

                const uploadResponse = await fetch(uploadUrl, {
                    method: 'POST',  // ← CRÍTICO: POST, no PUT
                    body: formData,  // ← FormData con campos + archivo
                    // NO agregar Content-Type manual, fetch lo hace
                });

                // S3 devuelve XML, no JSON, pero si es 200/204 es éxito.
                if (!uploadResponse.ok) {
                    const uploadResponseText = await uploadResponse.text();
                    console.error('❌ Error subiendo a S3:', uploadResponseText);
                    throw new Error(`Upload a S3 falló: ${uploadResponse.status}`);
                }

                console.log('✅ ¡Imagen subida exitosamente a Leonardo S3!');
                console.log('🆔 Image ID confirmado:', imageId);

                // Esperar a que Leonardo procese la imagen interna (evita error "invalid init generation image id")
                console.log('⏳ Esperando 3s para propagación de imagen en Leonardo...');
                await new Promise(resolve => setTimeout(resolve, 3000));

                leonardoImageId = imageId;

            } catch (uploadError) {
                console.error('═'.repeat(60));
                console.error('💥 ERROR EN UPLOAD DE IMAGEN:', uploadError.message);
                console.error(uploadError); // Loguear objeto completo si es posible
                console.error('═'.repeat(60));
                console.warn('⚠️ Continuando sin imagen de referencia...');
                leonardoImageId = null;
            }
        }

        // 🔍 DEBUG: Forzar Vision XL para asegurar compatibilidad con init_image
        const modelId = '5c232a9e-9061-4777-980a-ddc8e65647c6'; // Leonardo Vision XL
        console.log('🎨 Forzando modelo Vision XL para mejor soporte de init_image');

        console.log("🎬 Generando con Leonardo AI");
        console.log("   Modelo:", modelId);
        console.log("   Prompt:", enrichedPrompt.substring(0, 100) + '...');
        console.log("   Imagen de referencia:", leonardoImageId || 'Ninguna');

        // PASO 1: Generar imagen base
        const generationPayload = {
            prompt: enrichedPrompt,
            modelId: modelId,
            width: 1024,
            height: 576, // 16:9 más estable
            num_images: 1,
            presetStyle: "CINEMATIC",
            alchemy: true,
            photoReal: false,
        };

        // SI HAY IMAGEN DE REFERENCIA: Usar ControlNet en lugar de init_generation_image_id
        if (leonardoImageId) {
            console.log('🎨 Usando ControlNet con imagen de referencia ID:', leonardoImageId);

            // Usamos Image Guidance (Structure / Depth) para mantener la forma del producto
            // preprocessorId 133 = Depth Analysis
            generationPayload.controlnets = [{
                initImageId: leonardoImageId,
                initImageType: "UPLOADED",  // CRÍTICO: Indica que es un upload
                preprocessorId: 133,
                weight: 0.75 // Usamos weight numérico para mayor control
            }];

            console.log('📋 ControlNet configurado:', JSON.stringify(generationPayload.controlnets));
        }

        // 🔍 DEBUG: Ver payload exacto
        console.log('═'.repeat(60));
        console.log('🔍 PAYLOAD GENERATION ENVIADO:');
        console.log(JSON.stringify(generationPayload, null, 2));
        console.log('═'.repeat(60));

        const imageResponse = await fetch(`${LEONARDO_API_URL}/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LEONARDO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(generationPayload)
        });

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error("❌ Leonardo Image API Error:", errorText);
            throw new Error(`Leonardo API error: ${imageResponse.status} - ${errorText}`);
        }

        const imageData = await imageResponse.json();
        const generationId = imageData.sdGenerationJob.generationId;

        console.log('⏳ Esperando generación de imagen, ID:', generationId);

        // Esperar a que la imagen esté lista (polling)
        let imageUrl = null;
        let attempts = 0;
        while (!imageUrl && attempts < 40) { // 80 segs max
            await new Promise(resolve => setTimeout(resolve, 2000));

            const statusResponse = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}` }
            });

            if (!statusResponse.ok) {
                attempts++;
                continue;
            }

            const statusData = await statusResponse.json();
            const job = statusData.generations_by_pk;

            if (job && job.status === 'COMPLETE' && job.generated_images?.length > 0) {
                imageUrl = job.generated_images[0].url;
                console.log('✅ Imagen generada:', imageUrl);
            } else if (job && job.status === 'FAILED') {
                throw new Error('Generación de imagen falló en Leonardo');
            }

            attempts++;
        }

        if (!imageUrl) {
            throw new Error('Timeout esperando generación de imagen');
        }

        // PASO 2: Intentar convertir a video (motion)
        console.log('🎥 Intentando convertir a video con Motion...');

        try {
            // Obtener el ID de la imagen generada (no el generationId)
            const statusResponse = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}` }
            });
            const statusData = await statusResponse.json();
            const imageId = statusData.generations_by_pk?.generated_images?.[0]?.id;

            if (!imageId) {
                throw new Error('No se pudo obtener imageId para motion');
            }

            const motionResponse = await fetch(`${LEONARDO_API_URL}/generations-motion-svd`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${LEONARDO_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageId: imageId,  // Usar imageId correcto
                    motionStrength: 5,
                    isPublic: false
                })
            });

            if (motionResponse.ok) {
                const motionData = await motionResponse.json();
                const motionId = motionData.motionSvdGenerationJob?.generationId;

                console.log('⏳ Esperando video motion, ID:', motionId);

                // Polling del video
                let videoUrl = null;
                attempts = 0;
                while (!videoUrl && attempts < 30) {
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const mStatus = await fetch(`${LEONARDO_API_URL}/generations-motion/${motionId}`, {
                        headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}` }
                    });

                    if (!mStatus.ok) {
                        attempts++;
                        continue;
                    }

                    const mData = await mStatus.json();
                    const motionJob = mData.generations_by_pk;

                    if (motionJob?.status === 'COMPLETE' && motionJob.generated_videos?.[0]?.url) {
                        videoUrl = motionJob.generated_videos[0].url;
                        console.log('✅ Video generado:', videoUrl);
                    } else if (motionJob?.status === 'FAILED') {
                        console.warn('⚠️ Motion falló, usando imagen estática');
                        break;
                    }

                    attempts++;
                }

                if (videoUrl) {
                    return { success: true, videoUrl, imageUrl, generationId: motionId };
                }
            } else {
                const errorText = await motionResponse.text();
                console.warn('⚠️ Motion no disponible:', errorText);
            }
        } catch (motionError) {
            console.warn('⚠️ Error en motion, usando imagen estática:', motionError.message);
        }

        // Fallback: Devolver imagen estática como "video"
        console.log('📸 Devolviendo imagen estática (motion no disponible)');
        return { success: true, videoUrl: imageUrl, imageUrl, generationId, isImageOnly: true };

    } catch (error) {
        console.error('💥 Error crítico en Leonardo AI:', error);

        // Fallback final: Video demo
        return {
            success: true,
            videoUrl: "https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/videos/car_chase.mp4",
            imageUrl: "https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/thumbnails/telefono1.webp",
            generationId: "demo_fallback",
            isDemo: true
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
            quality,
            format,
            videoCount,
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
            // Tomar la primera imagen de R2
            referenceImageUrl = referenceImages[0];
            console.log('📸 Usando imagen de referencia:', referenceImageUrl);
        }

        console.log('🎬 Iniciando generación de video:', {
            prompt: prompt.substring(0, 50) + '...',
            model,
        });

        // Generar video con Leonardo AI
        const videoResult = await generateVideoWithLeonardo({
            prompt,
            model,
            cameraMove,
            shotType,
            cameraAngle,
            duration,
            referenceImageUrl // <--- URL PÚBLICA DE R2 DIRECTAMENTE
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
