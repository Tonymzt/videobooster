'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Video, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signIn(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="w-full max-w-md space-y-8 p-10 bg-[#0a0a0c]/80 backdrop-blur-2xl rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
            {/* Destello de fondo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-600/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="text-center space-y-3 relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-gradient-to-tr from-pink-600 to-rose-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-pink-600/40 rotate-3 group-hover:rotate-6 transition-transform duration-500">
                        <Video className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Bienvenido</h2>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Inicia sesión en VideoBooster</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {error && (
                    <div className="p-4 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in shake duration-300">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                        Email corporativo
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@negocio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-14 bg-white/5 border-white/5 rounded-2xl px-6 text-sm text-white placeholder:text-slate-600 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all shadow-inner"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Contraseña
                        </label>
                        <button type="button" className="text-[10px] font-bold text-pink-500 hover:text-pink-400">¿Olvidaste tu contraseña?</button>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="h-14 bg-white/5 border-white/5 rounded-2xl px-6 pr-14 text-sm text-white placeholder:text-slate-600 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all shadow-inner"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="pt-2 space-y-4">
                    <Button type="submit" className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-pink-600/20 transition-all active:scale-95 group" disabled={loading}>
                        {loading ? 'Sincronizando...' : 'Entrar al Dashboard'}
                        <Sparkles className="h-4 w-4 ml-2 group-hover:rotate-12 transition-transform" />
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-xs text-slate-500 font-medium tracking-tight">
                        ¿No tienes una cuenta propia?{' '}
                        <Link href="/signup" className="text-pink-500 font-bold hover:underline">
                            Crea una ahora
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
