# Node.js Web Crawler

一个基于 Node.js 的网页爬虫项目，支持数据存储到本地文件和 MySQL 数据库。

## 功能特点

- 自动登录和 Cookie 管理
- 课程列表爬取
- 课程详情页爬取
- 下载链接获取
- 本地 JSON 文件存储
- MySQL 数据库存储
- RESTful API 接口

## 技术栈

- Node.js
- Puppeteer (浏览器自动化)
- Express (Web框架)
- MySQL (Sequelize ORM)
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

5. 启动服务：
```bash
npm start
```

## 项目结构

```
src/
  ├── config/         # 配置文件
  ├── controllers/    # 控制器
  ├── models/         # 数据模型
  ├── services/       # 服务层
  │   ├── crawler.js  # 爬虫服务
  │   └── auth.js     # 认证服务
  ├── utils/          # 工具函数
  │   └── storage.js  # 存储工具
  └── test/          # 测试文件
data/
  └── courses.json   # 课程数据存储文件
```

## API 接口文档

### 1. 获取课程列表

**接口路径:** `/api/courses`  
**请求方式:** GET

**请求参数:**
```typescript
{
  type?: string;    // 可选，课程类型
  page?: number;    // 可选，页码，默认值: 1
  pageSize?: number; // 可选，每页数量，默认值: 10
}
```

**课程类型枚举:**
- 中创网
- 福源论坛
- 冒泡网
- 自学成才网

**返回结构:**
```typescript
{
  code: number;     // 状态码，0 表示成功
  message?: string; // 错误信息，仅在失败时返回
  result?: {
    list: Array<{
      pageId: number;      // 课程ID
      type: string;        // 课程类型
      title: string;       // 课程标题
      desc: string;        // 课程描述
      imgUrl: string;      // 课程图片
      publishTime: string; // 发布时间
      link: string;        // 课程链接
    }>;
    total: number;    // 总记录数
    page: number;     // 当前页码
    pageSize: number; // 每页数量
  }
}
```

### 2. 获取课程详情

**接口路径:** `/api/courses/:pageId`  
**请求方式:** GET

**请求参数:**
```typescript
{
  pageId: number;  // 必填，课程ID（路径参数）
}
```

**返回结构:**
```typescript
{
  code: number;     // 状态码，0 表示成功
  message?: string; // 错误信息，仅在失败时返回
  result?: {
    pageId: number;      // 课程ID
    type: string;        // 课程类型
    title: string;       // 课程标题
    desc: string;        // 课程描述
    imgUrl: string;      // 课程图片
    publishTime: string; // 发布时间
    link: string;        // 课程链接
    detailInfo: string;  // 课程详细信息
    downloadLink: string; // 下载链接
  }
}
```

### 错误码说明
- 0: 成功
- 20002: 无效的课程类型
- 20003: 获取课程列表失败
- 20004: pageId不能为空
- 20005: 课程不存在
- 20006: 获取课程详情失败

## 数据存储

### 本地文件存储
- 数据以 JSON 格式存储在 `data/courses.json`
- 支持增量更新，使用 `pageId` 去重
- 自动记录更新时间和总数据量

### 数据库存储
- 使用 MySQL 存储结构化数据
- Sequelize ORM 处理数据库操作
- 支持数据迁移和备份

## 注意事项

- 请遵守目标网站的爬虫政策
- 适当设置爬取延迟，避免对目标站点造成压力
- 定期备份数据
- 建议同时使用文件存储和数据库存储，确保数据安全 