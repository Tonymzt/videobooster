'use client';

import { useState } from 'react';
import {
    Image as ImageIcon,
    Video,
    Mic,
    Sparkles,
    Settings,
    Download
} from 'lucide-react';

export default function StudioLayout({
    generatedVideo,
    onGenerate,
    isGenerating
}) {
    const [activeTab, setActiveTab] = useState('video');
    const [prompt, setPrompt] = useState('');

    const tabs = [
        { id: 'image', label: 'Image', icon: ImageIcon },
        { id: 'video', label: 'Video', icon: Video },
        { id: 'audio', label: 'Audio', icon: Mic },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
            {/* Top Bar (Monitor Header) */}
            <div className="h-14 border-b border-gray-800/50 flex items-center px-8 justify-between bg-[#0a0a0a]/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-none bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                        {activeTab} Production Monitor
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-none">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none text-[10px] font-black uppercase tracking-widest transition-all">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>
            </div>

            {/* Área del Canvas (Central) */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-dot-white/[0.05] relative">
                <div className="relative w-full max-w-4xl aspect-video bg-black rounded-none overflow-hidden border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] group">
                    {generatedVideo ? (
                        <video
                            src={generatedVideo}
                            controls
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/10 blur-3xl" />
                                <div className="relative w-20 h-20 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-none flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                                    <Video className="w-8 h-8 text-gray-700 group-hover:text-blue-500/50 transition-colors" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em]">Ready for Generation</p>
                                <p className="text-gray-700 text-[10px] mt-2">Describe your shot to begin the production</p>
                            </div>
                        </div>
                    )}

                    {/* Monitor overlays */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-none text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            REC 00:00:00:00
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de Controles Inferior (Master Control) */}
            <div className="h-[200px] bg-[#121214] border-t border-gray-800 flex shrink-0">
                {/* Control Panel Buttons (Mode Selector) - SQUARE STYLE */}
                <div className="w-16 border-r border-white/5 flex flex-col items-center bg-[#0e0e10]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative w-full h-16 flex items-center justify-center transition-all duration-200 ${activeTab === tab.id
                                ? 'text-blue-400 bg-white/[0.03]'
                                : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.01]'
                                }`}
                            title={`${tab.label} Panel`}
                        >
                            <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {activeTab === tab.id && (
                                <div className="absolute left-0 w-[2px] h-full bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.3)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Área de Contenidos - Square Content */}
                <div className="flex-1 flex p-6 gap-8 overflow-hidden items-center">
                    {/* Sección Única de Entrada */}
                    <div className="flex-1 flex flex-col space-y-3 h-full justify-center">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                {activeTab} Engine Output Console
                            </label>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-blue-500/50" />
                                <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">
                                    System Ready
                                </span>
                            </div>
                        </div>
                        {/* Contenedor cuadrado */}
                        <div className="flex-1 bg-black/40 border border-gray-800 rounded-none flex items-center justify-center opacity-40">
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                                Initializing {activeTab} workspace...
                            </p>
                        </div>
                    </div>

                    {/* Panel de Estado simplificado - Square */}
                    <div className="w-64 flex flex-col justify-center h-full">
                        <button
                            disabled
                            className="bg-white/5 border border-white/10 rounded-none p-6 text-center group cursor-not-allowed"
                        >
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-gray-500 transition-colors mb-1">Status</p>
                            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{activeTab} STANDBY</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
