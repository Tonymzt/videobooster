const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

async function checkData() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('email, rfc, rfc_encrypted, fiscal_data_completed')
        .eq('email', 'contacto.iaproactiva@gmail.com')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- DATABASE STATE ---');
    console.log(JSON.stringify(data, null, 2));
}

checkData();
