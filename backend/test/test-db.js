require('dotenv').config();
const db = require('../src/services/database');
const crypto = require('crypto');

async function testDatabase() {
    console.log('🧪 TEST: Database Connection & CRUD\n');
    const testId = `test_job_${Date.now()}`;

    try {
        // 1. Create
        console.log('1️⃣ Creating job...');
        const created = await db.createJob(testId, 'https://example.com/product');
        console.log('✅ Created:', created.job_id);

        // 2. Read
        console.log('2️⃣ Reading job...');
        const read = await db.getJob(testId);
        console.log('✅ Read:', read.job_id, '| Status:', read.status);

        // 3. Update
        console.log('3️⃣ Updating status...');
        const updated = await db.updateJobStatus(testId, { status: 'processing', progress: 50 });
        console.log('✅ Updated:', updated.status, '| Progress:', updated.progress);

        // 4. Complete
        console.log('4️⃣ Completing job...');
        const completed = await db.completeJob(testId, 'https://r2.example.com/video.mp4', { duration: 15 });
        console.log('✅ Completed:', completed.status, '| Video:', completed.video_url);

        // 5. Stats
        console.log('5️⃣ Getting stats...');
        const stats = await db.getStats();
        console.log('✅ Stats:', stats);

        console.log('\n🎉 DB TEST PASSED');
    } catch (error) {
        console.error('\n❌ DB TEST FAILED:', error.message);
        process.exit(1);
    }
}

testDatabase();
