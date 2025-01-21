const sequelize = require('../config/database');
const Course = require('./course');

async function initDatabase() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步模型到数据库（创建表）
    await sequelize.sync({ alter: true });
    console.log('数据库表同步完成');

  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

module.exports = initDatabase; 