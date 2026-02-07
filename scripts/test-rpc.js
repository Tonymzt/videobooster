const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

async function checkEncryption() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const ENCRYPTION_KEY = process.env.FISCAL_ENCRYPTION_KEY;
    const testRfcEncrypted = 'ww0EBwMClMiD0HyLyT1h0j4BestM/c4zeImK9te669u6zU3Y5ulfux3Sr7CgOPJusBSkchzp26eJ\nEv+3KevgyQ8zNPmudWzxvYIlZ+Oc0Q==';

    console.log('--- TESTING DECRYPTION RPC ---');
    const { data, error } = await supabase.rpc('decrypt_sensitive_data', {
        encrypted_data: testRfcEncrypted,
        key_text: ENCRYPTION_KEY
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('Decrypted Data:', data);
    }

    console.log('\n--- TESTING ENCRYPTION RPC ---');
    const { data: encData, error: encError } = await supabase.rpc('encrypt_sensitive_data', {
        raw_data: 'TEST123456',
        key_text: ENCRYPTION_KEY
    });

    if (encError) {
        console.error('RPC Error:', encError);
    } else {
        console.log('Encrypted Data:', encData);
    }
}

checkEncryption();
