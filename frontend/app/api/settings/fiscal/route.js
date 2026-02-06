import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getEncryptionKey() {
    const key = process.env.FISCAL_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('FISCAL_ENCRYPTION_KEY not configured in runtime');
    }
    return key;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(userId) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < 60000);

    if (recentRequests.length >= 20) {
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);
    return true;
}

export async function GET(request) {
    try {
        const ENCRYPTION_KEY = getEncryptionKey();
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
            .select('full_name, account_type, rfc_encrypted, razon_social_encrypted, direccion_fiscal_encrypted, regimen_fiscal, uso_cfdi, fiscal_data_completed')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        const decryptedData = {
            full_name: profile.full_name,
            account_type: profile.account_type,
            rfc: null,
            razon_social: null,
            direccion_fiscal: null,
            regimen_fiscal: profile.regimen_fiscal,
            uso_cfdi: profile.uso_cfdi || 'G03',
            fiscal_data_completed: profile.fiscal_data_completed
        };

        // Desencriptar RFC
        if (profile.rfc_encrypted) {
            const { data, error: rpcError } = await supabase.rpc('decrypt_sensitive_data', {
                encrypted_data: profile.rfc_encrypted,
                key_text: ENCRYPTION_KEY
            });

            if (!rpcError && data) {
                decryptedData.rfc = data;
            }
        }

        // Desencriptar Razón Social
        if (profile.razon_social_encrypted) {
            const { data, error: rpcError } = await supabase.rpc('decrypt_sensitive_data', {
                encrypted_data: profile.razon_social_encrypted,
                key_text: ENCRYPTION_KEY
            });

            if (!rpcError && data) {
                decryptedData.razon_social = data;
            }
        }

        // Desencriptar Dirección
        if (profile.direccion_fiscal_encrypted) {
            const { data, error: rpcError } = await supabase.rpc('decrypt_sensitive_data', {
                encrypted_data: profile.direccion_fiscal_encrypted,
                key_text: ENCRYPTION_KEY
            });

            if (!rpcError && data) {
                try {
                    decryptedData.direccion_fiscal = JSON.parse(data);
                } catch (e) {
                    console.error('Error parsing direccion_fiscal:', e);
                }
            }
        }

        return NextResponse.json({ success: true, data: decryptedData });

    } catch (error) {
        console.error('Fiscal GET error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const ENCRYPTION_KEY = getEncryptionKey();
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
            full_name: body.full_name,
            regimen_fiscal: body.regimen_fiscal,
            uso_cfdi: body.uso_cfdi || 'G03',
            updated_at: new Date().toISOString()
        };

        // Encriptar RFC
        if (body.rfc) {
            const { data, error: rpcError } = await supabase.rpc('encrypt_sensitive_data', {
                raw_data: body.rfc.toUpperCase(),
                key_text: ENCRYPTION_KEY
            });

            if (rpcError) {
                console.error('RPC Error (RFC):', rpcError);
                return NextResponse.json({ error: 'Cifrado fallido (RFC): ' + rpcError.message }, { status: 500 });
            }

            updates.rfc_encrypted = data;
        }

        // Encriptar Razón Social
        if (body.razon_social) {
            const { data, error: rpcError } = await supabase.rpc('encrypt_sensitive_data', {
                raw_data: body.razon_social.toUpperCase(),
                key_text: ENCRYPTION_KEY
            });

            if (rpcError) {
                console.error('RPC Error (Razón Social):', rpcError);
                return NextResponse.json({ error: 'Cifrado fallido (Razón Social): ' + rpcError.message }, { status: 500 });
            }

            updates.razon_social_encrypted = data;
        }

        // Encriptar Dirección
        if (body.direccion_fiscal) {
            const { data, error: rpcError } = await supabase.rpc('encrypt_sensitive_data', {
                raw_data: JSON.stringify(body.direccion_fiscal),
                key_text: ENCRYPTION_KEY
            });

            if (rpcError) {
                console.error('RPC Error (Dirección):', rpcError);
                return NextResponse.json({ error: 'Cifrado fallido (Dirección): ' + rpcError.message }, { status: 500 });
            }

            updates.direccion_fiscal_encrypted = data;
        }

        // Calcular si datos están completos
        const isComplete = body.rfc &&
            body.razon_social &&
            body.regimen_fiscal &&
            body.uso_cfdi &&
            body.direccion_fiscal?.cp;

        updates.fiscal_data_completed = isComplete || false;

        // Guardar en BD
        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            throw updateError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Fiscal PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
