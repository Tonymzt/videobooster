const fal = require('@fal-ai/serverless-client');
require('dotenv').config({ path: './frontend/.env.local' });

async function recover() {
    const requestId = '136aee91-9699-41c4-a183-46e2dc6ccb41';
    try {
        const result = await fal.queue.status("fal-ai/minimax-video/image-to-video", {
            requestId: requestId
        });
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err);
    }
}
recover();
