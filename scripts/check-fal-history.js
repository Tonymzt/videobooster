const axios = require('axios');
require('dotenv').config({ path: './frontend/.env.local' });

async function checkFalHistory() {
    console.log('🦅 CONSULTANDO HISTORIAL DE FAL.AI...\n');

    try {
        // Obtenemos los últimos requests de la cola de minimax
        // Fal API para consultar estado de requests por request_id
        // Como no tenemos los IDs porque no se guardaron, intentaremos ver si hay un endpoint de listado

        console.log('Intentando verificar conexión con Fal...');
        const response = await axios.get('https://rest.alpha.fal.ai/requests', {
            headers: {
                'Authorization': `Key ${process.env.FAL_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const requests = response.data || [];
        console.log(`✅ Se encontraron ${requests.length} peticiones recientes en tu cuenta de Fal.`);

        requests.slice(0, 5).forEach(r => {
            console.log(`   - ID: ${r.request_id} | Status: ${r.status} | Created: ${r.created_at}`);
        });

    } catch (err) {
        console.log('⚠️ Nota: Fal no permite listar requests sin IDs específicos fácilmente vía REST público.');
        console.log('Pero la consola de Fal (C) muestra el gasto real.');
        console.log(`Error detail: ${err.message}`);
    }
}

checkFalHistory();
