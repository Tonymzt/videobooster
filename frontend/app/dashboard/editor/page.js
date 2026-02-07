'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Sparkles,
    Image as ImageIcon,
    Plus,
    ChevronLeft,
    ChevronDown,
    HelpCircle,
    Layout,
    RefreshCw,
    X,
    Trash2,
    Wand2,
    Check,
    Loader2,
    Info,
    MoreHorizontal,
    Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Dock from '@/components/dock/Dock';

const MODELS = [
    {
        id: 'standard',
        title: 'Modelo Estándar',
        description: 'Audio nativo inmersivo y efectos visuales cinematográficos.',
        sub: 'Videos de hasta 8 segundos. Audio compatible.',
        icon: 'S'
    },
    {
        id: 'pro',
        title: 'Modelo Pro',
        description: 'Simulación de física excepcional y rendimiento de movimiento.',
        sub: 'Videos de hasta 10 segundos.',
        icon: 'P',
        isNew: true
    }
];

const IMAGES = [
    { url: "https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/thumbnails/abigail_thumb.webp", label: "Imagen 1" },
    { url: "https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/thumbnails/telefono1.webp", label: "Imagen 2" }
];

export default function EditorPage() {
    const [activeTab, setActiveTab] = useState('multiple');
    const [videoDescription, setVideoDescription] = useState("");
    const [dubbingText, setDubbingText] = useState("");
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Parameter States
    const [videoCount, setVideoCount] = useState(1);
    const [selectedDuration, setSelectedDuration] = useState('8s');
    const [selectedQuality, setSelectedQuality] = useState('1080P');
    const [selectedFormat, setSelectedFormat] = useState('9:16');
    const [selectedModel, setSelectedModel] = useState(MODELS[0]);

    // Camera Tags States
    const [selectedCameraMove, setSelectedCameraMove] = useState('Static');
    const [selectedShotType, setSelectedShotType] = useState('Plano largo');
    const [selectedCameraAngle, setSelectedCameraAngle] = useState('Contrapicado');

    // UI States
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generatedVideo, setGeneratedVideo] = useState(null);
    const [error, setError] = useState(null);

    // Estados para imágenes subidas por el usuario (Upload directo)
    const [referenceImages, setReferenceImages] = useState([]);



    // Cargar última generación al montar para el test de humo o recuperación de estado
    useEffect(() => {
        const fetchLastJob = async () => {
            try {
                const response = await fetch('/api/video-status/latest');
                if (response.ok) {
                    const statusData = await response.json();
                    if (statusData.success && statusData.data) {
                        setGeneratedVideo(statusData.data);
                    }
                }
            } catch (err) {
                console.warn("No se pudo cargar la última generación:", err);
            }
        };
        fetchLastJob();
    }, []);

    // Polling para actualizar el video generado
    useEffect(() => {
        if (!generatedVideo || generatedVideo.videoUrl || generatedVideo.isImageOnly) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/video-status/${generatedVideo.generationId || generatedVideo.jobId}`);
                if (response.ok) {
                    const statusData = await response.json();
                    if (statusData.success && statusData.data.status === 'completed') {
                        setGeneratedVideo(prev => ({
                            ...prev,
                            videoUrl: statusData.data.videoUrl
                        }));
                        clearInterval(pollInterval);
                    } else if (statusData.data?.status === 'failed') {
                        setGeneratedVideo(prev => ({
                            ...prev,
                            isImageOnly: true
                        }));
                        clearInterval(pollInterval);
                    }
                }
            } catch (err) {
                console.error("Error en polling de editor:", err);
            }
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [generatedVideo]);

    const handleGenerate = async () => {
        if (!videoDescription.trim()) return;

        setIsGenerating(true);
        setProgress(5);
        setError(null);
        setGeneratedVideo(null);

        try {
            // Simulamos progreso inicial
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return 90;
                    return prev + Math.floor(Math.random() * 5) + 1;
                });
            }, 800);

            const response = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: videoDescription,
                    useBrain: true, // Siempre activar Brain en el editor pro
                    model: selectedModel.id,
                    cameraMove: selectedCameraMove,
                    shotType: selectedShotType,
                    cameraAngle: selectedCameraAngle,
                    audioEnabled,
                    dubbingText,
                    duration: selectedDuration,
                    quality: selectedQuality,
                    format: selectedFormat,
                    videoCount,
                    referenceImages: referenceImages
                })
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en generación');
            }

            const data = await response.json();

            setProgress(100);
            // IMPORTANTE: Aseguramos que el id del job sea consistente para el polling
            setGeneratedVideo({
                ...data,
                jobId: data.generationId || data.jobId
            });

            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 1000);

        } catch (error) {
            console.error(error);
            setError(error.message);
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#07080c] text-[#a0a8c0] font-sans overflow-hidden">
            <style jsx global>{`
                * {
                    scrollbar-width: thin;
                    scrollbar-color: #1e2231 transparent;
                }
                *::-webkit-scrollbar { width: 5px; }
                *::-webkit-scrollbar-thumb { background: #1e2231; border-radius: 10px; }
            `}</style>

            {/* Header / Navigation */}
            <header className="h-14 px-8 flex items-center justify-between border-b border-white/5 bg-[#0a0b10]/50 backdrop-blur-xl z-20 shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2 text-[#5a6275] hover:text-white transition-all group">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider">Salir</span>
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('initial')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'initial' ? 'text-white' : 'text-[#3e445b] hover:text-[#5a6275]'}`}>Inicial</button>
                        <button onClick={() => setActiveTab('multiple')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'multiple' ? 'text-white' : 'text-[#3e445b] hover:text-[#5a6275]'}`}>Múltiple</button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1c28]/80 backdrop-blur-md rounded-xl border border-white/5 shadow-xl">
                        <Sparkles className="h-3.5 w-3.5 text-[#ec4899] fill-[#ec4899]/20" />
                        <span className="text-[13px] font-black text-white">50</span>
                    </div>
                    <Button variant="ghost" className="h-8 px-6 text-[10px] font-black uppercase tracking-widest text-[#ec4899] bg-[#ec4899]/10 rounded-xl border border-[#ec4899]/20 hover:bg-[#ec4899]/20 transition-all active:scale-95">
                        Upgrade
                    </Button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col items-center justify-between p-6 overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3b5bdb]/5 blur-[100px] rounded-full pointer-events-none" />

                {/* 1. MONITOR CENTRAL (Ocupa el máximo espacio y es reactivo al formato) */}
                <div className="w-full flex-1 flex items-center justify-center min-h-0 py-4">
                    <div
                        className={`bg-black rounded-[32px] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden transition-all duration-500 ease-in-out h-full
                            ${selectedFormat === '9:16' ? 'aspect-[9/16]' :
                                selectedFormat === '16:9' ? 'aspect-video' :
                                    selectedFormat === '1:1' ? 'aspect-square' : 'aspect-[4/5]'}`}
                        style={{ maxHeight: '100%' }}
                    >
                        <div className="absolute inset-0 bg-[#ec4899]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        {/* Camera corner indicators */}
                        <div className="absolute top-6 left-6 w-6 h-6 border-t border-l border-white/20" />
                        <div className="absolute top-6 right-6 w-6 h-6 border-t border-r border-white/20" />
                        <div className="absolute bottom-6 left-6 w-6 h-6 border-b border-l border-white/20" />
                        <div className="absolute bottom-6 right-6 w-6 h-6 border-b border-r border-white/20" />

                        {/* Contenido del Monitor */}
                        {/* Contenido del Monitor */}
                        {generatedVideo ? (
                            // Video Generado
                            <div className="absolute inset-0">
                                {(!generatedVideo.videoUrl || generatedVideo.isImageOnly || generatedVideo.videoUrl?.match(/\.(jpg|jpeg|png|webp)$/i)) ? (
                                    <>
                                        <img
                                            src={generatedVideo.imageUrl || generatedVideo.videoUrl}
                                            alt="Generación"
                                            className="w-full h-full object-cover"
                                        />
                                        {!generatedVideo.videoUrl && !generatedVideo.isImageOnly && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                                                <p className="text-white text-sm font-bold uppercase tracking-widest">
                                                    Creando Magia Audiovisual...
                                                </p>
                                                <p className="text-white/60 text-[10px] mt-2">
                                                    Esto puede tardar unos 60 segundos
                                                </p>
                                            </div>
                                        )}
                                        {generatedVideo.isImageOnly && (
                                            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                                                <span className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    📷 Imagen Generada (Video falló)
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <video
                                        src={generatedVideo.videoUrl}
                                        className="w-full h-full object-cover"
                                        controls
                                        autoPlay
                                        loop
                                    />
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button className="px-3 py-1.5 bg-[#ec4899] text-white text-[10px] font-black rounded-lg hover:bg-[#db2777] transition-all">
                                        Descargar
                                    </button>
                                    <button
                                        onClick={() => setGeneratedVideo(null)}
                                        className="px-3 py-1.5 bg-white/10 text-white text-[10px] font-black rounded-lg hover:bg-white/20 transition-all"
                                    >
                                        Nuevo
                                    </button>
                                </div>
                            </div>
                        ) : error ? (
                            // Error
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                                    <X className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="font-black text-white tracking-tight text-lg mb-2">
                                    Error en Generación
                                </h3>
                                <p className="text-[11px] text-[#5a6275] font-medium max-w-md">
                                    {error}
                                </p>
                                <button
                                    onClick={() => setError(null)}
                                    className="mt-4 px-4 py-2 bg-[#ec4899] text-white text-[10px] font-black rounded-lg hover:bg-[#db2777] transition-all"
                                >
                                    Intentar de nuevo
                                </button>
                            </div>
                        ) : (
                            // Placeholder
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 transition-transform duration-500">
                                    <ImageIcon className="w-6 h-6 text-[#3e445b]" />
                                </div>
                                <h3 className={`font-black text-white tracking-tight opacity-40 group-hover:opacity-80 transition-opacity ${selectedFormat === '9:16' ? 'text-lg rotate-0' : 'text-xl'}`}>
                                    {selectedFormat === '9:16' ? 'Vista Vertical' : 'Monitor de Producción'}
                                </h3>
                                <p className="text-[9px] text-[#5a6275] font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                    {selectedFormat === '9:16' ? 'Optimizado para Móviles' : 'Define tu prompt para comenzar'}
                                </p>
                            </div>
                        )}

                        {/* Status overlays */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 text-[10px] font-bold">
                            <div className="flex items-center gap-2">
                                <span className="text-[#3e445b] uppercase tracking-widest">Res:</span>
                                <span className="text-white">{selectedQuality}</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <span className="text-[#3e445b] uppercase tracking-widest">FPS:</span>
                                <span className="text-white">24</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <span className="text-[#3e445b] uppercase tracking-widest">Motor:</span>
                                <span className="text-white">{selectedModel.icon}-Gen</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Margen para el Dock */}
                <div className="h-20 shrink-0" />
            </main >

            {/* 🎧 THE NEW DOCK */}
            < Dock
                videoDescription={videoDescription}
                setVideoDescription={setVideoDescription}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                selectedCameraMove={selectedCameraMove}
                setSelectedCameraMove={setSelectedCameraMove}
                selectedShotType={selectedShotType}
                setSelectedShotType={setSelectedShotType}
                selectedCameraAngle={selectedCameraAngle}
                setSelectedCameraAngle={setSelectedCameraAngle}
                audioEnabled={audioEnabled}
                setAudioEnabled={setAudioEnabled}
                dubbingText={dubbingText}
                setDubbingText={setDubbingText}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                selectedQuality={selectedQuality}
                setSelectedQuality={setSelectedQuality}
                selectedFormat={selectedFormat}
                setSelectedFormat={setSelectedFormat}
                videoCount={videoCount}
                setVideoCount={setVideoCount}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                progress={progress}
                status={isGenerating ? (progress < 30 ? 'Analizando clips...' : progress < 70 ? 'Calculando física...' : 'Finalizando render...') : ''}
                referenceImages={referenceImages}
                setReferenceImages={setReferenceImages}
            />
        </div >
    );
}
