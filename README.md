# Express API 后端模板

一个基于 Express.js 的 RESTful API 后端模板，集成了 JWT 认证、Supabase 数据库、密码加密等常用功能。

## ✨ 特性

- ✅ **MVC 架构** - 清晰的代码组织结构
- ✅ **JWT 认证** - 基于 JSON Web Token 的身份验证
- ✅ **密码加密** - 使用 bcrypt 加密存储密码
- ✅ **Supabase 集成** - 使用 Supabase 作为数据库
- ✅ **CORS 支持** - 跨域资源共享配置
- ✅ **错误处理** - 统一的错误处理机制
- ✅ **环境变量** - 使用 dotenv 管理配置

## 📋 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase 账户（用于数据库）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd express
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置信息：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=24h

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. 设置 Supabase 数据库

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 创建新项目或选择现有项目
3. 进入 **SQL Editor**，执行 `Doc/supabase-setup.sql` 中的 SQL 脚本
4. 在 **Project Settings** → **API** 中获取凭证并填入 `.env` 文件

详细步骤请参考 [Supabase 配置指南](Doc/SUPABASE_SETUP.md)

### 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://127.0.0.1:3000` 启动。

## 📚 API 文档

### 认证 API

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "token": "jwt_token_here"
  },
  "message": "注册成功"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "token": "jwt_token_here"
  },
  "message": "登录成功"
}
```

#### 获取当前用户信息（需要认证）
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### 验证 Token（需要认证）
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### 用户 API（需要认证）

所有用户 API 都需要在请求头中添加认证 token：

```http
Authorization: Bearer <your_jwt_token>
```

#### 获取所有用户
```http
GET /api/users
Authorization: Bearer <token>
```

#### 获取单个用户
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### 创建用户
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "email": "lisi@example.com"
}
```

#### 更新用户
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名字",
  "email": "updated@example.com"
}
```

#### 删除用户
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## 🧪 测试 API

### 使用 curl

```bash
# 注册用户
curl -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"password123"}'

# 登录
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 获取当前用户（替换 <token> 为实际的 token）
curl http://127.0.0.1:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# 获取所有用户
curl http://127.0.0.1:3000/api/users \
  -H "Authorization: Bearer <token>"
```

### 使用测试脚本

项目包含一个测试脚本 `Doc/test-jwt.sh`，可以用于测试 JWT 认证功能。

## 📁 项目结构

```
express/
├── config/                 # 配置文件
│   └── supabase.js        # Supabase 客户端配置
├── controllers/           # 控制器（业务逻辑）
│   ├── authController.js  # 认证控制器
│   └── userController.js  # 用户控制器
├── middleware/            # 中间件
│   └── authMiddleware.js  # JWT 认证中间件
├── models/                # 数据模型
│   └── User.js           # 用户模型
├── routers/              # 路由
│   ├── auth.js          # 认证路由
│   └── users.js         # 用户路由
├── utils/               # 工具函数
│   └── jwtUtils.js     # JWT 工具函数
├── Doc/                # 文档
│   ├── JWT_MIDDLEWARE.md      # JWT 中间件使用指南
│   ├── SUPABASE_SETUP.md      # Supabase 配置指南
│   ├── supabase-setup.sql     # 数据库初始化 SQL
│   └── test-jwt.sh            # JWT 测试脚本
├── public/             # 静态文件
├── .env.example        # 环境变量模板
├── .gitignore         # Git 忽略文件
├── index.js           # 应用入口文件
├── package.json       # 项目配置
└── README.md          # 本文件
```

## 🔒 安全特性

- **密码加密**：使用 bcrypt 加密存储密码
- **JWT 认证**：基于 token 的无状态认证
- **CORS 配置**：可配置的跨域资源共享
- **环境变量**：敏感信息存储在环境变量中
- **错误处理**：统一的错误响应格式，不泄露敏感信息

## 📖 相关文档

- [JWT 中间件使用指南](Doc/JWT_MIDDLEWARE.md)
- [Supabase 配置指南](Doc/SUPABASE_SETUP.md)

## 🛠️ 技术栈

- **框架**：Express.js 5.x
- **数据库**：Supabase (PostgreSQL)
- **认证**：JSON Web Token (JWT)
- **密码加密**：bcryptjs
- **环境变量**：dotenv
- **CORS**：cors

## 📝 开发说明

### 添加新的路由

1. 在 `routers/` 目录创建路由文件
2. 在 `controllers/` 目录创建对应的控制器
3. 在 `index.js` 中注册路由

### 添加新的中间件

在 `middleware/` 目录创建中间件文件，然后在路由或 `index.js` 中使用。

### 数据库操作

在 `models/` 目录创建模型文件，使用 Supabase 客户端进行数据库操作。

## ⚠️ 注意事项

1. **生产环境配置**：
   - 修改默认的 `JWT_SECRET` 为强随机字符串（至少 32 个字符）
   - 设置 `NODE_ENV=production`
   - 配置适当的 CORS 源

2. **数据库安全**：
   - 不要在生产环境使用 `SUPABASE_SERVICE_ROLE_KEY` 在客户端
   - 配置 Row Level Security (RLS) 策略

3. **密码安全**：
   - 密码长度至少 6 个字符
   - 建议使用更强的密码策略

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

