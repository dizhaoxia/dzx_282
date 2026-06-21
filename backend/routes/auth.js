const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { phone, password, role, nickname } = req.body;
    
    if (!phone || !password || !role) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    if (!['guest', 'host'].includes(role)) {
      return res.status(400).json({ message: '角色无效' });
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '手机号格式不正确' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6位' });
    }
    
    const existing = await query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ message: '该手机号已注册' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (phone, password, role, nickname, avatar, balance) VALUES (?, ?, ?, ?, ?, ?)',
      [phone, hashedPassword, role, nickname || null, null, 10000.00]
    );
    
    res.json({ message: '注册成功', userId: result[0].insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const users = await query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(400).json({ message: '手机号或密码错误' });
    }
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: '手机号或密码错误' });
    }
    
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '7d' });
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
