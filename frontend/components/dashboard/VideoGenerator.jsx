'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { generateVideo, getVideoStatus } from '@/lib/api';

const STATUS_LABELS = {
    pending: 'En cola',
    scraping: 'Extrayendo producto',
    scripting: 'Generando guion',
    generating_voice: 'Creando audio',
    rendering: 'Renderizando video',
    completed: 'Completado',
    failed: 'Error',
};

const STATUS_COLORS = {
    pending: 'bg-gray-500',
    scraping: 'bg-blue-500',
    scripting: 'bg-purple-500',
    generating_voice: 'bg-pink-500',
    rendering: 'bg-orange-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
};

export default function VideoGenerator({ onVideoComplete, preselectedImages, preselectedAvatar }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentJob, setCurrentJob] = useState(null);
    const [error, setError] = useState('');
    const { user } = useAuth();

    // Polling para actualizar el progreso
    useEffect(() => {
        if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') {
            return;
        }

        const interval = setInterval(async () => {
            const result = await getVideoStatus(currentJob.jobId);

            if (result.success) {
                setCurrentJob({
                    ...currentJob,
                    ...result.data,
                });

                // Si completó, notificar al padre
                if (result.data.status === 'completed') {
                    onVideoComplete?.();
                }
            }
        }, 3000); // Actualizar cada 3 segundos

        return () => clearInterval(interval);
    }, [currentJob, onVideoComplete]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setCurrentJob(null);

        try {
            const result = await generateVideo(url, user.id);

            if (result.success) {
                setCurrentJob({
                    jobId: result.data.jobId,
                    status: 'pending',
                    progress: 0,
                });
                setUrl(''); // Limpiar input
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Error al crear el video');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    La Caja Mágica
                </CardTitle>
                <CardDescription>
                    Pega la URL de un producto de Amazon o MercadoLibre
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Selección Actual del Dashboard */}
                {(preselectedImages?.length > 0 || preselectedAvatar) && (
                    <div className="flex flex-wrap gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        {preselectedAvatar && (
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-blue-600">
                                    Avatar: {preselectedAvatar.name}
                                </Badge>
                            </div>
                        )}
                        {preselectedImages?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-blue-300 text-blue-700">
                                    {preselectedImages.length} Imágenes seleccionadas
                                </Badge>
                            </div>
                        )}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-medium text-gray-700">
                            Paso 1: Pega la URL del producto (Amazon/MercadoLibre)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                placeholder="https://www.amazon.com.mx/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading || currentJob}
                                required
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                disabled={loading || currentJob || !url}
                                className="px-8 bg-black hover:bg-gray-800"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        ¡Generar Ahora!
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-start gap-2">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </form>

                {/* Progreso en tiempo real */}
                {currentJob && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {currentJob.status === 'completed' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : currentJob.status === 'failed' ? (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                )}
                                <span className="font-medium">
                                    {STATUS_LABELS[currentJob.status] || currentJob.status}
                                </span>
                            </div>
                            <Badge className={STATUS_COLORS[currentJob.status]}>
                                {currentJob.progress}%
                            </Badge>
                        </div>

                        <Progress value={currentJob.progress} className="h-2" />

                        <p className="text-sm text-gray-600">
                            Job ID: <code className="text-xs bg-white px-2 py-1 rounded">{currentJob.jobId}</code>
                        </p>

                        {/* Video completado */}
                        {currentJob.status === 'completed' && currentJob.videoUrl && (
                            <div className="space-y-3 pt-2 border-t">
                                <p className="text-sm font-medium text-green-600">
                                    ¡Video generado exitosamente! 🎉
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(currentJob.videoUrl, '_blank')}
                                        className="flex-1"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Ver Video
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setCurrentJob(null)}
                                        variant="default"
                                        className="flex-1"
                                    >
                                        Generar Otro
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {currentJob.status === 'failed' && (
                            <div className="pt-2 border-t">
                                <p className="text-sm text-red-600">
                                    {currentJob.error || 'Ocurrió un error al generar el video'}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentJob(null)}
                                    variant="outline"
                                    className="mt-2 w-full"
                                >
                                    Intentar de Nuevo
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
