// routers/community.js
import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
const router = express.Router();

// GET /api/community/online-users - 获取当前在线用户
router.get('/online-users', communityController.getOnlineUsers);

// POST /api/community/online-status/heartbeat - 更新在线状态（心跳）
router.post(
  '/online-status/heartbeat',
  authenticateToken,
  communityController.updateOnlineStatus
);

// POST /api/community/online-status/remove - 移除在线状态（登出）
router.post(
  '/online-status/remove',
  authenticateToken,
  communityController.removeOnlineStatus
);

// GET /api/community/topics - 获取社区话题
router.get('/topics', communityController.getCommunityTopics);

// GET /api/community/moods - 获取社区心情列表（可选认证，有token时返回用户互动状态）
router.get('/moods', optionalAuth, communityController.getCommunityMoods);

// GET /api/community/moods/:id - 获取社区心情详情
router.get('/moods/:id', communityController.getCommunityMoodById);

// POST /api/community/moods/:id/like - 点赞
router.post('/moods/:id/like', communityController.likeCommunityMood);

// POST /api/community/moods/:id/unlike - 取消点赞
router.post('/moods/:id/unlike', communityController.unlikeCommunityMood);

// POST /api/community/moods/:id/reply - 回复社区心情
router.post('/moods/:id/reply', authenticateToken, communityController.replyToCommunityMood);

// POST /api/community/moods/:id/interaction - 添加互动
router.post('/moods/:id/interaction', authenticateToken, communityController.addInteraction);

export default router;
