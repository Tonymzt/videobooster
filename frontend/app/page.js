import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, Zap, TrendingUp, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070708] text-white font-sans selection:bg-pink-500/30 overflow-hidden">

      {/* 🌌 FONDO DE GRADIENTES DINÁMICOS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 🧭 NAVIGATION BAR */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-600/20">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter">VideoBooster</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Funciones</a>
          <a href="#pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Precios</a>
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 px-6">Iniciar Sesión</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold px-8 shadow-lg shadow-pink-600/20 transition-all active:scale-95">Empieza Gratis</Button>
          </Link>
        </div>
      </nav>

      {/* 🚀 HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-40 max-w-5xl mx-auto space-y-12">
        <div className="space-y-6">
          <Badge className="bg-pink-600/10 text-pink-500 border-pink-500/20 py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="h-3 w-3 mr-2" /> VANGUARDIA IA 3.2
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-white animate-in slide-in-from-bottom-8 duration-700">
            Crea comerciales <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">que venden</span> en segundos.
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed animate-in slide-in-from-bottom-12 duration-1000">
            Convierte cualquier producto en videos virales de alto impacto para TikTok y Reels.
            Sin cámaras, sin editores, solo magia artificial.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-4 animate-in zoom-in-95 duration-1000">
          <Link href="/signup">
            <Button className="bg-pink-600 hover:bg-pink-500 text-white h-16 px-10 rounded-2xl text-lg font-black shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-all hover:scale-105 active:scale-95">
              Crear mi primer video
            </Button>
          </Link>
          <Button variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl">
            <PlayCircle className="h-5 w-5 mr-3" /> Ver Demo
          </Button>
        </div>

        {/* MOCKUP PREVIEW */}
        <div className="pt-20 relative animate-in slide-in-from-bottom-20 duration-1000">
          <div className="absolute inset-0 bg-pink-500/20 rounded-[40px] blur-[120px] -z-10" />
          <div className="bg-[#0f0f12] border border-white/10 rounded-[40px] p-4 shadow-2xl relative">
            <div className="aspect-video w-full max-w-4xl bg-black rounded-[32px] overflow-hidden flex items-center justify-center">
              <PlayCircle className="h-16 w-16 text-pink-500/20" />
            </div>
            {/* Floating elements */}
            <div className="absolute -top-10 -right-10 bg-[#1a1a1e] border border-pink-500/30 p-4 rounded-2xl shadow-2xl animate-bounce duration-[3000ms]">
              <TrendingUp className="h-6 w-6 text-pink-500" />
            </div>
          </div>
        </div>
      </main>

      {/* 📊 STATS / PROOF */}
      <section className="relative z-10 border-t border-white/5 bg-[#0a0a0c]/50 backdrop-blur-xl py-24">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-white">+500k</h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Videos Generados</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-white">10x</h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Mayor Engagement</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-white">0s</h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Curva de Aprendizaje</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-12 px-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-600 text-sm font-medium">VideoBooster © {new Date().getFullYear()} — El futuro del e-commerce.</p>
        <div className="flex gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Términos</a>
          <a href="#" className="hover:text-white transition-colors">Contacto</a>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}
