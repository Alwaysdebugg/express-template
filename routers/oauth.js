import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

// Google 登录入口
// 对应前端 authAPI.getGoogleLoginUrl() 生成的路径 /oauth2/authorization/google
router.get('/authorization/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

export default router;

