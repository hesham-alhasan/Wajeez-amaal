const db = require('./db');
const bcrypt = require('bcryptjs');

async function createInitialAdmin() {
  const username = 'admin';
  const rawPassword = 'adminpassword123'; // يمكنك تغيير كلمة المرور هنا

  try {
    const userCheck = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      console.log('ℹ️ المشرف الافتراضي موجود مسبقاً.');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    await db.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    console.log('✅ تم إنشاء حساب المشرف بنجاح!');
    console.log(`اسم المستخدم: ${username}`);
    console.log(`كلمة المرور: ${rawPassword}`);
  } catch (err) {
    console.error('❌ خطأ أثناء إنشاء المشرف:', err.message);
  } finally {
    process.exit();
  }
}

createInitialAdmin();