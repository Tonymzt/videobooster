/**
 * DockPrompt - Descripción + Upload de Imágenes
 * ARQUITECTURA SOBERANA - Sin scraping
 */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Upload, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DockPrompt({
    value,
    onChange,
    isExpanded,
    onToggle,
    referenceImages = [],
    onImagesChange,
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFileUpload = async (files) => {
        setUploadError('');

        // Validar cantidad
        if (referenceImages.length + files.length > 3) {
            setUploadError('Máximo 3 imágenes permitidas');
            return;
        }

        // Validar tipo y tamaño (client-side)
        const validFiles = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                setUploadError('Solo se permiten imágenes PNG, JPG o WEBP');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('Cada imagen debe ser menor a 10MB');
                return;
            }
            validFiles.push(file);
        }

        try {
            // Preview inmediato (optimista)
            const previewUrls = validFiles.map(file => URL.createObjectURL(file));
            // NOTA: Mostramos preview local mientras sube, pero NO lo agregamos a referenceImages
            // hasta tener la URL real de R2.

            // Subir al backend (R2)
            const formData = new FormData();
            validFiles.forEach(file => formData.append('images', file));

            console.log('📤 Subiendo imágenes a R2...');

            const response = await fetch('/api/upload-images', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error al subir imágenes');
            }

            console.log('✅ Imágenes subidas a R2:', data.images);

            // Actualizar UI con URLs públicas de R2
            // Esto es lo CRÍTICO: referenceImages ahora contendrá URLs de R2 (https://pub-...)
            const publicUrls = data.images.map(img => img.url);
            onImagesChange([...referenceImages, ...publicUrls]);

        } catch (error) {
            console.error('Error en upload:', error);
            setUploadError('Error al procesar imágenes');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        handleFileUpload(files);
    };

    const handleRemoveImage = (index) => {
        const newImages = referenceImages.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    const handleEnhancePrompt = () => {
        const modifiers = [
            "iluminación cinematográfica", "resolución 8k", "altamente detallado",
            "fotorealista", "atmósfera dramática", "profundidad de campo",
            "luz volumétrica", "color grading profesional", "unreal engine 5 render"
        ];

        const newModifiers = modifiers
            .filter(m => !value?.toLowerCase().includes(m))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .join(", ");

        onChange(value ? `${value}. ${newModifiers}.` : `Escena épica con ${newModifiers}.`);
    };

    return (
        <div className="relative">
            {/* Botón (siempre visible) */}
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${isExpanded
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-pink-500 shadow-lg shadow-pink-500/20'
                    : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border-pink-500/20'
                    }`}
            >
                <Sparkles className="w-5 h-5 text-pink-500" />
                <span className="text-sm font-medium text-white">
                    Describe
                </span>
                {(value || referenceImages.length > 0) && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-pink-500/20 text-pink-300 rounded-full">
                        ✓
                    </span>
                )}
            </button>

            {/* Panel Expandido */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-full left-0 mb-4 w-[600px] bg-[#1a1d29] rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-[#13151f]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Descripción del Video</h3>
                                    <p className="text-xs text-gray-400">Describe y sube imágenes de referencia</p>
                                </div>
                            </div>
                            <button
                                onClick={onToggle}
                                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                            {/* Upload Zone */}
                            <div className="space-y-3">
                                <label className="text-sm text-gray-300 font-medium flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-pink-500" />
                                    Imágenes de Referencia ({referenceImages.length}/3)
                                </label>

                                {/* Drag & Drop Zone */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${isDragging
                                        ? 'border-pink-500 bg-pink-500/10'
                                        : 'border-gray-700/50 hover:border-pink-500/50 bg-gray-800/20'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        multiple
                                        onChange={handleFileInput}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={referenceImages.length >= 3}
                                    />

                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                        <div className="p-3 bg-pink-500/10 rounded-full">
                                            <ImageIcon className="w-6 h-6 text-pink-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-white">
                                                {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra imágenes o haz click'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PNG, JPG o WEBP • Máx 10MB cada una
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {uploadError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-sm text-red-400">{uploadError}</p>
                                    </div>
                                )}

                                {/* Images Grid */}
                                {referenceImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        {referenceImages.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700/50 bg-gray-800/50 group"
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Reference ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        {referenceImages.length < 3 && (
                                            <button
                                                onClick={() => document.querySelector('input[type="file"]').click()}
                                                className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-700/50 hover:border-pink-500/50 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-800/20"
                                            >
                                                <Plus className="w-6 h-6 text-gray-500" />
                                                <span className="text-xs text-gray-500">
                                                    Agregar
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Description Textarea */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-300 font-medium">
                                    Describe tu video en detalle
                                </label>
                                <textarea
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder="Ej: Un producto flotando con partículas de luz, rotación suave 360°, fondo minimalista..."
                                    className="w-full h-40 px-4 py-3 text-sm rounded-lg bg-[#13151f] border border-gray-700/50 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-pink-500/50 focus:border-transparent resize-none"
                                    maxLength={1000}
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEnhancePrompt}
                                    className="gap-2 text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Ayúdame a escribir
                                </Button>
                                <span className="text-xs text-gray-500">
                                    {value?.length || 0}/1000
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
