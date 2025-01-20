# Node.js Web Crawler

一个基于 Node.js 的网页爬虫项目，支持数据存储到 MySQL 数据库。

## 技术栈

- Node.js
- Express
- Puppeteer
- MySQL (Sequelize ORM)
- Winston (日志记录)

## 项目设置

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`
   - 修改数据库配置和其他设置

3. 创建数据库：
```sql
CREATE DATABASE crawler_db;
```

4. 运行项目：
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 项目结构

```
src/
  ├── config/         # 配置文件
  ├── controllers/    # 控制器
  ├── models/        # 数据模型
  ├── services/      # 服务层
  ├── utils/         # 工具函数
  └── app.js         # 应用入口
```

## 使用说明

1. 爬虫服务位于 `src/services/crawler.js`
2. 通过 API 接口控制爬虫行为
3. 数据自动保存到 MySQL 数据库

## 注意事项

- 请遵守目标网站的爬虫政策
- 适当设置爬取延迟，避免对目标站点造成压力
- 定期备份数据库 