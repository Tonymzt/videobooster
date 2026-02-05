'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Video, Check, ChevronDown, Play } from 'lucide-react';
import { useState } from 'react';

// En el futuro, reemplaza estos placeholders con URLs reales de tus videos de ejemplo (mp4/webm)
// Ejemplo: '/videos/movements/dolly-in.mp4'
const CAMERA_MOVES = [
    { id: 'Static', label: 'Plano estático', color: 'from-slate-500/20 to-gray-500/20', preview: null },
    { id: 'Dolly In', label: 'Dolly In', color: 'from-pink-500/20 to-rose-500/20', preview: '/previews/dolly-in.mp4' },
    { id: 'Dolly Out', label: 'Dolly Out', color: 'from-rose-500/20 to-purple-500/20', preview: '/previews/dolly-out.mp4' },
    { id: 'Pan Left', label: 'Pan izquierda', color: 'from-purple-500/20 to-pink-500/20', preview: '/previews/pan-left.mp4' },
    { id: 'Pan Right', label: 'Pan derecha', color: 'from-pink-500/20 to-rose-500/20', preview: '/previews/pan-right.mp4' },
    { id: 'Orbit', label: 'Órbita', color: 'from-violet-500/20 to-purple-500/20', preview: '/previews/orbit.mp4' },
    { id: 'Tilt Up', label: 'Tilt arriba', color: 'from-purple-500/20 to-pink-500/20', preview: '/previews/tilt-up.mp4' },
    { id: 'Tilt Down', label: 'Tilt abajo', color: 'from-pink-500/20 to-rose-500/20', preview: '/previews/tilt-down.mp4' }
];

const SHOT_TYPES = [
    { id: 'Plano largo', label: 'Plano largo', icon: Video, color: 'from-pink-500/20 to-purple-500/20' },
    { id: 'Plano medio', label: 'Plano medio', icon: Video, color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'Primer plano', label: 'Primer plano', icon: Video, color: 'from-rose-500/20 to-orange-500/20' },
    { id: 'Primerísimo primer plano', label: 'Primerísimo P.P.', icon: Video, color: 'from-orange-500/20 to-rose-500/20' },
];

const CAMERA_ANGLES = [
    { id: 'Nivel del ojo', label: 'Nivel del ojo', icon: ChevronDown, color: 'from-pink-500/20 to-rose-500/20' },
    { id: 'Picado', label: 'Picado (High)', icon: ChevronDown, color: 'from-rose-500/20 to-pink-500/20' },
    { id: 'Contrapicado', label: 'Contrapicado (Low)', icon: ChevronDown, color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'Vista de pájaro', label: 'Vista de pájaro', icon: ChevronDown, color: 'from-pink-500/20 to-purple-500/20' },
];

export default function DockCamera({
    cameraMove, shotType, cameraAngle,
    onCameraMoveChange, onShotTypeChange, onCameraAngleChange,
    isExpanded, onToggle
}) {
    // Estado para gestionar hover de videos (opcional, para play/pause suave)
    const [hoveredMove, setHoveredMove] = useState(null);

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
                    <Video className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-[#ec4899]'}`} />
                    {!isExpanded && (
                        <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ec4899]"></span>
                        </span>
                    )}
                </div>
                <span className="text-[13px] font-bold">Cámara</span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-[600px] bg-[#161925] rounded-[32px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-[#1e2231] p-6 z-[60] flex flex-col gap-6"
                    >
                        {/* Header Branding */}
                        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                            <div className="p-2.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                                <Video className="w-5 h-5 text-[#ec4899]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white tracking-tight">Cámara Cinematográfica</h3>
                                <p className="text-[10px] text-[#5a6275] font-medium mt-0.5">Videos de referencia para cada movimiento</p>
                            </div>
                        </div>

                        {/* Movimiento de Cámara con VIDEO */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] px-1">Movimiento de cámara</h3>
                            <div className="grid grid-cols-4 gap-3">
                                {CAMERA_MOVES.map((move) => (
                                    <button
                                        key={move.id}
                                        onClick={() => onCameraMoveChange(move.id)}
                                        onMouseEnter={() => setHoveredMove(move.id)}
                                        onMouseLeave={() => setHoveredMove(null)}
                                        className={`group relative h-24 rounded-2xl overflow-hidden transition-all duration-300 ${cameraMove === move.id
                                            ? 'ring-2 ring-[#ec4899] ring-offset-2 ring-offset-[#161925] scale-[1.02] shadow-[0_8px_20px_-6px_rgba(236,72,153,0.4)]'
                                            : 'hover:scale-[1.02] hover:ring-1 hover:ring-white/20'
                                            }`}
                                    >
                                        {/* Capa de Video (Simulada o Real) */}
                                        <div className="absolute inset-0 bg-black/60">
                                            {/* Aquí iría el tag <video> real cuando tengas los assets */}
                                            {move.preview ? (
                                                <div className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                                                    {/* Placeholder visual de 'video' para demo */}
                                                    <div className={`w-full h-full bg-gradient-to-br ${move.color} mix-blend-overlay`} />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Play className="w-6 h-6 text-white/50 group-hover:hidden" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`absolute inset-0 bg-gradient-to-br ${move.color} opacity-30`} />
                                            )}
                                        </div>

                                        {/* Overlay Gradiente Texto */}
                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6">
                                            <p className="text-[10px] font-bold text-white text-center leading-tight drop-shadow-md">
                                                {move.label}
                                            </p>
                                        </div>

                                        {/* Checkmark Selección */}
                                        {cameraMove === move.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-[#ec4899] rounded-full flex items-center justify-center shadow-lg z-10">
                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Layout Inferior (Tipo y Ángulo) */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Tipo de Plano */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] px-1">Tipo de plano</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {SHOT_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => onShotTypeChange(type.id)}
                                            className={`relative h-12 rounded-xl border transition-all ${shotType === type.id
                                                ? 'bg-[#ec4899]/10 border-[#ec4899] text-white'
                                                : 'bg-[#0a0b10]/30 border-white/5 text-[#a0a8c0] hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-[10px] font-bold">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ángulo */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-[#5a6275] uppercase tracking-[0.15em] px-1">Ángulo</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {CAMERA_ANGLES.map((angle) => (
                                        <button
                                            key={angle.id}
                                            onClick={() => onCameraAngleChange(angle.id)}
                                            className={`relative h-12 rounded-xl border transition-all ${cameraAngle === angle.id
                                                ? 'bg-[#ec4899]/10 border-[#ec4899] text-white'
                                                : 'bg-[#0a0b10]/30 border-white/5 text-[#a0a8c0] hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-[10px] font-bold">{angle.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
