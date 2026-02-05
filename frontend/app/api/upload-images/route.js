/**
 * API Route: Upload de imágenes a Cloudflare R2
 * Las imágenes quedan accesibles públicamente para Leonardo.ai
 */
import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2-client';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('images');

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No se recibieron imágenes' },
                { status: 400 }
            );
        }

        if (files.length > 3) {
            return NextResponse.json(
                { success: false, error: 'Máximo 3 imágenes permitidas' },
                { status: 400 }
            );
        }

        const uploadedImages = [];

        for (const file of files) {
            // Validar tipo
            if (!file.type.startsWith('image/')) {
                return NextResponse.json(
                    { success: false, error: 'Solo se permiten imágenes' },
                    { status: 400 }
                );
            }

            // Validar tamaño (10MB)
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { success: false, error: 'Cada imagen debe ser menor a 10MB' },
                    { status: 400 }
                );
            }

            // Convertir a buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Generar nombre único con timestamp y carpeta 'uploads'
            const ext = file.name.split('.').pop();
            const uniqueName = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            // Subir a R2 (accesible públicamente para Leonardo)
            const uploadResult = await uploadToR2(buffer, uniqueName, file.type);

            if (!uploadResult.success) {
                return NextResponse.json(
                    { success: false, error: `Error subiendo ${file.name}: ${uploadResult.error}` },
                    { status: 500 }
                );
            }

            uploadedImages.push({
                originalName: file.name,
                url: uploadResult.url,  // URL pública accesible
                size: file.size,
                type: file.type,
            });

            console.log('✅ Imagen subida a R2:', uploadResult.url, `(${(file.size / 1024).toFixed(2)} KB)`);
        }

        return NextResponse.json({
            success: true,
            images: uploadedImages,
            count: uploadedImages.length,
        });

    } catch (error) {
        console.error('❌ Error en upload:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al subir imágenes'
            },
            { status: 500 }
        );
    }
}
