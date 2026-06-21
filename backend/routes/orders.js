const express = require('express');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

function generateOrderNo() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `HS${timestamp}${random}`;
}

function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

router.post('/', auth('guest'), async (req, res) => {
  try {
    const { property_id, check_in, check_out, total_price, guest_name, guest_phone } = req.body;
    
    if (!property_id || !check_in || !check_out || !total_price || !guest_name || !guest_phone) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const properties = await query('SELECT * FROM properties WHERE id = ?', [property_id]);
    if (properties.length === 0) {
      return res.status(404).json({ message: '房源不存在' });
    }
    
    const dates = getDateRange(check_in, check_out);
    for (const date of dates) {
      const calendars = await query('SELECT * FROM calendar WHERE property_id = ? AND date = ?', [property_id, date]);
      if (calendars.length > 0 && calendars[0].status !== 'available') {
        return res.status(400).json({ message: `${date} 已被预订或维护中` });
      }
    }
    
    const order_no = generateOrderNo();
    const result = await query(
      'INSERT INTO orders (order_no, property_id, guest_id, check_in, check_out, total_price, guest_name, guest_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [order_no, property_id, req.user.id, check_in, check_out, total_price, guest_name, guest_phone, 'pending_payment']
    );
    
    res.json({ message: '订单创建成功', orderId: result[0].insertId, order_no });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/pay', auth('guest'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    if (order.guest_id !== req.user.id) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ message: '订单状态不支持支付' });
    }
    
    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(400).json({ message: '用户不存在' });
    }
    
    const user = users[0];
    if (parseFloat(user.balance) < parseFloat(order.total_price)) {
      return res.status(400).json({ message: '余额不足' });
    }
    
    const dates = getDateRange(order.check_in, order.check_out);
    for (const date of dates) {
      const calendars = await query('SELECT * FROM calendar WHERE property_id = ? AND date = ?', [order.property_id, date]);
      if (calendars.length > 0) {
        if (calendars[0].status !== 'available') {
          return res.status(400).json({ message: `${date} 已被预订` });
        }
        await query('UPDATE calendar SET status = ?, order_id = ? WHERE property_id = ? AND date = ?', ['booked', order.id, order.property_id, date]);
      } else {
        const properties = await query('SELECT * FROM properties WHERE id = ?', [order.property_id]);
        const property = properties[0];
        const isWk = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
        const price = isWk ? property.weekend_price : property.weekday_price;
        await query('INSERT INTO calendar (property_id, date, status, price, order_id) VALUES (?, ?, ?, ?, ?)', [order.property_id, date, 'booked', price, order.id]);
      }
    }
    
    await query('UPDATE users SET balance = balance - ? WHERE id = ?', [order.total_price, req.user.id]);
    await query('UPDATE orders SET status = ? WHERE id = ?', ['pending_accept', order.id]);
    
    const properties = await query('SELECT * FROM properties WHERE id = ?', [order.property_id]);
    const property = properties[0];
    
    await query(
      'INSERT INTO messages (user_id, title, content, type, order_id) VALUES (?, ?, ?, ?, ?)',
      [property.host_id, '新订单提醒', `您有新的订单：${order.order_no}，请及时处理。`, 'booking_success', order.id]
    );
    
    await query(
      'INSERT INTO messages (user_id, title, content, type, order_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, '预订成功', `您的订单 ${order.order_no} 已支付成功，等待房东确认。`, 'booking_success', order.id]
    );
    
    res.json({ message: '支付成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/guest', auth('guest'), async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*, p.title, p.cover_image FROM orders o 
       LEFT JOIN properties p ON o.property_id = p.id 
       WHERE o.guest_id = ? ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/host', auth('host'), async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*, p.title, p.cover_image FROM orders o 
       INNER JOIN properties p ON o.property_id = p.id 
       WHERE p.host_id = ? ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await query(
      `SELECT o.*, p.title, p.address, p.cover_image, 
       u1.nickname as host_nickname, u1.phone as host_phone,
       u2.nickname as guest_nickname
       FROM orders o 
       LEFT JOIN properties p ON o.property_id = p.id 
       LEFT JOIN users u1 ON p.host_id = u1.id
       LEFT JOIN users u2 ON o.guest_id = u2.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    if (order.guest_id !== req.user.id && order.host_id !== req.user.id && !order.host_nickname) {
      // check host ownership
    }
    
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/accept', auth('host'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query(
      `SELECT o.*, p.host_id FROM orders o INNER JOIN properties p ON o.property_id = p.id WHERE o.id = ?`,
      [id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    if (order.host_id !== req.user.id) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    if (order.status !== 'pending_accept') {
      return res.status(400).json({ message: '订单状态不支持接单' });
    }
    
    await query('UPDATE orders SET status = ? WHERE id = ?', ['pending_checkin', id]);
    
    await query(
      'INSERT INTO messages (user_id, title, content, type, order_id) VALUES (?, ?, ?, ?, ?)',
      [order.guest_id, '房东已接单', `您的订单 ${order.order_no} 已被房东确认，等待入住。`, 'host_accept', id]
    );
    
    res.json({ message: '接单成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/reject', auth('host'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query(
      `SELECT o.*, p.host_id FROM orders o INNER JOIN properties p ON o.property_id = p.id WHERE o.id = ?`,
      [id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    if (order.host_id !== req.user.id) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    if (order.status !== 'pending_accept') {
      return res.status(400).json({ message: '订单状态不支持拒单' });
    }
    
    await query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);
    
    const dates = getDateRange(order.check_in, order.check_out);
    for (const date of dates) {
      const calendars = await query('SELECT * FROM calendar WHERE property_id = ? AND date = ? AND order_id = ?', [order.property_id, date, id]);
      if (calendars.length > 0) {
        await query('UPDATE calendar SET status = ?, order_id = NULL WHERE id = ?', ['available', calendars[0].id]);
      }
    }
    
    await query('UPDATE users SET balance = balance + ? WHERE id = ?', [order.total_price, order.guest_id]);
    
    await query(
      'INSERT INTO messages (user_id, title, content, type, order_id) VALUES (?, ?, ?, ?, ?)',
      [order.guest_id, '房东已拒单', `很遗憾，您的订单 ${order.order_no} 被房东拒绝，款项已退回您的账户。`, 'host_reject', id]
    );
    
    res.json({ message: '拒单成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
