'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, Video, Sparkles, FolderIcon, Mic2, Settings } from 'lucide-react';
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog';

export default function DashboardLayout({ children }) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isEditor = pathname === '/dashboard/editor';

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#070708]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Crear Video', href: '/dashboard/editor', icon: Sparkles },
        { label: 'Mis creaciones', href: '/dashboard/gallery', icon: FolderIcon },
        { label: 'Avatares', href: '/dashboard/avatars', icon: Mic2 },
    ];

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#070708] text-slate-300 font-sans selection:bg-pink-500/30 overflow-hidden">

            {/* 📱 MOBILE HEADER */}
            {!isEditor && (
                <header className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0c] border-b border-white/5 z-30">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-pink-600 rounded-lg flex items-center justify-center">
                            <Video className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-lg text-white">Booster</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/5"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <LayoutDashboard className="h-6 w-6" />
                    </Button>
                </header>
            )}

            {/* 🟦 MAIN CONTENT (Flex child 1) */}
            <main className="flex-1 overflow-hidden relative flex flex-col h-full bg-[#070708] md:order-1">
                {children}
            </main>

            {/* ➡ SIDEBAR DERECHO (Flex child 2) */}
            <aside className={`
                fixed md:relative z-40 h-full bg-[#0a0a0c] border-l border-white/10 transition-all duration-300 ease-in-out flex flex-col md:order-2
                ${isMobileMenuOpen
                    ? 'w-64 translate-x-0 right-0'
                    : 'w-0 md:w-20 -right-64 md:right-0 md:translate-x-0'
                }
            `}>

                {/* Logo Area (Desktop - Icon Only) */}
                <div className="p-4 shrink-0 hidden md:flex md:justify-center">
                    <div className="h-10 w-10 bg-gradient-to-tr from-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Video className="h-5 w-5 text-white" />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 mt-4 md:mt-0 space-y-2 overflow-y-auto no-scrollbar flex flex-col items-center">
                    {/* Mobile Label */}
                    <div className="md:hidden w-full pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Principal
                    </div>

                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="w-full md:w-auto flex justify-center">
                                <div
                                    className={`
                                        flex items-center gap-3 px-3 py-3 rounded-xl transition-all group mb-1 
                                        md:justify-center md:w-12 md:h-12 md:p-0
                                        ${isActive ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'}
                                    `}
                                    title={item.label} // Tooltip simple
                                >
                                    <Icon className="h-5 w-5" />
                                    {/* Mostrar texto solo en móvil (w-64 state) */}
                                    <span className={`text-sm font-medium ${isMobileMenuOpen ? 'block' : 'md:hidden'}`}>{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Area */}
                <div className="p-4 border-t border-white/5 bg-[#0d0d0f]/50 shrink-0 space-y-3 flex flex-col items-center">
                    <div className="flex items-center gap-3 px-2 md:px-0 md:justify-center w-full">
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 text-xs font-bold shrink-0">
                            {user.email[0].toUpperCase()}
                        </div>

                        {/* Texto visible solo en móvil */}
                        <div className={`flex-1 min-w-0 ${isMobileMenuOpen ? 'block' : 'md:hidden'}`}>
                            <p className="text-xs font-bold text-white truncate">
                                {user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">Plan Pro ✨</p>
                        </div>

                        <Link href="/dashboard/settings" className={`p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white ${isMobileMenuOpen ? 'block' : 'md:hidden'}`}>
                            <Settings className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* Botón Logout Compacto */}
                    <button
                        onClick={() => signOut()}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all md:justify-center`}
                        title="Cerrar Sesión"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className={`${isMobileMenuOpen ? 'block' : 'md:hidden'}`}>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Overlay para cerrar menú móvil */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
