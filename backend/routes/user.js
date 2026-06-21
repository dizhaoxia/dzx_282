const express = require('express');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth(), async (req, res) => {
  try {
    const users = await query('SELECT id, phone, role, nickname, avatar, balance FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/profile', auth(), async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    await query(
      'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
      [nickname || null, avatar || null, req.user.id]
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
