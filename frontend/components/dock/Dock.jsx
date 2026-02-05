'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DockPrompt from './sections/DockPrompt';
import DockModel from './sections/DockModel';
import DockCamera from './sections/DockCamera';
import DockAudio from './sections/DockAudio';
import DockSettings from './sections/DockSettings';
import DockAction from './sections/DockAction';

export default function Dock({
    videoDescription,
    setVideoDescription,
    selectedModel,
    setSelectedModel,
    selectedCameraMove,
    setSelectedCameraMove,
    selectedShotType,
    setSelectedShotType,
    selectedCameraAngle,
    setSelectedCameraAngle,
    audioEnabled,
    setAudioEnabled,
    dubbingText,
    setDubbingText,
    selectedDuration,
    setSelectedDuration,
    selectedQuality,
    setSelectedQuality,
    selectedFormat,
    setSelectedFormat,
    videoCount,
    setVideoCount,
    onGenerate,
    isGenerating,
    progress,
    status,
    referenceImages,
    setReferenceImages,
}) {
    const [expandedSection, setExpandedSection] = useState(null);

    return (
        <>
            <AnimatePresence>
                {expandedSection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                        onClick={() => setExpandedSection(null)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[95vw]"
            >
                <div className="relative rounded-3xl bg-[#161925]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#1e2231] flex flex-col">
                    {isGenerating && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ec4899] to-[#db2777] overflow-hidden">
                            <motion.div
                                className="h-full bg-white/40"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-1 p-2">
                        <DockPrompt
                            value={videoDescription}
                            onChange={setVideoDescription}
                            isExpanded={expandedSection === 'prompt'}
                            onToggle={() => setExpandedSection(expandedSection === 'prompt' ? null : 'prompt')}
                            referenceImages={referenceImages}
                            onImagesChange={setReferenceImages}
                        />

                        <div className="h-8 w-px bg-[#1e2231] mx-1" />

                        <DockModel
                            selected={selectedModel}
                            onChange={setSelectedModel}
                            isExpanded={expandedSection === 'model'}
                            onToggle={() => setExpandedSection(expandedSection === 'model' ? null : 'model')}
                        />

                        <DockCamera
                            cameraMove={selectedCameraMove}
                            shotType={selectedShotType}
                            cameraAngle={selectedCameraAngle}
                            onCameraMoveChange={setSelectedCameraMove}
                            onShotTypeChange={setSelectedShotType}
                            onCameraAngleChange={setSelectedCameraAngle}
                            isExpanded={expandedSection === 'camera'}
                            onToggle={() => setExpandedSection(expandedSection === 'camera' ? null : 'camera')}
                        />

                        <DockAudio
                            enabled={audioEnabled}
                            text={dubbingText}
                            onEnabledChange={setAudioEnabled}
                            onTextChange={setDubbingText}
                            isExpanded={expandedSection === 'audio'}
                            onToggle={() => setExpandedSection(expandedSection === 'audio' ? null : 'audio')}
                        />

                        <div className="h-8 w-px bg-[#1e2231] mx-1" />

                        <DockSettings
                            duration={selectedDuration}
                            quality={selectedQuality}
                            format={selectedFormat}
                            count={videoCount}
                            onDurationChange={setSelectedDuration}
                            onQualityChange={setSelectedQuality}
                            onFormatChange={setSelectedFormat}
                            onCountChange={setVideoCount}
                            isExpanded={expandedSection === 'settings'}
                            onToggle={() => setExpandedSection(expandedSection === 'settings' ? null : 'settings')}
                        />

                        <div className="h-8 w-px bg-[#1e2231] mx-1" />

                        <DockAction
                            onGenerate={onGenerate}
                            isGenerating={isGenerating}
                            disabled={!videoDescription?.trim()}
                        />
                    </div>

                    {isGenerating && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="border-t border-[#1e2231] px-4 py-2 bg-black/20"
                        >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] animate-pulse" />
                                    <span className="text-[#a0a8c0] uppercase tracking-widest text-[9px]">
                                        {status || 'Procesando...'}
                                    </span>
                                </div>
                                <span className="text-white">
                                    {progress}%
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
