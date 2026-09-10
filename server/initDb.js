const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function init() {
    // الاتصال المباشر باستخدام الرابط السحابي
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ متصل بقاعدة بيانات Neon السحابية');
        
        // قراءة الجداول وزرعها مباشرة
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(sql);
        console.log('✅ تم بناء الجداول بنجاح من schema.sql');
        
    } catch (err) {
        console.error('❌ خطأ أثناء البناء:', err.message);
    } finally {
        await client.end();
    }
}

init();
