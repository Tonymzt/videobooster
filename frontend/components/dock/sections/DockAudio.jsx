'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic2, X, Sparkles, Music, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Opciones de voces simuladas (mapeadas a estilos de ElevenLabs) - Colores ajustados a marca
const VOICE_OPTIONS = [
    { id: 'male_deep', label: 'Narrador Cine', genre: 'Masculino', color: 'from-pink-500/20 to-rose-500/20' },
    { id: 'female_soft', label: 'Asistente IA', genre: 'Femenino', color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'male_promo', label: 'Promo Épica', genre: 'Masculino', color: 'from-orange-500/20 to-red-500/20' },
    { id: 'female_news', label: 'Noticiero', genre: 'Femenino', color: 'from-rose-500/20 to-orange-500/20' }
];

export default function DockAudio({ enabled, text, onEnabledChange, onTextChange, isExpanded, onToggle }) {
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
                    <Volume2 className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-[#ec4899]'}`} />
                    {enabled && !isExpanded && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ec4899]"></span>
                        </span>
                    )}
                </div>
                <span className="text-[13px] font-bold">Audio & Doblaje</span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-[420px] bg-[#161925] rounded-[28px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-[#1e2231] p-6 z-[60]"
                    >
                        {/* Header con Switch */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
                                    <Mic2 className="w-4 h-4 text-[#ec4899]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm leading-tight">Doblaje IA</h3>
                                    <p className="text-[10px] text-[#5a6275] font-medium">ElevenLabs v2.5 Turbo</p>
                                </div>
                            </div>

                            <button
                                onClick={() => onEnabledChange(!enabled)}
                                className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-[#ec4899]' : 'bg-[#1c2132]'
                                    }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className={`space-y-6 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>

                            {/* Selector de Voces */}
                            <div>
                                <h4 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] mb-3 px-1">Seleccionar Voz</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {VOICE_OPTIONS.map((voice) => (
                                        <button
                                            key={voice.id}
                                            className="group relative h-14 rounded-xl overflow-hidden hover:scale-[1.02] transition-all border border-white/5 text-left p-3 flex flex-col justify-center hover:border-pink-500/30"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${voice.color} opacity-40 group-hover:opacity-60 transition-opacity`} />
                                            <div className="relative z-10 flex items-center justify-between">
                                                <div>
                                                    <span className="block text-[11px] font-bold text-white group-hover:text-pink-100 transition-colors">{voice.label}</span>
                                                    <span className="block text-[9px] font-medium text-white/50 uppercase tracking-wider">{voice.genre}</span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlayCircle className="w-3 h-3 text-white" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Editor de Guion */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h4 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em]">Guion</h4>
                                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#ec4899] hover:text-[#f472b6] transition-colors">
                                        <Sparkles className="w-3 h-3" />
                                        Mejorar con IA
                                    </button>
                                </div>
                                <div className="relative group">
                                    <textarea
                                        value={text}
                                        onChange={(e) => onTextChange(e.target.value)}
                                        placeholder="Escribe lo que dirá el narrador o personaje..."
                                        className="w-full h-28 px-4 py-3 text-xs leading-relaxed rounded-2xl border border-[#1e2231] bg-[#0d0f17] text-[#a0a8c0] placeholder:text-[#3e445b] focus:ring-2 focus:ring-[#ec4899]/50 focus:border-[#ec4899] resize-none outline-none transition-all"
                                        maxLength={200}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[9px] font-bold text-[#3e445b] bg-[#0d0f17]/80 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                                        {text?.length || 0}/200
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
