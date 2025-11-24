// utils/jwtUtils.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // 默认 24 小时

/**
 * 生成 JWT token
 * @param {Object} payload - 要编码到 token 中的数据（通常是用户信息）
 * @param {string} expiresIn - token 过期时间（可选，默认使用环境变量）
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
};

/**
 * 验证 JWT token
 * @param {string} token - 要验证的 token
 * @returns {Object|null} 解码后的 payload，如果无效则返回 null
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * 解码 token（不验证签名）
 * @param {string} token - 要解码的 token
 * @returns {Object|null} 解码后的 payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
};

