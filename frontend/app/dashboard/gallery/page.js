'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { getUserVideos } from '@/lib/api';
import VideoGallery from '@/components/dashboard/VideoGallery';
import { Loader2 } from 'lucide-react';

export default function GalleryPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadVideos() {
            if (!user) return;

            try {
                const { data, success } = await getUserVideos(supabase, user.id);
                if (success) {
                    // Mapeamos los datos de Supabase al formato que espera nuestro componente visual premium
                    const formattedVideos = data.map(v => ({
                        id: v.id,
                        title: v.product_data?.title || 'Video Sin Título',
                        date: new Date(v.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                        duration: '0:15', // Placeholder si no viene del server
                        status: v.status === 'completed' ? 'ready' : (v.status === 'failed' ? 'failed' : 'processing'),
                        thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=700&fit=crop',
                        videoUrl: v.video_url
                    }));
                    setVideos(formattedVideos);
                }
            } catch (error) {
                console.error("Error cargando videos:", error);
            }
            setLoading(false);
        }

        loadVideos();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando tu bóveda...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#070708] p-10 custom-scrollbar">
            <VideoGallery videos={videos} />
        </div>
    );
}
