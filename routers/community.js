// routers/community.js
import express from 'express';
import * as communityController from '../controllers/communityController.js';

const router = express.Router();

// GET /api/community/online-users - 获取当前在线用户
router.get('/online-users', communityController.getOnlineUsers);

// GET /api/community/moods - 获取社区心情列表
router.get('/moods', communityController.getCommunityMoods);

// GET /api/community/moods/:id - 获取社区心情详情
router.get('/moods/:id', communityController.getCommunityMoodById);

// POST /api/community/moods/:id/like - 点赞
router.post('/moods/:id/like', communityController.likeCommunityMood);

// POST /api/community/moods/:id/unlike - 取消点赞
router.post('/moods/:id/unlike', communityController.unlikeCommunityMood);

// POST /api/community/moods/:id/reply - 回复社区心情
router.post('/moods/:id/reply', communityController.replyToCommunityMood);

export default router;
