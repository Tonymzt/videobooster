'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function ChangePasswordDialog({ trigger }) {
    const [open, setOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { updatePassword, signOut } = useAuth();

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // 1. Validar coincidencia (Si falla: MOSTRAR contraseñas y marcar rojo)
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            setShowPassword(true);
            setShowConfirmPassword(true);
            setLoading(false);
            return;
        }

        // 2. Validar fortaleza (Si falla: BORRAR campos y marcar rojo)
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecialChar = /[\W_]/.test(newPassword);
        const minLength = newPassword.length >= 8;

        if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            setMessage({
                type: 'error',
                text: 'Contraseña débil: Usa 8+ caracteres, mayúscula, minúscula, número y símbolo.'
            });
            setNewPassword('');
            setConfirmPassword('');
            setLoading(false);
            return;
        }

        try {
            await updatePassword(newPassword);

            setMessage({ type: 'success', text: '¡Contraseña actualizada! Cerrando sesión...' });
            setTimeout(() => {
                setOpen(false);
                setNewPassword('');
                setConfirmPassword('');
                setMessage({ type: '', text: '' });
                signOut();
            }, 2000);

        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.message || 'Error al actualizar' });
            setLoading(false);
        }
    };

    const inputErrorClass = message.type === 'error'
        ? 'border-red-500/50 focus:ring-red-500/20 bg-red-500/5'
        : 'border-white/5 focus:ring-pink-500/50 bg-white/5';

    return (
        <>
            {/* Trigger (El botón que abre el modal) */}
            <div onClick={() => setOpen(true)} className="cursor-pointer">
                {trigger}
            </div>

            {/* Modal Overlay */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Modal Content */}
                    <div className="w-full max-w-sm bg-[#0a0a0c] border border-white/10 rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">

                        {/* Close Button */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-pink-500/10 rounded-none">
                                    <Lock className="h-5 w-5 text-pink-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white">Cambiar Contraseña</h2>
                            </div>
                            <p className="text-sm text-slate-400 mb-6">
                                Ingresa tu nueva contraseña segura.
                            </p>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                {message.text && (
                                    <div className={`p-3 rounded-none text-xs font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="relative group">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Nueva contraseña"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`text-white h-12 px-4 rounded-none transition-all border ${inputErrorClass}`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    <div className="relative group">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirmar contraseña"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`text-white h-12 px-4 rounded-none transition-all border ${inputErrorClass}`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" disabled={loading} className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-none shadow-lg shadow-pink-600/20 transition-all active:scale-95">
                                        {loading ? 'Actualizando...' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
