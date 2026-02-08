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

export default function RunwayLayout({
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
        <div className="flex h-screen bg-[#0a0a0a] text-white">
            {/* Sidebar izquierdo */}
            <div className="w-16 bg-[#151515] border-r border-gray-800 flex flex-col items-center py-4 space-y-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
                    VB
                </div>
                {/* Íconos de navegación */}
            </div>

            {/* Área principal */}
            <div className="flex-1 flex flex-col">
                {/* Tabs superiores */}
                <div className="h-14 bg-[#0a0a0a] border-b border-gray-800 flex items-center px-6 space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Canvas + Panel derecho */}
                <div className="flex-1 flex">
                    {/* Canvas central */}
                    <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a]">
                        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                            {generatedVideo ? (
                                <video
                                    src={generatedVideo}
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                                            <Video className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400">Your video will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel derecho de controles */}
                    <div className="w-96 bg-[#151515] border-l border-gray-800 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Prompt */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Describe your shot
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Type your script to turn into audio."
                                    className="w-full h-32 bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Motion */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-300">Motion</label>
                                    <button className="text-xs text-gray-400 hover:text-white">
                                        16:9 • 5s
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {movements.map((movement) => (
                                        <button
                                            key={movement.id}
                                            onClick={() => setSelectedMovement(movement.id)}
                                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedMovement === movement.id
                                                    ? 'border-blue-500'
                                                    : 'border-gray-800 hover:border-gray-700'
                                                }`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 backdrop-blur-sm">
                                                <p className="text-xs font-medium text-white">{movement.label}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate button */}
                            <button
                                onClick={() => onGenerate({ prompt, movement: selectedMovement })}
                                disabled={isGenerating || !prompt}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-all"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Generate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
