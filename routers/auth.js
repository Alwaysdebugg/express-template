// routers/auth.js
import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register - 用户注册（公开）
router.post('/register', authController.register);

// POST /api/auth/login - 用户登录（公开）
router.post('/login', authController.login);

// GET /api/auth/me - 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.getCurrentUser);

// GET /api/auth/verify - 验证 token（需要认证）
router.get('/verify', authenticateToken, authController.verifyToken);

export default router;

