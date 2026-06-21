const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 50323;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = require('./config/db');
db.init();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => {
  res.json({ message: '民宿短租平台API服务已启动' });
});

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});
