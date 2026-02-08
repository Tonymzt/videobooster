'use client';

import { useState } from 'react';
import RunwayLayout from '@/components/editor/RunwayLayout';

export default function EditorPage() {
    const [generatedVideo, setGeneratedVideo] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async ({ prompt, movement }) => {
        setIsGenerating(true);

        try {
            const response = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    cameraMove: movement,
                    model: 'minimax',
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Poll for completion
                // TODO: Implementar polling
                console.log('Video job started:', data.jobId);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <RunwayLayout
            generatedVideo={generatedVideo}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
        />
    );
}
