// controllers/authController.js
import UserModel from '../models/User.js';
import { generateToken } from '../utils/jwtUtils.js';
import bcrypt from 'bcryptjs';

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

