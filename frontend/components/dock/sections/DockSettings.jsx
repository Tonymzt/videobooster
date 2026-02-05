'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Instagram, Youtube, Monitor, Smartphone } from 'lucide-react';

export default function DockSettings({
    duration,
    quality,
    format,
    count,
    onDurationChange,
    onQualityChange,
    onFormatChange,
    onCountChange,
    isExpanded,
    onToggle
}) {
    // Formatos enriquecidos con iconos de plataforma para "Magia en un click"
    const FORMATS = [
        { id: '16:9', label: 'Cine/YouTube', width: 'w-7', height: 'h-4', icon: Youtube, platform: 'YouTube' },
        { id: '9:16', label: 'Reels/TikTok', width: 'w-4', height: 'h-7', icon: Smartphone, platform: 'Mobile' },
        { id: '1:1', label: 'Post/Feed', width: 'w-5', height: 'h-5', icon: Instagram, platform: 'Social' },
        { id: '4:5', label: 'Retrato', width: 'w-4.5', height: 'h-5.5', icon: Monitor, platform: 'Ads' }
    ];

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${isExpanded
                    ? 'bg-[#ec4899] text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                    : 'text-[#a0a8c0] hover:bg-white/5 hover:text-white'
                    }`}
            >
                <div className="relative">
                    <Settings className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-[#ec4899]'}`} />
                    {isExpanded && (
                        <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                    )}
                </div>
                <span className="text-[13px] font-bold">Parámetros</span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-[480px] bg-[#161925] rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-[#1e2231] p-7 z-[60]"
                    >
                        <div className="grid grid-cols-2 gap-x-8">
                            {/* COLUMNA 1: INTUITIVO (FORMATOS) */}
                            <div>
                                <h4 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] mb-4">Formato Inteligente</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {FORMATS.map((f) => {
                                        const isSelected = format === f.id;
                                        const Icon = f.icon;
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => {
                                                    onFormatChange(f.id);
                                                    // onToggle(); // Opcional: Cerrar al seleccionar si se desea
                                                }}
                                                className={`group relative h-24 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${isSelected
                                                    ? 'bg-[#ec4899]/10 border-[#ec4899] shadow-[0_4px_20px_-4px_rgba(236,72,153,0.3)]'
                                                    : 'bg-[#0d0f17] border-[#1e2231] hover:border-[#ec4899]/30 hover:bg-[#ec4899]/5'
                                                    }`}
                                            >
                                                {/* Visual Representation */}
                                                <div className="relative flex items-center justify-center mb-1">
                                                    <div
                                                        className={`border-2 rounded-[3px] transition-all duration-300 ${f.width} ${f.height} ${isSelected
                                                            ? 'border-[#ec4899] bg-[#ec4899]/20'
                                                            : 'border-[#3e445b] group-hover:border-[#ec4899]/60'}`}
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute -bottom-1 -right-1 bg-[#ec4899] rounded-full p-0.5 shadow-sm">
                                                            <Icon className="w-2 h-2 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-center">
                                                    <span className={`block text-[10px] font-black ${isSelected ? 'text-[#ec4899]' : 'text-[#a0a8c0] group-hover:text-white'}`}>
                                                        {f.id}
                                                    </span>
                                                    <span className="block text-[8px] font-medium text-[#5a6275] uppercase tracking-wide mt-0.5">
                                                        {f.label}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* COLUMNA 2: DETALLES TÉCNICOS (SIMPLIFICADOS) */}
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] mb-3">Calidad Visual</h4>
                                    <div className="flex gap-1.5 p-1 bg-[#0d0f17] rounded-xl border border-[#1e2231]">
                                        {['720P', '1080P', '4K'].map(q => (
                                            <button
                                                key={q}
                                                onClick={() => onQualityChange(q)}
                                                className={`flex-1 h-8 rounded-lg text-[9px] font-black tracking-tight transition-all ${quality === q
                                                    ? 'bg-[#ec4899] text-white shadow-md'
                                                    : 'text-[#3e445b] hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] mb-3">Duración</h4>
                                    <div className="flex gap-1.5 p-1 bg-[#0d0f17] rounded-xl border border-[#1e2231]">
                                        {['8s', '10s', '15s'].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => onDurationChange(d)}
                                                className={`flex-1 h-8 rounded-lg text-[10px] font-black transition-all ${duration === d
                                                    ? 'bg-[#ec4899] text-white shadow-md'
                                                    : 'text-[#3e445b] hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] mb-3">Variaciones</h4>
                                    <div className="flex gap-1.5 p-1 bg-[#0d0f17] rounded-xl border border-[#1e2231]">
                                        {[1, 2, 3, 4].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => onCountChange(v)}
                                                className={`flex-1 h-8 rounded-lg text-[10px] font-black transition-all ${count === v
                                                    ? 'bg-[#ec4899] text-white shadow-md'
                                                    : 'text-[#3e445b] hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
