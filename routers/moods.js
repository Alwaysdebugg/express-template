// routers/moods.js
import express from 'express';
import * as moodController from '../controllers/moodController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有心情记录路由都需要认证
router.use(authenticateToken);

// GET /api/moods - 获取心情记录列表
router.get('/', moodController.getMoods);

// POST /api/moods - 创建心情记录
router.post('/', moodController.createMood);

// GET /api/moods/:id - 获取心情记录详情
router.get('/:id', moodController.getMoodById);

// DELETE /api/moods/:id - 删除心情记录
router.delete('/:id', moodController.deleteMoodById);

export default router;
