'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function ImageUploader({ onImagesSelected, selectedImages = [] }) {
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        setUploading(true);

        // Convertir archivos a URLs locales para preview
        const newImages = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
        }));

        setUploadedImages(prev => [...prev, ...newImages]);
        onImagesSelected?.([...uploadedImages, ...newImages]);

        setUploading(false);
    }, [uploadedImages, onImagesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const removeImage = (id) => {
        const updated = uploadedImages.filter(img => img.id !== id);
        setUploadedImages(updated);
        onImagesSelected?.(updated);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Subir Imágenes de Productos
                </CardTitle>
                <CardDescription>
                    Arrastra y suelta imágenes o haz clic para seleccionar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-none p-12 text-center cursor-pointer
                        transition-colors duration-200
                        ${isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }
                    `}
                >
                    <input {...getInputProps()} />
                    <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="mt-4 text-sm font-medium text-gray-900">
                        {isDragActive ? '¡Suelta las imágenes aquí!' : 'Arrastra imágenes aquí'}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG, JPEG o WEBP (máx. 10MB)
                    </p>
                </div>

                {/* Grid de imágenes subidas */}
                {uploadedImages.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Imágenes Subidas ({uploadedImages.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {uploadedImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="relative group aspect-square rounded-none overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                >
                                    <img
                                        src={image.preview}
                                        alt={image.name}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Overlay con acciones */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(image.id)}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Eliminar
                                        </Button>
                                    </div>

                                    {/* Badge de selección */}
                                    {selectedImages.some(img => img.id === image.id) && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-none p-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                        <p className="text-xs text-white truncate">{image.name}</p>
                                        <p className="text-xs text-gray-300">
                                            {(image.size / 1024).toFixed(0)} KB
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mensaje vacío */}
                {uploadedImages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm">No has subido imágenes aún</p>
                        <p className="text-xs mt-1">Arrastra archivos o haz clic arriba para comenzar</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
