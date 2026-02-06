import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

/**
 * API SEGURA: Gestión de Datos Fiscales Blindados
 * CAPA 3 del Plan de Seguridad
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY;

// Rate limiting local simple
const rateLimits = new Map();

function checkRateLimit(userId) {
    const now = Date.now();
    const windowMs = 60000; // 1 minuto
    const maxRequests = 15;

    const userRequests = rateLimits.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) return false;

    recentRequests.push(now);
    rateLimits.set(userId, recentRequests);
    return true;
}

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // 1. Validar Usuario (Token JWT)
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Rate Limiting
        if (!checkRateLimit(user.id)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

        // 3. Acceso a Datos Desencriptados
        // Seteamos la clave de encriptación en la sesión de Postgres para esta transacción
        const { data: profile, error } = await supabase.rpc('get_secure_profile', {}, {
            // Pasamos la clave a través de la configuración de la sesión
        }).single();

        // Alternativa si no queremos usar RPC complejo: Query directo a la vista seteando la sesión
        // IMPORTANTE: En Supabase Service Role omitimos RLS, por eso filtramos por ID meticulosamente
        await supabase.rpc('set_session_key', { key: APP_ENCRYPTION_KEY });

        const { data: secureProfile, error: profileError } = await supabase
            .from('profiles_fiscal_secure')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        return NextResponse.json({ success: true, profile: secureProfile });

    } catch (error) {
        console.error('🔒 Security API GET Error:', error);
        return NextResponse.json({ error: 'Internal Security Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const body = await request.json();
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Validaciones de Negocio
        if (body.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(body.rfc)) {
            return NextResponse.json({ error: 'RFC no válido' }, { status: 400 });
        }

        // 2. Encriptación y Guardado
        // Seteamos la clave para las funciones SQL
        await supabase.rpc('set_session_key', { key: APP_ENCRYPTION_KEY });

        const updates = {
            full_name: body.full_name,
            regimen_fiscal: body.regimen_fiscal,
            uso_cfdi: body.uso_cfdi,
            fiscal_data_completed: body.fiscal_data_completed,
            updated_at: new Date().toISOString()
        };

        // Encriptamos vía SQL rpc para no procesar texto plano en el servidor JS si es posible
        if (body.rfc) {
            const { data: encRfc } = await supabase.rpc('encrypt_sensitive_data', { data: body.rfc });
            updates.rfc_encrypted = encRfc;
        }

        if (body.razon_social) {
            const { data: encRs } = await supabase.rpc('encrypt_sensitive_data', { data: body.razon_social });
            updates.razon_social_encrypted = encRs;
        }

        if (body.direccion_fiscal) {
            const { data: encDir } = await supabase.rpc('encrypt_sensitive_data', { data: JSON.stringify(body.direccion_fiscal) });
            updates.direccion_fiscal_encrypted = encDir;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('🔒 Security API PUT Error:', error);
        return NextResponse.json({ error: 'Safe storage failed' }, { status: 500 });
    }
}
