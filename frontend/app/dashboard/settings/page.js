'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    User,
    Building2,
    FileText,
    MapPin,
    Save,
    ArrowUpRight,
    CheckCircle2,
    Lock,
    Edit3,
    X,
    RotateCcw
} from 'lucide-react';

export default function SettingsPage() {
    const [profile, setProfile] = useState(null);
    const [regimenesFiscales, setRegimenesFiscales] = useState([]);
    const [usosCfdi, setUsosCfdi] = useState([]); // Nuevo catálogo
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [isEditingFiscal, setIsEditingFiscal] = useState(false); // 🔒 Estado de seguridad fiscal

    // Form data
    const [formData, setFormData] = useState({
        full_name: '',
        rfc: '',
        razon_social: '',
        regimen_fiscal: '',
        uso_cfdi: '', // Nuevo campo
        direccion_fiscal: {
            calle: '',
            numero: '',
            colonia: '',
            ciudad: '',
            estado: '',
            cp: ''
        }
    });

    // const supabase = createClientComponentClient(); // Removed

    useEffect(() => {
        loadProfile();
        loadCatalogos();
    }, []);

    const loadCatalogos = async () => {
        try {
            const [regimenes, usos] = await Promise.all([
                supabase.from('sat_regimenes_fiscales').select('*').eq('activo', true).order('clave'),
                supabase.from('sat_uso_cfdi').select('*').eq('activo', true).order('clave')
            ]);

            if (regimenes.data) setRegimenesFiscales(regimenes.data);
            if (usos.data) setUsosCfdi(usos.data);

        } catch (error) {
            console.error('Error cargando catálogos:', error);
        }
    };

    const loadProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // 🛡️ CAPA 4: Llamada a API Segura en lugar de Query directo
            const response = await fetch('/api/settings/fiscal', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await response.json();

            if (!data.success) throw new Error(data.error);

            const profileData = data.data; // El nuevo API devuelve { success: true, data: {...} }
            setProfile({ ...profileData, full_name: profileData.full_name || '' });
            setFormData({
                full_name: profileData.full_name || '',
                rfc: profileData.rfc || '',
                razon_social: profileData.razon_social || '',
                regimen_fiscal: profileData.regimen_fiscal || '',
                uso_cfdi: profileData.uso_cfdi || 'G03',
                direccion_fiscal: profileData.direccion_fiscal || {
                    calle: '',
                    numero: '',
                    colonia: '',
                    ciudad: '',
                    estado: '',
                    cp: ''
                }
            });

            if (profileData.account_type === 'personal') {
                setShowUpgradePrompt(true);
            }

            if (profileData.fiscal_data_completed) {
                setIsEditingFiscal(false);
            } else if (profileData.account_type === 'business') {
                setIsEditingFiscal(true);
            }

        } catch (error) {
            console.error('Error cargando perfil seguro:', error);
            showNotification('error', 'Error de conexión segura');
        } finally {
            setIsLoading(false);
        }
    };

    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

    // Helpers
    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const validateRFC = (rfc) => {
        const regex = /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{3})$/;
        return regex.test(rfc);
    };

    const handleUpgradeToBusiness = async () => {
        if (!confirm('¿Deseas convertir tu cuenta a Negocio? Esto habilitará funciones empresariales y facturación.')) {
            return;
        }

        try {
            setIsSaving(true);
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('profiles')
                .update({
                    account_type: 'business',
                    fiscal_data_completed: false
                })
                .eq('id', user.id);

            if (error) throw error;

            await loadProfile();
            setShowUpgradePrompt(false);
            showNotification('success', '✅ Cuenta actualizada a Negocio');

        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'Error al actualizar cuenta');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const updates = {
                full_name: formData.full_name,
            };

            if (profile.account_type === 'business') {
                const rfcLimpio = formData.rfc.toUpperCase().trim();

                if (!validateRFC(rfcLimpio)) {
                    showNotification('error', 'El RFC no es válido');
                    setIsSaving(false); return;
                }

                if (!formData.direccion_fiscal.cp || formData.direccion_fiscal.cp.length !== 5) {
                    showNotification('error', 'El Código Postal es obligatorio (5 dígitos)');
                    setIsSaving(false); return;
                }

                updates.rfc = rfcLimpio;
                updates.razon_social = formData.razon_social;
                updates.regimen_fiscal = formData.regimen_fiscal;
                updates.uso_cfdi = formData.uso_cfdi;
                updates.direccion_fiscal = formData.direccion_fiscal;

                // Cálculo de completitud
                updates.fiscal_data_completed = Boolean(
                    rfcLimpio &&
                    formData.razon_social &&
                    formData.regimen_fiscal &&
                    formData.uso_cfdi &&
                    formData.direccion_fiscal.cp
                );
            }

            // 🛡️ CAPA 4: Guardado seguro vía API
            const response = await fetch('/api/settings/fiscal', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(updates)
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            showNotification('success', 'Configuración guardada bajo encriptación');
            if (profile.account_type === 'business') setIsEditingFiscal(false);

            await loadProfile();

        } catch (error) {
            console.error('Error guardando seguro:', error);
            showNotification('error', 'Error al guardar (Cifrado fallido)');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelFiscal = () => {
        if (!profile) return;

        // Revertir solo los campos fiscales
        setFormData(prev => ({
            ...prev,
            rfc: profile.rfc || '',
            razon_social: profile.razon_social || '',
            regimen_fiscal: profile.regimen_fiscal || '',
            uso_cfdi: profile.uso_cfdi || 'G03',
            direccion_fiscal: profile.direccion_fiscal || {
                calle: '',
                numero: '',
                colonia: '',
                ciudad: '',
                estado: '',
                cp: ''
            }
        }));
        setIsEditingFiscal(false);
    };

    const hasChanges = () => {
        if (!profile) return false;

        const basicChanges = formData.full_name !== (profile.full_name || '');

        if (profile.account_type === 'personal') return basicChanges;

        const fiscalChanges =
            formData.rfc !== (profile.rfc || '') ||
            formData.razon_social !== (profile.razon_social || '') ||
            formData.regimen_fiscal !== (profile.regimen_fiscal || '') ||
            formData.uso_cfdi !== (profile.uso_cfdi || 'G03') ||
            JSON.stringify(formData.direccion_fiscal) !== JSON.stringify(profile.direccion_fiscal || {});

        return basicChanges || fiscalChanges;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#07080c]">
                <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-none" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#07080c] text-white p-8 animate-in fade-in duration-500 custom-scrollbar relative">

            {/* 🚨 MODAL ALERT (Central) */}
            {notification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1e] border border-white/10 rounded-none shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">

                        {/* Status Bar Superior */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                            }`} />

                        <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-none flex items-center justify-center mb-4 ${notification.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                }`}>
                                {notification.type === 'success'
                                    ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    : <div className="w-6 h-6 rounded-none border-2 border-red-500 flex items-center justify-center"><span className="text-sm font-bold text-red-500">!</span></div>
                                }
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">
                                {notification.type === 'success' ? '¡Éxito!' : 'Atención'}
                            </h3>

                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                {notification.message}
                            </p>

                            <Button
                                onClick={() => setNotification(null)}
                                className={`w-full font-bold h-10 ${notification.type === 'success'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-red-600 hover:bg-red-500 text-white'
                                    }`}
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto pb-24">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Configuración</h1>
                    <p className="text-gray-400">
                        Administra tu perfil y datos de facturación
                    </p>
                </div>

                {/* Account Type Badge */}
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-none bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    {profile?.account_type === 'business' ? (
                        <>
                            <Building2 className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-semibold text-pink-500">Cuenta Negocio</span>
                        </>
                    ) : (
                        <>
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-400">Cuenta Personal</span>
                        </>
                    )}
                </div>

                {/* Upgrade Prompt (Solo para Personal) */}
                {showUpgradePrompt && profile?.account_type === 'personal' && (
                    <div className="mb-8 p-6 rounded-none bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/20 shadow-lg shadow-purple-900/10">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-none bg-pink-500/10">
                                <Building2 className="w-6 h-6 text-pink-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold mb-1 text-white">
                                    Desbloquea funciones empresariales
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Convierte tu cuenta a Negocio para acceder a facturación CFDI 4.0,
                                    branding personalizado y más créditos.
                                </p>
                                <Button
                                    onClick={handleUpgradeToBusiness}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold shadow-lg shadow-pink-500/20"
                                >
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    Convertir a Negocio
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Información General */}
                    <section className="p-6 rounded-none bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                            <User className="w-5 h-5 text-pink-500" />
                            Información General
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nombre completo
                                </label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Juan Pérez"
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-pink-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <Input
                                    value={profile?.email || ''}
                                    disabled
                                    className="bg-gray-900/50 border-gray-800 text-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-600">
                                    El email no se puede cambiar por seguridad.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Datos Fiscales (Solo Business) */}
                    {profile?.account_type === 'business' && (
                        <section className="p-6 rounded-none bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm animate-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <FileText className="w-5 h-5 text-pink-500" />
                                    Datos Fiscales
                                </h2>
                                <div className="flex items-center gap-3">
                                    {profile?.fiscal_data_completed && (
                                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-none border border-emerald-500/20">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Completo
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => {
                                            if (isEditingFiscal) {
                                                handleCancelFiscal();
                                            } else {
                                                setIsEditingFiscal(true);
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className={`h-8 border-gray-700 bg-gray-800/50 hover:bg-gray-700 text-xs font-medium transition-all ${isEditingFiscal ? 'text-red-400 border-red-500/30' : 'text-gray-400'
                                            }`}
                                    >
                                        {isEditingFiscal ? (
                                            <><X className="w-3.5 h-3.5 mr-1.5" /> Cancelar</>
                                        ) : (
                                            <><Edit3 className="w-3.5 h-3.5 mr-1.5" /> Editar</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 mb-6 bg-blue-500/5 border border-blue-500/10 p-3 rounded-none">
                                ℹ️ Estos datos son necesarios para emitir tus facturas CFDI 4.0 según las normas del SAT.
                            </p>

                            <div className="space-y-4">
                                {/* FILA 1: RFC + Razón Social */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">RFC *</label>
                                        <Input
                                            value={formData.rfc}
                                            onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                            placeholder="XAXX010101000"
                                            maxLength={13}
                                            disabled={!isEditingFiscal}
                                            className={`bg-gray-800/50 border-gray-700 uppercase text-white font-mono placeholder:text-gray-600 focus:border-pink-500/50 transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Razón Social *</label>
                                        <Input
                                            value={formData.razon_social}
                                            onChange={(e) => setFormData({ ...formData, razon_social: e.target.value.toUpperCase() })}
                                            placeholder="MI EMPRESA (Sin SA de CV)"
                                            disabled={!isEditingFiscal}
                                            className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-pink-500/50 uppercase transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Tal cual viene en tu constancia, sin 'SA DE CV', etc.</p>
                                    </div>
                                </div>

                                {/* FILA 2: Régimen + Uso CFDI */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Régimen Fiscal *</label>
                                        <select
                                            value={formData.regimen_fiscal}
                                            onChange={(e) => setFormData({ ...formData, regimen_fiscal: e.target.value })}
                                            disabled={!isEditingFiscal}
                                            className={`w-full px-4 py-3 rounded-none bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 appearance-none text-sm transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                        >
                                            <option value="" className="bg-gray-900 text-gray-500">Seleccionar...</option>
                                            {regimenesFiscales.map((reg) => (
                                                <option key={reg.id} value={reg.clave} className="bg-gray-900">
                                                    [{reg.clave}] {reg.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Uso de CFDI *</label>
                                        <div className="space-y-2">
                                            <select
                                                value={formData.uso_cfdi || 'G03'}
                                                onChange={(e) => setFormData({ ...formData, uso_cfdi: e.target.value })}
                                                disabled={!isEditingFiscal}
                                                className={`w-full px-4 py-3 rounded-none bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 appearance-none text-sm transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            >
                                                {/* Fallback si está cargando */}
                                                {!usosCfdi.length && <option value="G03">G03 - Gastos en general</option>}

                                                {usosCfdi.map((uso) => (
                                                    <option key={uso.id} value={uso.clave} className="bg-gray-900">
                                                        [{uso.clave}] {uso.descripcion}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-emerald-400/80 flex items-center gap-1.5 bg-emerald-500/5 p-2 rounded-none border border-emerald-500/10">
                                                <span>💡</span>
                                                <span>
                                                    Para servicios digitales (SaaS), el SAT recomienda: <strong>G03 - Gastos en general</strong>
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* FILA 3: Dirección Fiscal Completa (Visible) */}
                                <div className="pt-6 mt-2 border-t border-gray-800">
                                    <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-pink-500" />
                                        Dirección Fiscal Completa
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Calle y Número</label>
                                            <Input
                                                value={formData.direccion_fiscal.calle}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    direccion_fiscal: { ...formData.direccion_fiscal, calle: e.target.value }
                                                })}
                                                disabled={!isEditingFiscal}
                                                placeholder="Av. Reforma 123 Int 4"
                                                className={`bg-gray-800/50 border-gray-700 text-white text-sm transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Código Postal (Fiscal) *</label>
                                            <Input
                                                value={formData.direccion_fiscal.cp}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    direccion_fiscal: { ...formData.direccion_fiscal, cp: e.target.value }
                                                })}
                                                placeholder="Ej. 06600"
                                                maxLength={5}
                                                disabled={!isEditingFiscal}
                                                className={`bg-gray-800/50 border-gray-700 text-white text-sm font-mono transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Colonia</label>
                                            <Input
                                                value={formData.direccion_fiscal.colonia}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    direccion_fiscal: { ...formData.direccion_fiscal, colonia: e.target.value }
                                                })}
                                                disabled={!isEditingFiscal}
                                                placeholder="Colonia"
                                                className={`bg-gray-800/50 border-gray-700 text-white text-sm transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Municipio / Alcaldía</label>
                                            <Input
                                                value={formData.direccion_fiscal.ciudad}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    direccion_fiscal: { ...formData.direccion_fiscal, ciudad: e.target.value }
                                                })}
                                                disabled={!isEditingFiscal}
                                                placeholder="Municipio"
                                                className={`bg-gray-800/50 border-gray-700 text-white text-sm transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Estado</label>
                                            <Input
                                                value={formData.direccion_fiscal.estado}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    direccion_fiscal: { ...formData.direccion_fiscal, estado: e.target.value }
                                                })}
                                                disabled={!isEditingFiscal}
                                                placeholder="Estado"
                                                className={`bg-gray-800/50 border-gray-700 text-white text-sm transition-all ${!isEditingFiscal ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Save Button - Solo habilitado si hay cambios reales */}
                    <div className="flex justify-end pt-4 pb-12">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges()}
                            className={`font-bold h-12 px-8 rounded-none shadow-lg transition-all ${!hasChanges()
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-600/20'
                                }`}
                        >
                            <Save className={`w-4 h-4 mr-2 ${!hasChanges() ? 'opacity-20' : ''}`} />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
