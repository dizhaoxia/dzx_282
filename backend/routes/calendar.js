const express = require('express');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function generateMonthDates(year, month) {
  const dates = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dates.push(dateStr);
  }
  return dates;
}

router.get('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { year, month } = req.query;
    
    const properties = await query('SELECT * FROM properties WHERE id = ?', [propertyId]);
    if (properties.length === 0) {
      return res.status(404).json({ message: '房源不存在' });
    }
    const property = properties[0];
    
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    
    const existingCalendar = await query(
      'SELECT * FROM calendar WHERE property_id = ? AND date >= ? AND date <= ?',
      [propertyId, `${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-31`]
    );
    
    const calendarMap = {};
    existingCalendar.forEach(c => {
      calendarMap[c.date] = c;
    });
    
    const monthDates = generateMonthDates(y, m);
    const result = monthDates.map(dateStr => {
      if (calendarMap[dateStr]) {
        return calendarMap[dateStr];
      }
      return {
        date: dateStr,
        status: 'available',
        price: isWeekend(dateStr) ? property.weekend_price : property.weekday_price
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:propertyId/status', auth('host'), async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { date, status } = req.body;
    
    if (!date || !status) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    if (!['available', 'booked', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: '状态无效' });
    }
    
    const properties = await query('SELECT * FROM properties WHERE id = ? AND host_id = ?', [propertyId, req.user.id]);
    if (properties.length === 0) {
      return res.status(403).json({ message: '无权限操作' });
    }
    const property = properties[0];
    
    const existing = await query('SELECT * FROM calendar WHERE property_id = ? AND date = ?', [propertyId, date]);
    
    if (existing.length > 0) {
      await query('UPDATE calendar SET status = ? WHERE property_id = ? AND date = ?', [status, propertyId, date]);
    } else {
      const price = isWeekend(date) ? property.weekend_price : property.weekday_price;
      await query('INSERT INTO calendar (property_id, date, status, price) VALUES (?, ?, ?, ?)', [propertyId, date, status, price]);
    }
    
    res.json({ message: '状态更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:propertyId/price', auth('host'), async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { date, price } = req.body;
    
    if (!date || !price) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const properties = await query('SELECT * FROM properties WHERE id = ? AND host_id = ?', [propertyId, req.user.id]);
    if (properties.length === 0) {
      return res.status(403).json({ message: '无权限操作' });
    }
    
    const existing = await query('SELECT * FROM calendar WHERE property_id = ? AND date = ?', [propertyId, date]);
    
    if (existing.length > 0) {
      await query('UPDATE calendar SET price = ? WHERE property_id = ? AND date = ?', [price, propertyId, date]);
    } else {
      await query('INSERT INTO calendar (property_id, date, status, price) VALUES (?, ?, ?, ?)', [propertyId, date, 'available', price]);
    }
    
    res.json({ message: '价格更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
