/**
 * Webhook Endpoint: Fal.ai Completion Handler
 * Arquitectura: Streaming directo R2 + Supabase Realtime
 * Infraestructura: Google Cloud Run (2GiB limit)
 * 
 * Flow:
 * 1. Validate signature
 * 2. Stream video from Fal → R2 (no buffering)
 * 3. Update Supabase (triggers Realtime)
 * 4. Return 200 (acknowledge webhook)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';
import { Readable } from 'stream';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Inicialización LAZY de clientes para evitar fallos en Build Time si faltan envs
// (Aunque en este punto ya deberíamos tener todo, mantenemos la robustez)

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Usamos SERVICE_ROLE_KEY estándar de Supabase
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) throw new Error('Missing Supabase Credentials');
    return createClient(url, key);
}

function getR2Client() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        // Fallback para build time
        if (process.env.NODE_ENV === 'production') console.warn('⚠️ Missing R2 Credentials');
        return null;
    }

    return new S3Client({
        region: process.env.S3_REGION || 'us-east-1', // Crucial para firmas
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        forcePathStyle: process.env.FORCE_PATH_STYLE === 'true',
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILIDADES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Valida la firma del webhook de Fal.ai
 */
function validateFalSignature(payload, signature) {
    if (!signature || !process.env.FAL_WEBHOOK_SECRET) {
        if (process.env.NODE_ENV === 'production' && process.env.FAL_WEBHOOK_SECRET) {
            console.warn('⚠️ Signature missing but secret is set');
            return false;
        }
        console.warn('⚠️ Validación de firma desactivada (dev mode o falta secret)');
        return true;
    }

    try {
        const hmac = crypto.createHmac('sha256', process.env.FAL_WEBHOOK_SECRET);
        const digest = hmac.update(JSON.stringify(payload)).digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        );
    } catch (error) {
        console.error('❌ Error validando firma:', error);
        return false;
    }
}

/**
 * Stream de video desde Fal → R2 sin buffering completo
 */
