'use client';

import { X, Play, Share2, Sparkles, Volume2, VolumeX, Maximize2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

export default function VideoDetailsModal({ video, isOpen, onClose, onRecreate }) {
    const [hoveredImage, setHoveredImage] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setIsPlaying(true);
            setCurrentTime(0);
        }
    }, [isOpen, video]);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const onTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const onLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        if (videoRef.current) {
            videoRef.current.currentTime = percentage * duration;
        }
    };

    const toggleFullscreen = (e) => {
        e.stopPropagation();
        if (containerRef.current) {
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!isOpen || !video) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-[#1a1c22] border border-white/5 w-full max-w-5xl rounded-none-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 🏷 HEADER SECCIÓN */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1a1c22]">
                    <h2 className="text-lg font-bold text-white tracking-tight">{video.title || 'App Introduction'}</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white hover:bg-white/5 rounded-none h-8 w-8"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* 🎥 LADO IZQUIERDO: VIDEO PLAYER */}
                    <div ref={containerRef} className="flex-1 bg-black relative flex items-center justify-center group" onClick={togglePlay}>
                        {video.videoUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                    ref={videoRef}
                                    src={video.videoUrl}
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    loop
                                    onTimeUpdate={onTimeUpdate}
                                    onLoadedMetadata={onLoadedMetadata}
                                    onContextMenu={(e) => e.preventDefault()}
                                    controlsList="nodownload noplaybackrate"
                                    disablePictureInPicture
                                />
                                {/* Custom Controls (Inspirado en la captura, ahora más pequeños) */}
                                <div
                                    className="absolute bottom-4 left-4 right-4 h-9 bg-black/60 backdrop-blur-xl rounded-none border border-white/10 flex items-center px-3 gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div onClick={togglePlay} className="cursor-pointer hover:scale-110 transition-transform">
                                        {isPlaying ? (
                                            <Pause className="h-3.5 w-3.5 text-white fill-white" />
                                        ) : (
                                            <Play className="h-3.5 w-3.5 text-white fill-white" />
                                        )}
                                    </div>

                                    <div
                                        className="flex-1 h-1 bg-white/20 rounded-none relative cursor-pointer group/bar"
                                        onClick={handleSeek}
                                    >
                                        <div
                                            className="absolute inset-y-0 left-0 bg-white rounded-none transition-all duration-100"
                                            style={{ width: `${(currentTime / duration) * 100}%` }}
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-none shadow-lg transition-all duration-100 opacity-0 group-hover/bar:opacity-100"
                                            style={{ left: `${(currentTime / duration) * 100}%` }}
                                        />
                                    </div>

                                    <span className="text-[9px] font-bold text-white min-w-[60px] opacity-80">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>

                                    <div className="flex items-center gap-2.5">
                                        <div onClick={toggleMute} className="cursor-pointer hover:text-pink-400 opacity-80 hover:opacity-100 transition-all">
                                            {isMuted ? (
                                                <VolumeX className="h-3.5 w-3.5 text-white" />
                                            ) : (
                                                <Volume2 className="h-3.5 w-3.5 text-white" />
                                            )}
                                        </div>
                                        <Maximize2 className="h-3.5 w-3.5 text-white cursor-pointer hover:text-pink-400 opacity-80 hover:opacity-100 transition-all" onClick={toggleFullscreen} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-600">
                                <div className="w-16 h-16 rounded-none bg-white/5 flex items-center justify-center border border-white/10">
                                    <Play className="h-6 w-6 text-slate-500 fill-slate-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 📝 LADO DERECHO: INFO PANEL */}
                    <div className="w-full md:w-[380px] p-6 flex flex-col bg-[#1a1c22] border-l border-white/5 overflow-y-auto relative">
                        <div className="flex-1 space-y-8">
                            {/* Descripción del Producto */}
                            <div className="space-y-4 relative">
                                <h3 className="text-[11px] font-bold text-white">Descripción del producto</h3>
                                <div className="flex gap-2">
                                    {video.references?.map((ref, idx) => (
                                        <div
                                            key={idx}
                                            className="h-[80px] aspect-[3/4] rounded-none bg-slate-800 border border-white/10 overflow-hidden shadow-lg cursor-pointer hover:border-pink-500/50 transition-all"
                                            onMouseEnter={() => setHoveredImage(ref)}
                                            onMouseLeave={() => setHoveredImage(null)}
                                        >
                                            <img src={ref} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    )) || (
                                            <div className="h-[80px] aspect-[3/4] rounded-none bg-slate-800 border border-white/10" />
                                        )}
                                </div>

                                {/* ZOOM FLOATING IMAGE (Keevx Style) */}
                                {hoveredImage && (
                                    <div className="absolute top-full left-0 mt-4 z-[110] w-[180px] aspect-[9/16] bg-[#1a1c22] border border-white/10 rounded-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                        <img src={hoveredImage} className="w-full h-full object-cover" alt="Zoom" />
                                    </div>
                                )}
                            </div>

                            {/* Descripción del Vídeo */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-bold text-white">Descripción del vídeo</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {video.description || "Image 1's girl holding a phone towards the camera, demonstrating and introducing the app interface in English."}
                                </p>
                            </div>

                            {/* Metadatos en línea */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 font-medium">
                                <span className="truncate">{video.model || 'Imagen de producto a video'}</span>
                                <span className="text-slate-700">|</span>
                                <span className="whitespace-nowrap">Modelo Estándar</span>
                                <span className="text-slate-700">|</span>
                                <span className="whitespace-nowrap">Usado {video.usage || '138 vez/veces'}</span>
                            </div>
                        </div>

                        {/* Botones de Acción Inferiores */}
                        <div className="pt-8 flex gap-3 mt-auto">
                            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white rounded-none h-11 text-xs font-bold hover:bg-white/10 transition-all border-none shadow-inner">
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                            </Button>
                            <Button
                                className="flex-1 bg-[#4263eb] hover:bg-[#364fc7] text-white rounded-none h-11 text-xs font-bold shadow-[0_0_20px_rgba(66,99,235,0.3)] transition-all active:scale-95"
                                onClick={() => {
                                    onRecreate?.(video);
                                    onClose();
                                }}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Recrear
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
