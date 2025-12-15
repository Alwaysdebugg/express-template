import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from './config/passport.js';
import usersRouter from './routers/users.js';
import authRouter from './routers/auth.js';
import oauthRouter from './routers/oauth.js';
import moodRouter from './routers/moods.js';
import communityRouter from './routers/community.js';
import { OAuth2Client } from 'google-auth-library';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化 Passport
app.use(passport.initialize());

// CORS 配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // 生产环境应该设置为具体的域名
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// 中间件：解析 JSON 请求体
app.use(express.json());

// 中间件：解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));

// 中间件：日志记录
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 静态文件服务
app.use(express.static('public'));

// ==================== 路由示例 ====================

// 首页
app.get('/', (req, res) => {
  res.send(`
    <h1>Express MVC 架构示例</h1>
    <h2>认证 API（公开）：</h2>
    <ul>
      <li>POST   /api/auth/register  - 用户注册</li>
      <li>POST   /api/auth/login     - 用户登录</li>
      <li>GET    /api/auth/me        - 获取当前用户（需要认证）</li>
      <li>GET    /api/auth/verify    - 验证 token（需要认证）</li>
    </ul>
    <h2>用户 API（需要认证）：</h2>
    <ul>
      <li>GET    /api/users          - 获取所有用户</li>
      <li>GET    /api/users/:id      - 获取单个用户</li>
      <li>POST   /api/users          - 创建用户</li>
      <li>PUT    /api/users/:id      - 更新用户</li>
      <li>DELETE /api/users/:id      - 删除用户</li>
    </ul>
    <p><strong>注意：</strong>所有用户 API 都需要在请求头中添加 <code>Authorization: Bearer &lt;token&gt;</code> 来访问</p>
  `);
});

// API 路由
app.use('/api/auth', authRouter); // 认证路由（公开）
app.use('/api/users', usersRouter); // 用户路由
app.use('/oauth2', oauthRouter); // OAuth 路由

app.use('/api/moods', moodRouter); // 心情记录
// app.use('/api/community', communityRouter); // 社区互动路由

// ==================== 404 处理 ====================
app.use((req, res) => {
  res.status(404).json({
    error: '路由不存在',
    path: req.url,
  });
});

// ==================== 错误处理中间件 ====================
app.use((err, req, res, next) => {
  console.error('错误:', err.message);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  });
});

// ==================== 启动服务器 ====================
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 服务器运行在 http://127.0.0.1:${PORT}`);
});