async function streamVideoToR2(videoUrl, r2Key, tenantId) {
    const r2Client = getR2Client();
    if (!r2Client) throw new Error('R2 Client not initialized');

    console.log('🌊 Iniciando streaming de video...');
    console.log('   Source:', videoUrl);
    console.log('   Destination:', r2Key);

    // Fetch del video con stream
    const response = await fetch(videoUrl);

    if (!response.ok) {
        throw new Error(`Fal.ai video fetch failed: ${response.status}`);
    }

    if (!response.body) {
        throw new Error('No response body from Fal.ai');
    }

    // Obtener content-length para logging
    const contentLength = response.headers.get('content-length');
    const sizeMB = contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(2) : 'unknown';
    console.log(`📦 Video size: ${sizeMB} MB`);

    // Convertir Web ReadableStream a Node.js Readable
    // @ts-ignore
    const nodeStream = Readable.fromWeb(response.body);

    // Upload multipart a R2 con streaming
    const upload = new Upload({
        client: r2Client,
        params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: r2Key,
            Body: nodeStream,
            ContentType: 'video/mp4',
            CacheControl: 'public, max-age=31536000', // 1 año
            Metadata: {
                tenant: tenantId || 'default',
                source: 'fal-ai',
                uploaded: new Date().toISOString(),
            },
        },
        // Configuración para Cloud Run (2GiB memory)
        queueSize: 4, // Uploads paralelos
        partSize: 5 * 1024 * 1024, // 5MB por chunk
    });

    // Progress tracking
    upload.on('httpUploadProgress', (progress) => {
        const percent = progress.loaded && progress.total
            ? ((progress.loaded / progress.total) * 100).toFixed(1)
            : '?';
        // Reducir ruido en logs (solo cada 20% aprox o debug)
        // console.log(`   📊 Upload progress: ${percent}%`);
    });

    await upload.done();

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${r2Key}`;
    console.log('✅ Video subido exitosamente a R2');
    console.log('   Public URL:', publicUrl);

    return publicUrl;
}

/**
 * Actualiza Supabase y dispara evento Realtime
 */
async function updateGenerationStatus(requestId, updates) {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('video_generations')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('generation_id', requestId) // OJO: Usamos generation_id como clave primaria usualmente
        // Si tu tabla usa 'fal_request_id', ajusta aquí. Asumiré generation_id por consistencia anterior.
        .select()
        .single();

    if (error) {
        // Intento fallback: buscar por generation_id si requestId es el ID
        console.error('❌ Error actualizando Supabase:', error);
        throw error;
    }

    console.log('✅ Supabase actualizado (Realtime disparado)');
    console.log('   Generation ID:', data?.generation_id);

    return data;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLER PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request) {
    const startTime = Date.now();

    try {
        console.log('═'.repeat(70));
        console.log('🎬 FAL.AI WEBHOOK RECIBIDO');
        console.log('   Timestamp:', new Date().toISOString());
        console.log('═'.repeat(70));

        // ────────────────────────────────────────────────────────────
        // 1. PARSEAR Y VALIDAR
        // ────────────────────────────────────────────────────────────

        // Configurar clients
        try {
            getSupabase();
            if (!getR2Client()) console.warn('⚠️ R2 Client not ready');
        } catch (e) {
            console.error('❌ Server Config Error:', e);
            return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 });
        }

        const payload = await request.json();
        const signature = request.headers.get('x-fal-signature');

        // console.log('📦 Payload:', JSON.stringify(payload).substring(0, 200) + '...');

        if (!validateFalSignature(payload, signature)) {
            console.error('❌ FIRMA INVÁLIDA - Posible ataque');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const { request_id, status, error: falError } = payload;
        // Fal a veces manda payload.payload con el output real
        const output = payload.payload || payload.output; // Ajuste de robustez

        if (!request_id) {
            console.error('❌ No request_id en payload');
            return NextResponse.json(
                { error: 'Missing request_id' },
                { status: 400 }
            );
        }

        console.log('✅ Validación exitosa');
        console.log('   Request ID:', request_id);
        console.log('   Status:', status);

        // ────────────────────────────────────────────────────────────
        // 2. BUSCAR GENERACIÓN EN SUPABASE
        // ────────────────────────────────────────────────────────────

        const supabase = getSupabase();
        const { data: generation, error: fetchError } = await supabase
            .from('video_generations')
            .select('*')
            .eq('generation_id', request_id) // Asumimos generation_id = request_id
            .single();

        if (fetchError || !generation) {
            console.error('❌ Generación no encontrada:', request_id);
            return NextResponse.json(
                { error: 'Generation not found', request_id },
                { status: 404 }
            );
        }

        console.log('✅ Generación encontrada en DB');

        // ────────────────────────────────────────────────────────────
        // 3. MANEJO DE ESTADOS
        // ────────────────────────────────────────────────────────────

        if (status === 'FAILED' || status === 'ERROR') {
            console.error('❌ Generación FALLIDA en Fal.ai');
            console.error('   Error:', falError || 'Unknown error');

            await updateGenerationStatus(request_id, {
                status: 'FAILED', // Usamos mayúsculas por convención anterior
                error_message: falError || 'Fal.ai generation failed',
            });

            return NextResponse.json({ received: true });
        }

        if (status !== 'COMPLETED') {
            console.log(`⏳ Estado intermedio: ${status}`);
            return NextResponse.json({ received: true });
        }

        // ────────────────────────────────────────────────────────────
        // 4. PROCESAR VIDEO (STREAMING)
        // ────────────────────────────────────────────────────────────

        console.log('🎥 Status: COMPLETED - Procesando video...');

        const videoUrl = output?.video?.url || output?.file?.url;
        if (!videoUrl) {
            console.error('❌ No video URL in completed output', JSON.stringify(output));
            throw new Error('No video URL found');
        }

        console.log('📹 Video URL de Fal.ai:', videoUrl);

        // Path en R2: videos/{tenant}/{generation_id}.mp4
        const tenantId = generation.tenant_id || 'default';
        const r2Key = `videos/${tenantId}/${request_id}.mp4`;

        // Streaming directo Fal → R2 (sin buffering completo)
        const publicVideoUrl = await streamVideoToR2(
            videoUrl,
            r2Key,
            tenantId
        );

        // ────────────────────────────────────────────────────────────
        // 5. ACTUALIZAR SUPABASE (Dispara Realtime)
        // ────────────────────────────────────────────────────────────

        await updateGenerationStatus(request_id, {
            status: 'COMPLETED',
            video_url: publicVideoUrl,
            // completed_at: new Date().toISOString(), // Si la columna existe
        });

        // ────────────────────────────────────────────────────────────
        // 6. LOGGING FINAL
        // ────────────────────────────────────────────────────────────

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('═'.repeat(70));
        console.log('✅ WEBHOOK PROCESADO EXITOSAMENTE');
        console.log('   Duration:', duration, 's');
        console.log('   Video:', publicVideoUrl);
        console.log('═'.repeat(70));

        return NextResponse.json({
            success: true,
            video_url: publicVideoUrl,
        });

    } catch (error) {
        console.error('💥 ERROR CRÍTICO EN WEBHOOK:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH CHECK (GET)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'fal-webhook',
        version: '2.0',
        timestamp: new Date().toISOString(),
    });
}
