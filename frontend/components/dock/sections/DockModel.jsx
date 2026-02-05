'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Check, ChevronDown } from 'lucide-react';

const MODELS = [
    {
        id: 'standard',
        title: 'Modelo Estándar',
        description: 'Audio nativo inmersivo y efectos visuales cinematográficos.',
        icon: 'S'
    },
    {
        id: 'pro',
        title: 'Modelo Pro',
        description: 'Simulación de física excepcional y rendimiento de movimiento.',
        icon: 'P',
        isNew: true
    }
];

export default function DockModel({ selected, onChange, isExpanded, onToggle }) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${isExpanded
                    ? 'bg-[#ec4899] text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                    : 'text-[#a0a8c0] hover:bg-white/5 hover:text-white'
                    }`}
            >
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#ec4899] to-[#db2777] flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-pink-500/20">
                    {selected.icon}
                </div>
                <span className="text-[13px] font-bold">Modelo</span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-72 bg-[#161925] rounded-[24px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-[#1e2231] p-2 z-[60]"
                    >
                        <div className="text-[10px] font-bold text-[#3e445b] px-3 py-2 uppercase tracking-tight">Seleccionar Motor</div>
                        {MODELS.map((model) => {
                            const isSelected = model.id === selected.id;

                            return (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onChange(model);
                                        onToggle();
                                    }}
                                    className={`w-full flex flex-col gap-1 p-3 rounded-xl transition-all text-left ${isSelected
                                        ? 'bg-[#ec4899]/10 border border-[#ec4899]/30'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-[#0d0f17] flex items-center justify-center text-[9px] font-black text-white border border-[#1e2231]">
                                                {model.icon}
                                            </div>
                                            <span className={`text-[13px] font-bold ${isSelected ? 'text-[#ec4899]' : 'text-white'}`}>
                                                {model.title}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-[#ec4899]" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[#5a6275] leading-normal pl-8">
                                        {model.description}
                                    </p>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
