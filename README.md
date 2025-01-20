# Node.js Web Crawler

一个基于 Node.js 的网页爬虫项目，支持数据存储到本地文件和 MySQL 数据库。

## 功能特点

- 自动登录和 Cookie 管理
- 课程列表爬取
- 课程详情页爬取
- 下载链接获取
- 本地 JSON 文件存储
- MySQL 数据库存储（待实现）

## 技术栈

- Node.js
- Puppeteer (浏览器自动化)
- Express (待实现)
- MySQL (Sequelize ORM) (待实现)
- Winston (日志记录) (待实现)

## 项目设置

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`
   - 修改数据库配置和其他设置

3. 创建数据库（可选）：
```sql
CREATE DATABASE crawler_db;
```

4. 运行测试：
```bash
node src/test/crawler.test.js
```

## 项目结构

```
src/
  ├── config/         # 配置文件
  ├── controllers/    # 控制器（待实现）
  ├── models/        # 数据模型（待实现）
  ├── services/      # 服务层
  │   ├── crawler.js # 爬虫服务
  │   └── auth.js    # 认证服务
  ├── utils/         # 工具函数
  │   └── storage.js # 存储工具
  └── test/          # 测试文件
data/
  └── courses.json   # 课程数据存储文件
```

## 数据存储

### 本地文件存储
- 数据以 JSON 格式存储在 `data/courses.json`
- 支持增量更新，使用 `pageId` 去重
- 自动记录更新时间和总数据量

### 数据库存储（待实现）
- 使用 MySQL 存储结构化数据
- Sequelize ORM 处理数据库操作
- 支持数据迁移和备份

## 注意事项

- 请遵守目标网站的爬虫政策
- 适当设置爬取延迟，避免对目标站点造成压力
- 定期备份数据
- 建议同时使用文件存储和数据库存储，确保数据安全 