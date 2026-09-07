const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
};

async function init() {
  // الاتصال بقاعدة البيانات الافتراضية
  const systemClient = new Client({ ...config, database: 'postgres' });
  
  try {
    await systemClient.connect();
    
    // إنشاء قاعدة البيانات إن لم تكن موجودة
    const checkDb = await systemClient.query("SELECT 1 FROM pg_database WHERE datname='wajeez_db'");
    if (checkDb.rowCount === 0) {
      await systemClient.query('CREATE DATABASE wajeez_db');
      console.log('✅ تم إنشاء قاعدة البيانات wajeez_db بنجاح!');
    } else {
      console.log('ℹ️ قاعدة البيانات wajeez_db موجودة مسبقاً.');
    }
  } catch (err) {
    console.error('❌ خطأ في الاتصال بالسيرفر:', err.message);
    process.exit(1);
  } finally {
    await systemClient.end();
  }

  // الاتصال بقاعدة البيانات الجديدة وتطبيق schema.sql
  const dbClient = new Client({ ...config, database: 'wajeez_db' });
  try {
    await dbClient.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await dbClient.query(sql);
    console.log('✅ تم إنشاء جميع الجداول بنجاح!');
  } catch (err) {
    console.error('❌ خطأ في إنشاء الجداول:', err.message);
  } finally {
    await dbClient.end();
  }
}

init();