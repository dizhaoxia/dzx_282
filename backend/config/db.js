const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  multipleStatements: true
};

let pool;

async function init() {
  try {
    pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });
    
    await pool.query('CREATE DATABASE IF NOT EXISTS homestay_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    pool = mysql.createPool({ ...config, database: 'homestay_db', waitForConnections: true, connectionLimit: 10 });
    
    const sqlPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(schemaSql);
    
    console.log('数据库初始化成功');
  } catch (err) {
    console.error('数据库初始化失败:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('警告: MySQL服务未启动，将使用内存数据模拟');
    }
  }
}

function getPool() {
  return pool;
}

async function query(sql, params = []) {
  if (!pool) {
    return mockQuery(sql, params);
  }
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('SQL错误:', err.message, sql, params);
    return mockQuery(sql, params);
  }
}

const mockData = {
  users: [],
  properties: [],
  property_facilities: [],
  calendar: [],
  orders: [],
  messages: []
};

let mockIds = {
  users: 0,
  properties: 0,
  calendar: 0,
  orders: 0,
  messages: 0
};

function mockQuery(sql, params) {
  sql = sql.trim();
  
  if (sql.startsWith('INSERT INTO users')) {
    mockIds.users++;
    const user = {
      id: mockIds.users,
      phone: params[0],
      password: params[1],
      role: params[2],
      nickname: params[3] || null,
      avatar: params[4] || null,
      balance: params[5] || 10000,
      created_at: new Date()
    };
    mockData.users.push(user);
    return [{ insertId: mockIds.users }];
  }
  
  if (sql.startsWith('SELECT') && sql.includes('FROM users') && sql.includes('WHERE phone')) {
    const user = mockData.users.find(u => u.phone == params[0]);
    return user ? [user] : [];
  }
  
  if (sql.startsWith('SELECT') && sql.includes('FROM users') && sql.includes('WHERE id')) {
    const user = mockData.users.find(u => u.id == params[0]);
    return user ? [user] : [];
  }
  
  if (sql.startsWith('UPDATE users')) {
    const user = mockData.users.find(u => u.id == params[params.length - 1]);
    if (user) {
      if (sql.includes('nickname')) user.nickname = params[0];
      if (sql.includes('avatar')) user.avatar = params[1] || params[0];
      if (sql.includes('balance')) user.balance = params[0];
    }
    return [{ affectedRows: 1 }];
  }
  
  if (sql.startsWith('INSERT INTO properties')) {
    mockIds.properties++;
    const prop = {
      id: mockIds.properties,
      host_id: params[0],
      title: params[1],
      address: params[2],
      room_type: params[3],
      max_guests: params[4],
      weekday_price: params[5],
      weekend_price: params[6],
      cover_image: params[7],
      description: params[8] || '',
      created_at: new Date()
    };
    mockData.properties.push(prop);
    return [{ insertId: mockIds.properties }];
  }
  
  if (sql.startsWith('SELECT') && /FROM\s+properties/.test(sql) && !/JOIN\s+properties/.test(sql)) {
    const hasIdWhere = /WHERE\s+p\.id\s*=/.test(sql) || /WHERE\s+id\s*=/.test(sql);
    const hasHostIdWhere = /WHERE\s+p\.host_id\s*=/.test(sql) || /WHERE\s+host_id\s*=/.test(sql);
    
    if (hasIdWhere) {
      const prop = mockData.properties.find(p => p.id == params[0]);
      if (prop) {
        const facilities = mockData.property_facilities.filter(f => f.property_id == prop.id).map(f => f.facility);
        return [{ ...prop, facilities_list: facilities.length > 0 ? facilities.join(',') : null }];
      }
      return [];
    }
    
    if (hasHostIdWhere) {
      const props = mockData.properties.filter(p => p.host_id == params[0]);
      return props.map(p => {
        const facilities = mockData.property_facilities.filter(f => f.property_id == p.id).map(f => f.facility);
        return { ...p, facilities_list: facilities.length > 0 ? facilities.join(',') : null };
      }).reverse();
    }
    
    const result = mockData.properties.map(p => {
      const facilities = mockData.property_facilities.filter(f => f.property_id == p.id).map(f => f.facility);
      return { ...p, facilities_list: facilities.length > 0 ? facilities.join(',') : null };
    }).reverse();
    return result;
  }
  
  if (sql.startsWith('INSERT INTO property_facilities')) {
    mockData.property_facilities.push({
      id: mockData.property_facilities.length + 1,
      property_id: params[0],
      facility: params[1]
    });
    return [{ insertId: mockData.property_facilities.length }];
  }
  
  if (sql.startsWith('INSERT INTO calendar') || sql.startsWith('INSERT  INTO calendar')) {
    mockIds.calendar++;
    const cal = {
      id: mockIds.calendar,
      property_id: params[0],
      date: params[1],
      status: params[2],
      price: params[3],
      order_id: params[4] || null
    };
    mockData.calendar.push(cal);
    return [{ insertId: mockIds.calendar }];
  }
  
  if (sql.includes('FROM calendar WHERE property_id')) {
    return mockData.calendar.filter(c => c.property_id == params[0]);
  }
  
  if (sql.startsWith('UPDATE calendar')) {
    const cal = mockData.calendar.find(c => c.property_id == params[params.length - 2] && c.date == params[params.length - 1]);
    if (cal) {
      if (sql.includes('status')) cal.status = params[0];
      if (sql.includes('price')) cal.price = params[0];
      if (sql.includes('order_id')) cal.order_id = params[0];
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }
  
  if (sql.startsWith('INSERT INTO orders')) {
    mockIds.orders++;
    const order = {
      id: mockIds.orders,
      order_no: params[0],
      property_id: params[1],
      guest_id: params[2],
      check_in: params[3],
      check_out: params[4],
      total_price: params[5],
      guest_name: params[6],
      guest_phone: params[7],
      status: params[8],
      created_at: new Date()
    };
    mockData.orders.push(order);
    return [{ insertId: mockIds.orders }];
  }
  
  if (sql.includes('FROM orders WHERE guest_id')) {
    return mockData.orders.filter(o => o.guest_id == params[0]).reverse();
  }
  
  if (sql.includes('INNER JOIN properties ON orders.property_id') || sql.includes('INNER JOIN properties p ON o.property_id')) {
    return mockData.orders
      .filter(o => {
        const prop = mockData.properties.find(p => p.id == o.property_id);
        return prop && prop.host_id == params[0];
      })
      .map(o => {
        const prop = mockData.properties.find(p => p.id == o.property_id);
        return { ...o, title: prop ? prop.title : '', cover_image: prop ? prop.cover_image : '' };
      })
      .reverse();
  }
  
  if (sql.includes('FROM orders') && (sql.includes('WHERE id') || sql.includes('WHERE order_no'))) {
    const isIdQuery = /WHERE\s+(o\.|orders\.)?id\s*=/.test(sql);
    const order = mockData.orders.find(o => 
      isIdQuery ? o.id == params[0] : o.order_no == params[0]
    );
    if (order) {
      const prop = mockData.properties.find(p => p.id == order.property_id);
      const host = prop ? mockData.users.find(u => u.id == prop.host_id) : null;
      const guest = mockData.users.find(u => u.id == order.guest_id);
      return [{
        ...order,
        title: prop ? prop.title : '',
        address: prop ? prop.address : '',
        cover_image: prop ? prop.cover_image : '',
        host_nickname: host ? (host.nickname || host.phone) : '',
        host_phone: host ? host.phone : '',
        guest_nickname: guest ? (guest.nickname || guest.phone) : ''
      }];
    }
    return [];
  }
  
  if (sql.startsWith('UPDATE orders SET status')) {
    const order = mockData.orders.find(o => o.id == params[1]);
    if (order) order.status = params[0];
    return [{ affectedRows: 1 }];
  }
  
  if (sql.startsWith('INSERT INTO messages')) {
    mockIds.messages++;
    const msg = {
      id: mockIds.messages,
      user_id: params[0],
      title: params[1],
      content: params[2],
      type: params[3],
      is_read: 0,
      order_id: params[4] || null,
      created_at: new Date()
    };
    mockData.messages.push(msg);
    return [{ insertId: mockIds.messages }];
  }
  
  if (sql.includes('FROM messages WHERE user_id')) {
    return mockData.messages.filter(m => m.user_id == params[0]).reverse();
  }
  
  if (sql.includes('COUNT(*) as unread_count') || sql.includes('COUNT(*)') && sql.includes('is_read')) {
    const count = mockData.messages.filter(m => m.user_id == params[0] && m.is_read === 0).length;
    return [{ unread_count: count }];
  }
  
  if (sql.startsWith('UPDATE messages SET is_read')) {
    const msg = mockData.messages.find(m => m.id == params[1] && m.user_id == params[2]);
    if (msg) msg.is_read = 1;
    return [{ affectedRows: 1 }];
  }
  
  return [];
}

module.exports = { init, query, getPool };
