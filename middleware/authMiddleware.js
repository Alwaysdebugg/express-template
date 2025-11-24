// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization Bearer token
 */
export const authenticateToken = (req, res, next) => {
  // 从请求头获取 token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // 如果没有 token，返回 401
  if (!token) {
    return res.status(401).json({
      success: false,
      error: '未授权访问',
      message: '缺少认证 token。请在请求头中添加: Authorization: Bearer <token>',
    });
  }

  // 验证 token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Token 过期或无效
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token 已过期',
          message: '请重新登录获取新的 token',
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({
          success: false,
          error: 'Token 无效',
          message: '无法验证 token，请检查 token 是否正确',
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Token 验证失败',
        message: err.message,
      });
    }

    // 将用户信息附加到请求对象
    req.user = user;
    next();
  });
};

/**
 * 可选的认证中间件
 * 如果有 token 则验证，没有 token 也允许通过（用于公开但可选的认证端点）
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // 没有 token，继续执行但不附加用户信息
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    // 无论验证成功与否都继续执行
    next();
  });
};

export default authenticateToken;

