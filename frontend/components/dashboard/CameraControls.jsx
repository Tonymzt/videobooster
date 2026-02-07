'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function CameraControls({ onChange, useBrain, onBrainToggle }) {
    const [movement, setMovement] = useState('static');
    const [shotType, setShotType] = useState('medium');
    const [angle, setAngle] = useState('eye_level');

    const handleChange = (key, value) => {
        const newConfig = {
            cameraMove: key === 'movement' ? value : movement,
            shotType: key === 'shotType' ? value : shotType,
            cameraAngle: key === 'angle' ? value : angle,
        };

        if (key === 'movement') setMovement(value);
        if (key === 'shotType') setShotType(value);
        if (key === 'angle') setAngle(value);

        onChange(newConfig);
    };

    return (
        <div className="space-y-6 p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
            {/* Toggle IA Magic */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Cámara Cinematográfica</h3>
                <button
                    type="button"
                    onClick={onBrainToggle}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-all
            ${useBrain
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }
          `}
                >
                    <Sparkles className="w-4 h-4" />
                    {useBrain ? 'IA Activa' : 'IA Magic'}
                </button>
            </div>

            {/* Movimiento de Cámara */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Movimiento de Cámara
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { id: 'static', label: 'Plano estático' },
                        { id: 'dolly_in', label: 'Dolly in' },
                        { id: 'dolly_out', label: 'Dolly Out' },
                        { id: 'pan_left', label: 'Pan izquierda' },
                        { id: 'pan_right', label: 'Pan derecha' },
                        { id: 'orbit', label: 'Órbita' },
                        { id: 'tilt_up', label: 'Tilt arriba' },
                        { id: 'tilt_down', label: 'Tilt abajo' },
                    ].map((option) => (
                        <button
                            type="button"
                            key={option.id}
                            onClick={() => handleChange('movement', option.id)}
                            className={`
                p-4 rounded-xl border-2 transition-all text-sm
                ${movement === option.id
                                    ? 'border-pink-500 bg-pink-500/10 text-white'
                                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                                }
              `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tipo de Plano */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Tipo de Plano
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { id: 'long', label: 'Plano largo' },
                        { id: 'medium', label: 'Plano medio' },
                        { id: 'close', label: 'Primer plano' },
                        { id: 'first_plane', label: 'Primerísimo P.P.' },
                        { id: 'very_close', label: 'Plano detalle' },
                    ].map((option) => (
                        <button
                            type="button"
                            key={option.id}
                            onClick={() => handleChange('shotType', option.id)}
                            className={`
                p-3 rounded-xl border-2 transition-all text-sm
                ${shotType === option.id
                                    ? 'border-pink-500 bg-pink-500/10 text-white'
                                    : 'border-gray-700 bg-gray-800/50 text-gray-400'
                                }
              `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ángulo */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                    Ángulo
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { id: 'eye_level', label: 'Nivel del ojo' },
                        { id: 'high', label: 'Picado (High)' },
                        { id: 'low', label: 'Contrapicado (Low)' },
                        { id: 'bird', label: 'Vista de pájaro' },
                    ].map((option) => (
                        <button
                            type="button"
                            key={option.id}
                            onClick={() => handleChange('angle', option.id)}
                            className={`
                p-3 rounded-xl border-2 transition-all text-sm
                ${angle === option.id
                                    ? 'border-pink-500 bg-pink-500/10 text-white'
                                    : 'border-gray-700 bg-gray-800/50 text-gray-400'
                                }
              `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {useBrain && (
                <div className="mt-4 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg">
                    <p className="text-sm text-pink-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        IA generará prompt cinematográfico optimizado automáticamente
                    </p>
                </div>
            )}
        </div>
    );
}
