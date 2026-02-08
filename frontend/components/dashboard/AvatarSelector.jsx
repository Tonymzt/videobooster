'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

const AVAILABLE_AVATARS = [
    {
        id: 'Abigail_expressive_2024112501',
        name: 'Abigail',
        gender: 'Femenino',
        style: 'Profesional',
        thumbnail: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/avatars/thumbnails/abigail_Thumbnail.png',
        videoUrl: 'https://pub-4b811ce121cb48039a24266a90866d0a.r2.dev/library/inspiration/videos/comercial_telefono.webm',
        description: 'Presencia ejecutiva ideal para hogar.'
    },
    {
        id: 'Wayne_20240711',
        name: 'Wayne',
        gender: 'Masculino',
        style: 'Moderno',
        thumbnail: 'https://files2.heygen.ai/avatar/v3/ebaccab497/full/2.2/preview.webp',
        videoUrl: 'https://www.keevx.com/backend-saas-cdn/cm-library/_63a64e4b6f/_63a64e4b6f.webm',
        description: 'Dinámico, perfecto para tecnología.'
    },
    {
        id: 'Yuna_expressive_20241202',
        name: 'Yuna',
        gender: 'Femenino',
        style: 'Casual',
        thumbnail: 'https://files2.heygen.ai/avatar/v3/3a69a4736f/full/2.2/preview.webp',
        videoUrl: 'https://www.keevx.com/backend-saas-cdn/cm-library/_63a64e4b6f/_63a64e4b6f.webm',
        description: 'Amigable, excelente para belleza.'
    },
    {
        id: 'Bryan_expressive_20241202',
        name: 'Bryan',
        gender: 'Masculino',
        style: 'Corporativo',
        thumbnail: 'https://files2.heygen.ai/avatar/v3/60655edbe2/full/2.2/preview.webp',
        videoUrl: 'https://www.keevx.com/backend-saas-cdn/cm-library/_63a64e4b6f/_63a64e4b6f.webm',
        description: 'Voz seria para servicios corporativos.'
    },
];

export default function AvatarSelector({ onAvatarSelected, selectedAvatar }) {
    const [hoveredAvatar, setHoveredAvatar] = useState(null);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {AVAILABLE_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar?.id === avatar.id;
                const isHovered = hoveredAvatar === avatar.id;

                return (
                    <div
                        key={avatar.id}
                        className={`
                            relative rounded-none overflow-hidden cursor-pointer
                            transition-all duration-300 bg-slate-900/50 group
                            ${isSelected
                                ? 'ring-2 ring-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-105 z-10'
                                : 'ring-1 ring-slate-800 hover:ring-pink-500/30'
                            }
                        `}
                        onClick={() => onAvatarSelected?.(avatar)}
                        onMouseEnter={() => setHoveredAvatar(avatar.id)}
                        onMouseLeave={() => setHoveredAvatar(null)}
                    >
                        <div className="aspect-[3/4] relative overflow-hidden bg-slate-950">
                            <img
                                src={avatar.thumbnail}
                                alt={avatar.name}
                                className={`
                                    w-full h-full object-cover transition-opacity duration-500
                                    ${isHovered ? 'opacity-0' : 'opacity-100'}
                                `}
                            />

                            {avatar.videoUrl && (
                                <video
                                    src={avatar.videoUrl}
                                    className={`
                                        absolute inset-0 w-full h-full object-cover transition-opacity duration-500
                                        ${isHovered ? 'opacity-100' : 'opacity-0'}
                                    `}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            )}

                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-pink-500 text-white rounded-none p-1 shadow-lg z-20">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/40 to-transparent">
                                <h4 className="text-sm font-bold text-white tracking-wide">{avatar.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">"{avatar.description}"</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
