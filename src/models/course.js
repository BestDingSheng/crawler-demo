const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'page_id'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'desc'
  },
  imgUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'img_url'
  },
  publishTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'publish_time'
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  detailInfo: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'detail_info'
  },
  downloadLink: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'download_link'
  }
}, {
  tableName: 'courses',
  timestamps: true,
  underscored: true
});

module.exports = Course; 