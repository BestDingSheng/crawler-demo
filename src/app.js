const express = require('express');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 引入路由
const courseRoutes = require('./routes/course');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection Test
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Crawler API' });
});

// 注册路由
app.use('/api', courseRoutes);

// 仅在直接运行时启动服务器
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app; 