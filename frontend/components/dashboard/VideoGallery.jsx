'use client';

import { useState } from 'react';
import {
    Play,
    Download,
    Share2,
    Trash2,
    MoreVertical,
    Calendar,
    Clock,
    Filter,
    Search,
    ChevronRight,
    Sparkles,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function VideoGallery({ videos = [] }) {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Datos de ejemplo para ver el diseño (Tony, esto se reemplazará con tus videos reales)
    const displayVideos = videos.length > 0 ? videos : [
        { id: 1, title: 'Comercial Purificador AirPro', date: '2 horas atrás', duration: '15s', status: 'ready', thumbnail: 'https://images.unsplash.com/photo-1585336139118-89ce39e2405d?w=400&h=700&fit=crop' },
        { id: 2, title: 'Intro Software Dashboard', date: 'Ayer', duration: '08s', status: 'ready', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=700&fit=crop' },
        { id: 3, title: 'Review Cafetera Espresso', date: '3 días atrás', duration: '22s', status: 'ready', thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=700&fit=crop' },
        { id: 4, title: 'Promo Fitness App', date: '1 semana atrás', duration: '12s', status: 'processing', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=700&fit=crop' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">

            {/* 🔍 BARRA DE HERRAMIENTAS DE LA GALERÍA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Mis Creaciones</h2>
                    <p className="text-slate-500 text-sm font-medium">Gestiona y descarga tus videos generados con IA.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                        <Input
                            placeholder="Buscar video..."
                            className="bg-white/5 border-white/10 rounded-xl pl-10 w-[200px] md:w-[300px] text-xs focus:ring-pink-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 rounded-xl h-10 px-4 hover:bg-white/10">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                    </Button>
                </div>
            </div>

            {/* 🧊 GRID DE VIDEOS KEEVX STYLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayVideos.map((video) => (
                    <div
                        key={video.id}
                        className="group relative flex flex-col bg-[#0f0f12] rounded-[32px] border border-white/5 overflow-hidden hover:border-pink-500/40 transition-all duration-500 shadow-xl hover:shadow-pink-600/5"
                    >
                        {/* Multimedia Container */}
                        <div className="aspect-[9/16] relative bg-slate-900 overflow-hidden">
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />

                            {/* Overlay de Estado */}
                            <div className="absolute top-4 left-4 z-20">
                                {video.status === 'processing' ? (
                                    <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 backdrop-blur-md text-[10px] font-bold">
                                        <Clock className="h-3 w-3 mr-1 animate-spin" />
                                        PROCESANDO...
                                    </Badge>
                                ) : (
                                    <Badge className="bg-pink-500/20 text-pink-400 border border-pink-500/30 backdrop-blur-md text-[10px] font-bold">
                                        LISTO ✨
                                    </Badge>
                                )}
                            </div>

                            {/* Botón Play Central (Solo en Hover) */}
                            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform shadow-pink-600/50 cursor-pointer">
                                    <Play className="h-6 w-6 text-white fill-white" />
                                </div>
                            </div>

                            {/* Acciones Rápidas Inferiores */}
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <Button size="icon" className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-pink-600">
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button size="icon" className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-pink-600">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                                <Button size="icon" className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Info del Video */}
                        <div className="p-5 space-y-3">
                            <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-pink-400 transition-colors uppercase tracking-tight">{video.title}</h4>
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    {video.date}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    {video.duration}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Tarjeta de "Crear Nuevo" fija */}
                <div className="aspect-[9/16] rounded-[32px] border-2 border-dashed border-white/5 hover:border-pink-500/40 bg-white/[0.02] flex flex-col items-center justify-center gap-4 cursor-pointer group transition-all">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                        <Plus className="h-8 w-8 text-slate-600 group-hover:text-pink-500" />
                    </div>
                    <span className="text-xs font-black text-slate-600 group-hover:text-pink-400 uppercase tracking-widest">Nuevo Video</span>
                </div>
            </div>

            {/* Pagination / Load More */}
            <div className="flex justify-center pt-10">
                <Button variant="ghost" className="text-xs font-bold text-slate-500 hover:text-pink-400 uppercase tracking-widest flex items-center gap-2">
                    Cargar más creaciones
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
