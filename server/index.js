const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware الأساسية
app.use(cors());
app.use(express.json());


// إعداد بيانات الاتصال بـ Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// إعداد محرك التخزين السحابي
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wajeez_projects',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
});
const upload = multer({ storage });

// Middleware للتحقق من التوكن (JWT Authentication)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' });

  jwt.verify(token, process.env.JWT_SECRET || 'wajeez_secret_key_2026', (err, user) => {
    if (err) return res.status(403).json({ error: 'التوكن غير صالحة أو منتهية الصلاحية' });
    req.user = user;
    next();
  });
};

// ==================== [ API Routes ] ====================

// 1. تسجيل دخول المشرف
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'wajeez_secret_key_2026',
      { expiresIn: '12h' }
    );

    res.json({ message: 'تم تسجيل الدخول بنجاح', token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. جلب جميع الألبومات مع صورها (Public)
app.get('/api/albums', async (req, res) => {
  try {
    const queryText = `
      SELECT a.id as album_id, a.title, a.created_at,
             COALESCE(
               json_agg(
                 json_build_object('id', pi.id, 'image_url', pi.image_url)
               ) FILTER (WHERE pi.id IS NOT NULL), '[]'
             ) as images
      FROM albums a
      LEFT JOIN project_images pi ON a.id = pi.album_id
      GROUP BY a.id
      ORDER BY a.created_at DESC;
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. إنشاء ألبوم جديد (Protected)
app.post('/api/albums', authenticateAdmin, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'عنوان الألبوم مطلوب' });

  try {
    const result = await db.query('INSERT INTO albums (title) VALUES ($1) RETURNING *', [title]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. رفع صور لألبوم معين (Protected - Cloudinary)
app.post('/api/albums/:id/images', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  const albumId = req.params.id;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'لم يتم اختيار أي صور' });
  }

  try {
    const savedImages = [];
    for (const file of req.files) {
      const imageUrl = file.path; // الرابط السحابي القادم مباشرة من Cloudinary
      const result = await db.query(
        'INSERT INTO project_images (album_id, image_url) VALUES ($1, $2) RETURNING *',
        [albumId, imageUrl]
      );
      savedImages.push(result.rows[0]);
    }
    res.status(201).json({ message: 'تم رفع الصور بنجاح', images: savedImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. حذف صورة واحدة (Protected)
app.delete('/api/images/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM project_images WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'الصورة غير موجودة' });
    }
    res.json({ message: 'تم حذف الصورة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. حذف ألبوم بالكامل مع جميع صوره (Protected)
app.delete('/api/albums/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // حذف جميع الصور التابعة للألبوم أولاً لمنع تعارض القيود
    await db.query('DELETE FROM project_images WHERE album_id = $1', [id]);
    // ثم حذف الألبوم
    const result = await db.query('DELETE FROM albums WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }
    res.json({ message: 'تم حذف الألبوم وجميع صوره بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. إرسال طلب الاستشارة / مخطط مشروع من قبل العميل (Public - Cloudinary)
app.post('/api/quote-requests', upload.single('blueprint'), async (req, res) => {
  const { client_name, phone, notes } = req.body;
  const file_url = req.file ? req.file.path : null; // استخدام الرابط السحابي المباشر للمخطط

  if (!client_name || !phone) {
    return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  }

  try {
    const result = await db.query(
      'INSERT INTO quote_requests (client_name, phone, notes, file_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_name, phone, notes, file_url]
    );
    res.status(201).json({ message: 'تم إرسال طلبك بنجاح وسيتواصل معك الفريق قريباً!', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل بنجاح على المنفذ: http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware الأساسية
app.use(cors());
app.use(express.json());


// إعداد بيانات الاتصال بـ Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// إعداد محرك التخزين السحابي
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wajeez_projects',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
});
const upload = multer({ storage });

// Middleware للتحقق من التوكن (JWT Authentication)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' });

  jwt.verify(token, process.env.JWT_SECRET || 'wajeez_secret_key_2026', (err, user) => {
    if (err) return res.status(403).json({ error: 'التوكن غير صالحة أو منتهية الصلاحية' });
    req.user = user;
    next();
  });
};

// ==================== [ API Routes ] ====================

// 1. تسجيل دخول المشرف
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'wajeez_secret_key_2026',
      { expiresIn: '12h' }
    );

    res.json({ message: 'تم تسجيل الدخول بنجاح', token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. جلب جميع الألبومات مع صورها (Public)
app.get('/api/albums', async (req, res) => {
  try {
    const queryText = `
      SELECT a.id as album_id, a.title, a.created_at,
             COALESCE(
               json_agg(
                 json_build_object('id', pi.id, 'image_url', pi.image_url)
               ) FILTER (WHERE pi.id IS NOT NULL), '[]'
             ) as images
      FROM albums a
      LEFT JOIN project_images pi ON a.id = pi.album_id
      GROUP BY a.id
      ORDER BY a.created_at DESC;
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. إنشاء ألبوم جديد (Protected)
app.post('/api/albums', authenticateAdmin, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'عنوان الألبوم مطلوب' });

  try {
    const result = await db.query('INSERT INTO albums (title) VALUES ($1) RETURNING *', [title]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. رفع صور لألبوم معين (Protected - Cloudinary)
app.post('/api/albums/:id/images', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  const albumId = req.params.id;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'لم يتم اختيار أي صور' });
  }

  try {
    const savedImages = [];
    for (const file of req.files) {
      const imageUrl = file.path; // الرابط السحابي القادم مباشرة من Cloudinary
      const result = await db.query(
        'INSERT INTO project_images (album_id, image_url) VALUES ($1, $2) RETURNING *',
        [albumId, imageUrl]
      );
      savedImages.push(result.rows[0]);
    }
    res.status(201).json({ message: 'تم رفع الصور بنجاح', images: savedImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. حذف صورة واحدة (Protected)
app.delete('/api/images/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM project_images WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'الصورة غير موجودة' });
    }
    res.json({ message: 'تم حذف الصورة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. حذف ألبوم بالكامل مع جميع صوره (Protected)
app.delete('/api/albums/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // حذف جميع الصور التابعة للألبوم أولاً لمنع تعارض القيود
    await db.query('DELETE FROM project_images WHERE album_id = $1', [id]);
    // ثم حذف الألبوم
    const result = await db.query('DELETE FROM albums WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }
    res.json({ message: 'تم حذف الألبوم وجميع صوره بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. إرسال طلب الاستشارة / مخطط مشروع من قبل العميل (Public - Cloudinary)
app.post('/api/quote-requests', upload.single('blueprint'), async (req, res) => {
  const { client_name, phone, notes } = req.body;
  const file_url = req.file ? req.file.path : null; // استخدام الرابط السحابي المباشر للمخطط

  if (!client_name || !phone) {
    return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  }

  try {
    const result = await db.query(
      'INSERT INTO quote_requests (client_name, phone, notes, file_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_name, phone, notes, file_url]
    );
    res.status(201).json({ message: 'تم إرسال طلبك بنجاح وسيتواصل معك الفريق قريباً!', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل بنجاح على المنفذ: http://localhost:${PORT}`);
});



