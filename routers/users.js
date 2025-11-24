import express from 'express';
import * as userController from "../controllers/userController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有用户路由都需要认证
router.use(authenticateToken);

// GET /api/users - 获取所有用户
router.get('/', userController.getAllUsers);

// GET /api/users/:id - 获取单个用户
router.get('/:id', userController.getUserById);

// POST /api/users - 创建用户
router.post('/', userController.createUser);

// PUT /api/users/:id - 更新用户
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - 删除用户
router.delete('/:id', userController.deleteUser);

export default router;
