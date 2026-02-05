'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DockAction({ onGenerate, isGenerating, disabled }) {
    return (
        <div className="relative pl-2">
            <Button
                onClick={onGenerate}
                disabled={disabled || isGenerating}
                className={`group relative h-12 px-8 rounded-2xl font-black text-[13px] uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center gap-3 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] hover:scale-105 hover:brightness-110 border-0 overflow-hidden ${isGenerating
                    ? 'bg-[#1c2132] text-[#5a6275] border border-[#1e2231]'
                    : 'bg-gradient-to-r from-[#ec4899] via-[#d946ef] to-[#ec4899] bg-[length:200%_auto] hover:bg-right animate-gradient text-white'
                    }`}
            >
                {/* Shine Effect Overlay */}
                {!isGenerating && !disabled && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent z-10 pointer-events-none" />
                )}

                <div className="relative z-20 flex items-center justify-center w-full gap-3">
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Generando...</span>
                        </>
                    ) : (
                        <span className="drop-shadow-sm w-full text-center">GENERAR VIDEO</span>
                    )}
                </div>
            </Button>

            {!isGenerating && !disabled && (
                <div className="absolute -top-3 -right-2 bg-[#ff5c00] text-[8px] font-black px-2 py-0.5 rounded shadow-xl border border-white/10 text-white uppercase tracking-tighter transform rotate-3 animate-bounce">
                    67% OFF
                </div>
            )}
        </div>
    );
}
