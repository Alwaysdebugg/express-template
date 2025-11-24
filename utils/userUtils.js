// utils/userUtils.js

/**
 * 从用户对象中移除敏感信息（如 password_hash）
 * @param {Object} user - 用户对象
 * @returns {Object} 清理后的用户对象
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  
  const { password_hash, ...sanitizedUser } = user;
  return sanitizedUser;
};

/**
 * 从用户数组中移除敏感信息
 * @param {Array} users - 用户对象数组
 * @returns {Array} 清理后的用户对象数组
 */
export const sanitizeUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(user => sanitizeUser(user));
};

