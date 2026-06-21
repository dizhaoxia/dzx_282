const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const SECRET_KEY = 'homestay-secret-key-2024';

function auth(requiredRole) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, SECRET_KEY);
      
      const users = await query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      if (users.length === 0) {
        return res.status(401).json({ message: '用户不存在' });
      }
      
      if (requiredRole && users[0].role !== requiredRole) {
        return res.status(403).json({ message: '权限不足' });
      }
      
      req.user = users[0];
      next();
    } catch (err) {
      return res.status(401).json({ message: '无效的认证令牌' });
    }
  };
}

module.exports = { auth, SECRET_KEY };
