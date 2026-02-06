import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const ENCRYPTION_KEY = process.env.FISCAL_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error('FISCAL_ENCRYPTION_KEY not configured');
}

// Nota: Usamos SERVICE_ROLE_KEY para permitir bypass controlado de RLS 
// y ejecutar funciones de encriptación rpc
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting simple
const rateLimitMap = new Map();

function checkRateLimit(userId) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < 60000);

    if (recentRequests.length >= 20) { // Incrementado ligeramente para carga inicial
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);
    return true;
}

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!checkRateLimit(user.id)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('rfc_encrypted, razon_social_encrypted, direccion_fiscal_encrypted, regimen_fiscal, uso_cfdi')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // Desencriptar datos
        const decryptedData = {
            rfc: null,
            razon_social: null,
            direccion_fiscal: null,
            regimen_fiscal: profile.regimen_fiscal,
            uso_cfdi: profile.uso_cfdi || 'G03'
        };

        if (profile.rfc_encrypted) {
            const { data } = await supabase.rpc('decrypt_sensitive_data', {
                encrypted: profile.rfc_encrypted,
                key: ENCRYPTION_KEY
            });
            decryptedData.rfc = data;
        }

        if (profile.razon_social_encrypted) {
            const { data } = await supabase.rpc('decrypt_sensitive_data', {
                encrypted: profile.razon_social_encrypted,
                key: ENCRYPTION_KEY
            });
            decryptedData.razon_social = data;
        }

        if (profile.direccion_fiscal_encrypted) {
            const { data } = await supabase.rpc('decrypt_sensitive_data', {
                encrypted: profile.direccion_fiscal_encrypted,
                key: ENCRYPTION_KEY
            });
            decryptedData.direccion_fiscal = data ? JSON.parse(data) : null;
        }

        return NextResponse.json({ success: true, data: decryptedData });

    } catch (error) {
        console.error('Fiscal API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user } } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validaciones
        if (body.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(body.rfc)) {
            return NextResponse.json({ error: 'RFC inválido' }, { status: 400 });
        }

        if (body.direccion_fiscal?.cp && !/^\d{5}$/.test(body.direccion_fiscal.cp)) {
            return NextResponse.json({ error: 'CP inválido' }, { status: 400 });
        }

        const updates = {
            regimen_fiscal: body.regimen_fiscal,
            uso_cfdi: body.uso_cfdi || 'G03',
            updated_at: new Date().toISOString()
        };

        // Encriptar RFC
        if (body.rfc) {
            const { data } = await supabase.rpc('encrypt_sensitive_data', {
                data: body.rfc.toUpperCase(),
                key: ENCRYPTION_KEY
            });
            updates.rfc_encrypted = data;
        }

        // Encriptar Razón Social
        if (body.razon_social) {
            const { data } = await supabase.rpc('encrypt_sensitive_data', {
                data: body.razon_social.toUpperCase(),
                key: ENCRYPTION_KEY
            });
            updates.razon_social_encrypted = data;
        }

        // Encriptar Dirección
        if (body.direccion_fiscal) {
            const { data } = await supabase.rpc('encrypt_sensitive_data', {
                data: JSON.stringify(body.direccion_fiscal),
                key: ENCRYPTION_KEY
            });
            updates.direccion_fiscal_encrypted = data;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
