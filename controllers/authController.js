// controllers/authController.js
import UserModel from '../models/User.js';
import { generateToken } from '../utils/jwtUtils.js';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * 验证Google凭证
 */
export const verifyGoogleCredential = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: '缺少凭证',
        message: 'credential 字段是必需的',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '缺少邮箱',
        message: 'Google 凭证中缺少邮箱',
      });
    }

    // 查找或创建用户
    let user = await UserModel.getUserByEmail(email);
    if (!user) {
      const userData = {
        name: name || email.split('@')[0],
        email: email,
      };
      user = await UserModel.createUser(userData);
    }

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user,
      name,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
      message: 'Google login successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '验证凭证失败',
      message: error.message,
    });
  }
};

/**
 * 用户登录
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段',
        message: 'email 和 password 字段是必需的',
      });
    }

    // 查找用户
    const user = await UserModel.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '登录失败',
        message: '不存在该邮箱',
      });
    }

    // 验证密码
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: '登录失败',
        message: '该账户未设置密码，请先重置密码',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '登录失败',
        message: '邮箱或密码错误',
      });
    }

    // 生成 JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // 更新用户在线状态
    try {
      await communityModel.updateUserOnlineStatus(user.id, token);
    } catch (error) {
      console.error('更新用户在线状态失败:', error);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
      message: '登录成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败',
      message: error.message,
    });
  }
};

/**
 * 用户注册
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段',
        message: 'name、email 和 password 字段是必需的',
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码太短',
        message: '密码长度至少为 6 个字符',
      });
    }

    // 检查用户是否已存在
    const existingUser = await UserModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '用户已存在',
        message: '该邮箱已被注册',
      });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户（包含加密后的密码）
    const userData = { name, email, password_hash: passwordHash };
    const user = await UserModel.createUser(userData);

    // 生成 JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
      message: '注册成功',
    });
  } catch (error) {
    // 处理唯一约束错误
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: '用户已存在',
        message: '该邮箱已被注册',
      });
    }

    res.status(500).json({
      success: false,
      error: '注册失败',
      message: error.message,
    });
  }
};

/**
 * 获取当前用户信息（需要认证）
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user 由 authenticateToken 中间件附加
    const userId = req.user.id;

    const user = await UserModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
      message: error.message,
    });
  }
};

/**
 * 验证 token（用于前端检查 token 是否有效）
 */
export const verifyToken = async (req, res) => {
  try {
    // 如果中间件验证通过，说明 token 有效
    res.json({
      success: true,
      data: {
        user: req.user,
      },
      message: 'Token 有效',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '验证失败',
      message: error.message,
    });
  }
};

/**
 * 验证请求体中的 token (用于 OAuth 回调验证)
 */
export const verifyTokenFromBody = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: '缺少 token',
        message: '请求体中需要包含 token',
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token 无效',
          message: err.message,
        });
      }

      // 返回用户信息和原始 token (以匹配前端 authAPI.verifyCallbackToken 预期的 { user, accessToken })
      res.json({
        success: true,
        user: user, // AuthContext expects "user" at root or data.user?
        accessToken: token, // AuthContext expects "accessToken"
        // Adjusting response to match frontend expectations if necessary
        // AuthContext: const { user, accessToken } = await authAPI.verifyCallbackToken(token)
        // So this structure is expected at the ROOT of the JSON response.
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '验证失败',
      message: error.message,
    });
  }
};

/**
 * Google OAuth 回调处理
 */
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      throw new Error('User not found in request');
    }

    // 生成 JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // 重定向到前端回调页面
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login-callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
};
