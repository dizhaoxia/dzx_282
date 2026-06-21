const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const properties = await query(
      `SELECT p.*, 
       (SELECT GROUP_CONCAT(facility) FROM property_facilities WHERE property_id = p.id) as facilities_list
       FROM properties p ORDER BY p.created_at DESC`
    );
    
    const result = properties.map(p => ({
      ...p,
      facilities: p.facilities_list ? p.facilities_list.split(',') : []
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/mine', auth(), async (req, res) => {
  try {
    const properties = await query(
      `SELECT p.*, 
       (SELECT GROUP_CONCAT(facility) FROM property_facilities WHERE property_id = p.id) as facilities_list
       FROM properties p WHERE p.host_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    
    const result = properties.map(p => ({
      ...p,
      facilities: p.facilities_list ? p.facilities_list.split(',') : []
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await query(
      `SELECT p.*, u.nickname as host_nickname, u.phone as host_phone,
       (SELECT GROUP_CONCAT(facility) FROM property_facilities WHERE property_id = p.id) as facilities_list
       FROM properties p LEFT JOIN users u ON p.host_id = u.id WHERE p.id = ?`,
      [id]
    );
    
    if (properties.length === 0) {
      return res.status(404).json({ message: '房源不存在' });
    }
    
    const p = properties[0];
    res.json({
      ...p,
      facilities: p.facilities_list ? p.facilities_list.split(',') : []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/upload', auth('host'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未上传图片' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '上传失败' });
  }
});

router.post('/', auth('host'), async (req, res) => {
  try {
    const { title, address, room_type, max_guests, weekday_price, weekend_price, cover_image, description, facilities } = req.body;
    
    if (!title || !address || !room_type || !max_guests || !weekday_price || !weekend_price) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const result = await query(
      'INSERT INTO properties (host_id, title, address, room_type, max_guests, weekday_price, weekend_price, cover_image, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, address, room_type, max_guests, weekday_price, weekend_price, cover_image || null, description || '']
    );
    
    const propertyId = result[0].insertId;
    
    if (facilities && facilities.length > 0) {
      for (const facility of facilities) {
        await query(
          'INSERT INTO property_facilities (property_id, facility) VALUES (?, ?)',
          [propertyId, facility]
        );
      }
    }
    
    res.json({ message: '发布成功', propertyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
