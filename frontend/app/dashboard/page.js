'use client';

import { useState } from 'react';
import {
    Sparkles,
    Video,
    Zap,
    Languages,
    ImageIcon,
    PlayCircle,
    Plus,
    Clock,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VideoDetailsModal from '@/components/dashboard/VideoDetailsModal';
import { useRouter } from 'next/navigation';

const INSPIRATION_DATA = [
    {
        id: 1,
        title: 'App Introduction',
        description: "Image 1's girl holding a phone towards the camera, demonstrating and introducing the app interface in English.",
        usage: '138 vez/veces',
        model: 'Imagen de producto',
        thumbnail: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/thumbnails/abigail_thumb.webp',
        videoUrl: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/videos/comercial_telefono.webm',
        references: [
            'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/thumbnails/abigail_thumb.webp',
            'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/thumbnails/telefono1.webp'
        ]
    },
    {
        id: 2,
        title: 'Review Cafetera Espresso',
        description: 'Review detallada usando el modelo de múltiples referencias visuales para crear una escena de cocina realista.',
        thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=700&fit=crop',
        videoUrl: null,
        references: [
            'https://images.unsplash.com/photo-1556656793-062ff98782ee?w=200&h=200&fit=crop'
        ]
    }
    // Podemos seguir agregando más...
];

const CREATION_MODES = [
    {
        id: 'translator',
        title: 'Traducir y doblar videos',
        desc: 'Video traducción: labios sincronizados',
        icon: <Languages className="h-6 w-6 text-pink-400" />,
        color: 'from-pink-600/20 to-rose-600/20',
        badge: null
    },
    {
        id: 'image-gen',
        title: 'Generador de imágenes IA',
        desc: 'Crear lo imposible, Cambiar productos',
        icon: <ImageIcon className="h-6 w-6 text-purple-400" />,
        color: 'from-purple-600/20 to-pink-600/20',
        badge: null
    },
    {
        id: 'product-video',
        title: 'Imagen de producto a video',
        desc: 'Da vida a tus imágenes de producto',
        icon: <Video className="h-6 w-6 text-orange-400" />,
        color: 'from-orange-600/20 to-pink-600/20',
        badge: 'Update'
    },
    {
        id: 'script-video',
        title: 'Inspiración a video',
        desc: 'Convierte ideas en videos de avatar',
        icon: <Zap className="h-6 w-6 text-emerald-400" />,
        color: 'from-emerald-600/20 to-pink-600/20',
        badge: null
    },
    {
        id: 'ad-generator',
        title: 'Anuncios de video con IA',
        desc: 'Crear anuncios de video desde URL',
        icon: <Sparkles className="h-6 w-6 text-yellow-400" />,
        color: 'from-yellow-600/20 to-pink-600/20',
        badge: 'Nuevo'
    }
];

export default function DashboardPage() {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const router = useRouter();

    const handleRecreate = (video) => {
        // En un futuro, cargaremos los parámetros de este video aquí
        router.push('/dashboard/editor');
    };

    return (
        <div className="h-full overflow-y-auto bg-[#070708] custom-scrollbar">

            {/* 🌌 HERO SECTION CON GRADIENTE MAGENTA */}
            <div className="relative pt-16 pb-24 px-10">
                {/* Fondo de Gradiente Blur */}
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-pink-900/30 via-rose-900/10 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-12">
                    {/* Título Principal */}
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
                            Impulsa tu negocio con <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Video IA</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium">
                            La plataforma todo-en-uno para crear comerciales de alto impacto en segundos.
                        </p>
                    </div>

                    {/* 🧊 GRID DE TARJETAS DE CREACIÓN */}
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        <Button
                            className="h-auto bg-pink-600 hover:bg-pink-500 rounded-2xl flex flex-col items-center gap-3 p-8 min-w-[140px] shadow-2xl shadow-pink-500/20 border-0 transition-all active:scale-95"
                            onClick={() => router.push('/dashboard/editor')}
                        >
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                                <Plus className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-white">Crear</span>
                        </Button>

                        {CREATION_MODES.map((mode, i) => (
                            <div
                                key={i}
                                className={`
                                    min-w-[240px] p-6 rounded-[28px] border border-white/5 
                                    bg-gradient-to-br ${mode.color} backdrop-blur-xl 
                                    hover:border-pink-500/30 transition-all cursor-pointer group
                                    flex flex-col justify-between h-[180px]
                                `}
                                onClick={() => router.push('/dashboard/editor')}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-black/30 rounded-2xl group-hover:scale-110 transition-transform">
                                        {mode.icon}
                                    </div>
                                    {mode.badge && (
                                        <Badge className="bg-pink-500 text-[10px] font-bold uppercase border-0">{mode.badge}</Badge>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white text-sm leading-tight group-hover:text-pink-100 transition-colors">{mode.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">{mode.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🎥 CENTRO DE INSPIRACIÓN */}
            <div className="px-10 pb-20 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">Centro de Inspiración</h3>
                        <Badge variant="outline" className="text-[10px] border-pink-500/30 text-pink-400 bg-pink-500/5 px-2">POPULAR 🔥</Badge>
                    </div>
                    <Button variant="ghost" className="text-xs text-pink-400 hover:text-pink-300 hover:bg-pink-500/5">Ver todas las tendencias</Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {INSPIRATION_DATA.map((video) => (
                        <div
                            key={video.id}
                            className="group relative aspect-[9/16] rounded-3xl overflow-hidden bg-[#121216] border border-white/5 hover:border-pink-500/50 transition-all cursor-pointer shadow-lg"
                            onClick={() => setSelectedVideo(video)}
                        >
                            {/* Imagen Estática (Visible por defecto) */}
                            <img
                                src={video.thumbnail}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-0 transition-opacity duration-500"
                                alt={video.title}
                            />

                            {/* Video Preview (Visible en Hover) */}
                            {video.videoUrl && (
                                <video
                                    src={video.videoUrl}
                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />

                            <div className="absolute bottom-4 left-4 right-4 z-20 text-shadow">
                                <p className="text-[12px] font-bold text-white leading-tight mb-1">{video.title}</p>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-300 font-medium">
                                    <span>{video.model}</span>
                                    <span className="opacity-40">|</span>
                                    <span>{video.usage}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Detalles */}
            <VideoDetailsModal
                video={selectedVideo}
                isOpen={!!selectedVideo}
                onClose={() => setSelectedVideo(null)}
                onRecreate={handleRecreate}
            />

            {/* Float Bottom Notification (Magenta) */}
            <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
                <div className="bg-[#1a1a1e]/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-right-full duration-500 pointer-events-auto">
                    <div className="h-10 w-10 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/30">
                        <TrendingUp className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">¡Nuevos Avatares!</p>
                        <p className="text-[10px] text-slate-500">Disponible ahora Abigail 3.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
