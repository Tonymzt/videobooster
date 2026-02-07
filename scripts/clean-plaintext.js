const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

async function cleanPlaintext() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- CLEANING PLAINTEXT COLUMNS ---');
    const { error } = await supabase
        .from('profiles')
        .update({
            rfc: null,
            razon_social: null,
            direccion_fiscal: null
        })
        .not('rfc_encrypted', 'is', null);

    if (error) {
        console.error('Error cleaning plaintext:', error);
        return;
    }

    console.log('--- VERIFYING CLEANUP ---');
    const { data, error: checkError } = await supabase
        .from('profiles')
        .select('email, rfc, rfc_encrypted, razon_social, razon_social_encrypted')
        .eq('email', 'contacto.iaproactiva@gmail.com')
        .single();

    if (checkError) {
        console.error('Error checking cleanup:', checkError);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

cleanPlaintext();
