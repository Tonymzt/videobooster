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
    const [selectedMovement, setSelectedMovement] = useState('static');

    const tabs = [
        { id: 'image', label: 'Image', icon: ImageIcon },
        { id: 'video', label: 'Video', icon: Video },
        { id: 'audio', label: 'Audio', icon: Mic },
    ];

    const movements = [
        { id: 'static', label: 'Static', preview: 'Handheld shake' },
        { id: 'tracking', label: 'Tracking', preview: 'Follow subject' },
        { id: 'push_in', label: 'Push in', preview: 'Dolly forward' },
        { id: 'minimal', label: 'Minimal camera', preview: 'Subtle motion' },
        { id: 'orbit', label: 'Product orbit', preview: 'Circular motion' },
        { id: 'arc', label: 'Arc', preview: 'Curved path' },
    ];

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Panel izquierdo de controles (Full Height) */}
            <div className="w-96 bg-[#151515] border-r border-gray-800 flex flex-col h-full shrink-0">
                {/* Tabs integrados en la parte superior del panel */}
                <div className="flex items-center px-4 py-4 space-x-2 border-b border-gray-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center space-x-2 py-2.5 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Prompt Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Describe your shot
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Type your script to turn into audio..."
                            className="w-full h-40 bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                        />
                    </div>

                    {/* Motion Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Motion Control</label>
                            <div className="px-2 py-1 bg-gray-800 rounded text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                16:9 • 5s
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {movements.map((movement) => (
                                <button
                                    key={movement.id}
                                    onClick={() => setSelectedMovement(movement.id)}
                                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${selectedMovement === movement.id
                                        ? 'border-blue-500 ring-4 ring-blue-500/10'
                                        : 'border-gray-800 hover:border-gray-700'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-black/60 backdrop-blur-md">
                                        <p className="text-[10px] font-bold text-white uppercase tracking-tight">{movement.label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Action */}
                    <div className="pt-4">
                        <button
                            onClick={() => onGenerate({ prompt, movement: selectedMovement })}
                            disabled={isGenerating || !prompt}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800/50 disabled:text-gray-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 fill-white/20" />
                                    <span>Generate Video</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Área derecha (Top Bar + Canvas) */}
            <div className="flex-1 flex flex-col h-full bg-[#070708]">
                {/* Top Bar (Comienza después del panel) */}
                <div className="h-14 border-b border-gray-800/50 flex items-center px-8 justify-between bg-[#0a0a0a]/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                            {activeTab} Production Monitor
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Canvas central */}
                <div className="flex-1 flex items-center justify-center p-12 overflow-hidden bg-dot-white/[0.05]">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] group">
                        {generatedVideo ? (
                            <video
                                src={generatedVideo}
                                controls
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                    <div className="relative w-24 h-24 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                        <Video className="w-10 h-10 text-gray-700 group-hover:text-blue-500/50 transition-colors" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Ready for Generation</p>
                                    <p className="text-gray-700 text-xs mt-2">Describe your shot to begin the production</p>
                                </div>
                            </div>
                        )}

                        {/* Monitor overlays */}
                        <div className="absolute top-8 left-8 flex flex-col gap-2">
                            <div className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-full text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                REC 00:00:00:00
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
