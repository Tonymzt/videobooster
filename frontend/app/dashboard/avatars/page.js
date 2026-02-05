'use client';

import { useState } from 'react';
import {
    Mic2,
    Search,
    Filter,
    Sparkles,
    Users,
    Info,
    Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AvatarSelector from '@/components/dashboard/AvatarSelector';

export default function AvatarsPage() {
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    return (
        <div className="h-full overflow-y-auto bg-[#070708] p-10 custom-scrollbar animate-in fade-in duration-700">

            {/* 🛠 BARRA DE HERRAMIENTAS DE AVATARES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Users className="h-8 w-8 text-pink-500" />
                        Catálogo de Avatares
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Elige el presentador perfecto para tu marca y producto.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                        <Input
                            placeholder="Buscar nombre o estilo..."
                            className="bg-white/5 border-white/10 rounded-xl pl-10 w-[200px] md:w-[300px] text-xs focus:ring-pink-500/50"
                        />
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
                        Estilo
                    </Button>
                </div>
            </div>

            {/* 🎭 SELECTOR DE AVATARES PREMIUM */}
            <div className="space-y-10">
                <div className="bg-pink-600/5 border border-pink-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <Badge className="bg-pink-600 text-white border-0 font-bold uppercase tracking-wider text-[10px]">Recomendado</Badge>
                        <h3 className="text-2xl font-black text-white">Abigail 3.0 Expressive</h3>
                        <p className="text-slate-400 text-sm max-w-lg">
                            Nuestra presentadora más avanzada con micro-expresiones mejoradas y sincronización labial de ultra alta fidelidad. Ideal para videos de lujo y tecnología.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-slate-400">4K Ready</Badge>
                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-slate-400">Lip-Sync Pro</Badge>
                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-slate-400">Multi-Idioma</Badge>
                        </div>
                    </div>
                    <div className="w-48 h-64 rounded-2xl overflow-hidden ring-4 ring-pink-500/30">
                        <img src="https://files2.heygen.ai/avatar/v3/96da466668/full/2.2/preview.webp" className="w-full h-full object-cover" alt="Featured Avatar" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <AvatarSelector
                        selectedAvatar={selectedAvatar}
                        onAvatarSelected={setSelectedAvatar}
                    />
                </div>
            </div>

            {/* 💡 FOOTER INFO */}
            <div className="mt-16 p-6 bg-[#0f0f12] rounded-3xl border border-white/5 flex items-center gap-6">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Info className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">¿Necesitas un Avatar Personalizado?</h4>
                    <p className="text-xs text-slate-500 mt-1">Podemos clonar tu propia cara y voz para que seas tú quien presente tus productos. Contacta con soporte para el Plan Enterprise.</p>
                </div>
                <Button className="ml-auto bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl">
                    Más información
                </Button>
            </div>
        </div>
    );
}
