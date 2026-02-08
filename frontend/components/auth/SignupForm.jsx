'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase/client'; // ✅ Import necesario
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Building2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupForm() {
    const { signUp } = useAuth();
    const router = useRouter();
    const [accountType, setAccountType] = useState('personal');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 1. 🛡️ SEGURIDAD TIPO GOOGLE: Validación Estricta
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
            setPassword(''); // 🧼 Limpiar campo para obligar a reescribir
            setIsLoading(false);
            return;
        }

        try {
            // 2. 🚀 Intentar registro
            await signUp(email, password, username, accountType);

            // 3. ⚡ DOUBLE TAP: Intentar iniciar sesión inmediatamente
            // Esto fuerza la entrada si 'Confirm Email' está desactivado en Supabase
            // pero signUp no devolvió la sesión por alguna razón.
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!loginError) {
                // Éxito: Login funcionó, vámonos
                router.push('/dashboard');
            } else {
                // Fallo: Supabase exige confirmación sí o sí, o hubo otro error
                console.log('Auto-login failed, showing confirmation screen', loginError);
                setSuccess(true);
            }

        } catch (err) {
            console.error('Signup error:', err);
            let msg = err.message;

            // Traducción de errores comunes de Supabase
            if (msg.includes('rate limit')) {
                msg = 'Demasiados intentos recientes. Por favor usa otro correo o espera un momento.';
            } else if (msg.includes('already registered')) {
                msg = 'Este correo ya está registrado.';
            }

            setError(msg || 'Error al crear cuenta');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. ✨ PANTALLA DE ÉXITO ENTERPRISE (Minimalista)
    if (success) {
        return (
            <div className="w-full max-w-md mx-auto relative z-10">
                <div className="bg-[#1a1a1e] p-8 rounded-none-[32px] shadow-2xl border border-white/5 text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-none flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <Mail className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Correo Enviado</h2>
                    <p className="text-slate-400 mb-6 text-xs">
                        Confirma tu acceso en <span className="text-emerald-400 font-medium">{email}</span>
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-10 text-xs font-bold uppercase tracking-wider">
                            Ir al Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto relative z-10">
            {/* 4. 🎨 DISEÑO DARK ENTERPRISE (Fondo Sólido) */}
            <div className="bg-[#1a1a1e] p-8 rounded-none-[32px] shadow-2xl border border-white/5">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-tr from-pink-600 to-rose-600 rounded-none flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                        Crear Cuenta
                    </h1>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                        Únete a VideoBooster
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">

                    {/* 5. 🏗️ LAYOUT ESTABLE: Tabs + Espacio Reservado */}
                    <div className="bg-black/20 p-1 rounded-none flex gap-1 mb-3 relative z-10">
                        <button
                            type="button"
                            onClick={() => setAccountType('personal')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer relative z-20 ${accountType === 'personal'
                                ? 'bg-[#2a2a30] text-white shadow-md border border-white/5'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            PERSONAL
                        </button>
                        <button
                            type="button"
                            onClick={() => setAccountType('business')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-none text-xs font-bold transition-all relative overflow-hidden cursor-pointer z-20 ${accountType === 'business'
                                ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 text-purple-200 shadow-md border border-purple-500/30'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            NEGOCIO
                            {accountType === 'business' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 pointer-events-none" />}
                        </button>
                    </div>

                    {/* Espacio reservado fijo (h-5) para evitar saltos. Opacity transition. */}
                    <div className="h-5 mb-5 flex items-center justify-center overflow-hidden">
                        <div className={`transition-all duration-300 transform ${accountType === 'business' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-none border border-purple-500/20 font-medium tracking-wide">
                                ✨ Habilita Facturación CFDI 4.0
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Usuario
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ej. TonyStark"
                                    required
                                    className="pl-11 h-12 bg-[#27272a] border-transparent focus:border-pink-500/50 text-white rounded-none placeholder:text-slate-600 font-medium transition-all focus:bg-[#27272a] focus:ring-0"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                {accountType === 'business' ? 'Email Corporativo' : 'Correo Electrónico'}
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setPassword(''); // 🧼 Seguridad: Limpiar password al cambiar email
                                    }}
                                    placeholder="nombre@empresa.com"
                                    required
                                    className="pl-11 h-12 bg-[#27272a] border-transparent focus:border-pink-500/50 text-white rounded-none placeholder:text-slate-600 font-medium transition-all focus:bg-[#27272a] focus:ring-0"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="pl-11 pr-10 h-12 bg-[#27272a] border-transparent focus:border-pink-500/50 text-white rounded-none placeholder:text-slate-600 font-medium transition-all focus:bg-[#27272a] focus:ring-0"
                                />
                                <button
                                    type="button"
                                    onMouseDown={() => setShowPassword(true)}
                                    onMouseUp={() => setShowPassword(false)}
                                    onMouseLeave={() => setShowPassword(false)}
                                    onTouchStart={() => setShowPassword(true)}
                                    onTouchEnd={() => setShowPassword(false)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1 cursor-pointer select-none"
                                    title="Mantén presionado para ver"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <Eye className="w-4 h-4 text-pink-500" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-none bg-red-500/10 border border-red-500/20 animate-in shake">
                            <p className="text-xs font-bold text-red-400 text-center">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold rounded-none shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98] uppercase tracking-wide text-xs"
                    >
                        {isLoading ? (
                            'Procesando...'
                        ) : (
                            <div className="flex items-center gap-2">
                                CREAR CUENTA
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        )}
                    </Button>

                    {/* Footer */}
                    <div className="text-center pt-2">
                        <p className="text-xs text-slate-500 font-medium">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-pink-500 hover:text-pink-400 font-bold hover:underline transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
