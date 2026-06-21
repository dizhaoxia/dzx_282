const express = require('express');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(), async (req, res) => {
  try {
    const messages = await query(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/unread-count', auth(), async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as unread_count FROM messages WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ unread_count: result[0].unread_count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/read', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: '标记已读成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/read-all', auth(), async (req, res) => {
  try {
    await query('UPDATE messages SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: '全部标记已读成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
