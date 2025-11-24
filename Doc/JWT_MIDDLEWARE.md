# JWT 中间件使用指南

## 📋 概述

项目已集成 JWT（JSON Web Token）认证中间件，用于保护需要身份验证的 API 端点。

## 🔧 配置

### 环境变量

在 `.env` 文件中配置：

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=24h
```

- `JWT_SECRET`: JWT 签名密钥（生产环境请使用强随机字符串，至少 32 个字符）
- `JWT_EXPIRES_IN`: Token 过期时间（例如：`24h`, `7d`, `30d`）

## 📁 文件结构

```
express/
├── middleware/
│   └── authMiddleware.js    # JWT 认证中间件
├── utils/
│   └── jwtUtils.js          # JWT 工具函数
├── controllers/
│   └── authController.js    # 认证控制器
└── routers/
    └── auth.js              # 认证路由
```

## 🚀 使用方法

### 1. 在路由中使用中间件

#### 保护单个路由

```javascript
import { authenticateToken } from '../middleware/authMiddleware.js';

router.get('/protected', authenticateToken, (req, res) => {
  // req.user 包含解码后的用户信息
  res.json({ user: req.user });
});
```

#### 保护多个路由

```javascript
import { authenticateToken } from '../middleware/authMiddleware.js';

// 所有路由都需要认证
router.use(authenticateToken);

router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', (req, res) => {
  // 更新用户信息
});
```

#### 可选认证（公开但可识别用户）

```javascript
import { optionalAuth } from '../middleware/authMiddleware.js';

router.get('/public', optionalAuth, (req, res) => {
  if (req.user) {
    // 已登录用户
    res.json({ message: '欢迎回来', user: req.user });
  } else {
    // 未登录用户
    res.json({ message: '欢迎，请登录' });
  }
});
```

### 2. 生成 Token

在控制器中使用 `generateToken`：

```javascript
import { generateToken } from '../utils/jwtUtils.js';

const token = generateToken({
  id: user.id,
  email: user.email,
  name: user.name,
});
```

### 3. 验证 Token

```javascript
import { verifyToken } from '../utils/jwtUtils.js';

const decoded = verifyToken(token);
if (decoded) {
  console.log('Token 有效:', decoded);
} else {
  console.log('Token 无效或已过期');
}
```

## 📡 API 端点

### 认证端点

#### 注册
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功"
}
```

#### 登录
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

#### 获取当前用户（需要认证）
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 验证 Token（需要认证）
```bash
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔒 保护路由示例

### 示例 1：保护用户路由

更新 `routers/users.js`：

```javascript
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有用户路由都需要认证
router.use(authenticateToken);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
```

### 示例 2：部分保护

```javascript
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 公开：获取所有用户
router.get('/', userController.getAllUsers);

// 公开：获取单个用户
router.get('/:id', userController.getUserById);

// 需要认证：创建用户
router.post('/', authenticateToken, userController.createUser);

// 需要认证：更新用户（只能更新自己的信息）
router.put('/:id', authenticateToken, (req, res, next) => {
  // 检查是否是自己的 ID
  if (parseInt(req.params.id) !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权访问',
      message: '只能更新自己的信息',
    });
  }
  next();
}, userController.updateUser);

// 需要认证：删除用户
router.delete('/:id', authenticateToken, userController.deleteUser);

export default router;
```

## 🧪 测试示例

### 使用 curl

```bash
# 1. 注册
curl -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","password":"123456"}'

# 2. 登录（保存 token）
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 3. 使用 token 访问受保护的路由
curl http://127.0.0.1:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 使用 JavaScript (fetch)

```javascript
// 登录
const loginResponse = await fetch('http://127.0.0.1:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: '123456',
  }),
});

const { data } = await loginResponse.json();
const token = data.token;

// 使用 token 访问受保护的路由
const meResponse = await fetch('http://127.0.0.1:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const userData = await meResponse.json();
console.log(userData);
```

## ⚠️ 错误处理

中间件会自动处理以下错误：

1. **缺少 Token** (401)
   ```json
   {
     "success": false,
     "error": "未授权访问",
     "message": "缺少认证 token。请在请求头中添加: Authorization: Bearer <token>"
   }
   ```

2. **Token 过期** (401)
   ```json
   {
     "success": false,
     "error": "Token 已过期",
     "message": "请重新登录获取新的 token"
   }
   ```

3. **Token 无效** (403)
   ```json
   {
     "success": false,
     "error": "Token 无效",
     "message": "无法验证 token，请检查 token 是否正确"
   }
   ```

## 🔐 安全建议

1. **使用强密钥**：生产环境使用至少 32 个字符的随机字符串作为 `JWT_SECRET`
2. **HTTPS**：生产环境必须使用 HTTPS 传输 token
3. **Token 过期时间**：根据应用需求设置合理的过期时间
4. **密码加密**：实际项目中应使用 bcrypt 加密存储密码
5. **刷新 Token**：考虑实现 refresh token 机制
6. **Token 存储**：前端应安全存储 token（如 httpOnly cookie 或 secure storage）

## 📚 相关文件

- `middleware/authMiddleware.js` - JWT 认证中间件
- `utils/jwtUtils.js` - JWT 工具函数
- `controllers/authController.js` - 认证控制器
- `routers/auth.js` - 认证路由

