// models/Community.js
import { supabaseAdmin } from '../config/supabase.js';

// 更新用户在线状态（心跳机制）
export const updateUserOnlineStatus = async (
  userId,
  sessionId = null,
  additionalInfo = {}
) => {
  try {
    const now = new Date().toISOString();

    // 构建更新/插入数据
    const onlineData = {
      user_id: userId,
      last_active_at: now,
      session_id: sessionId || `session_${userId}_${Date.now()}`,
      ...additionalInfo, // 可以包含 ip_address, user_agent 等
    };

    // 使用 upsert：如果存在则更新，不存在则插入
    const { data, error } = await supabaseAdmin
      .from('online_users')
      .upsert(onlineData, {
        onConflict: 'user_id,session_id', // 根据唯一约束
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('更新在线状态失败:', error);
    throw error;
  }
};

// 获取当前在线用户列表
export const getOnlineUsers = async (timeoutMinutes = 5) => {
  try {
    // 计算超时时间点
    const timeoutTime = new Date();
    timeoutTime.setMinutes(timeoutTime.getMinutes() - timeoutMinutes);

    // 查询最近活跃的用户，并关联用户信息
    const { data, error } = await supabaseAdmin
      .from('online_users')
      .select(
        `
        *,
        users (
          id,
          name,
          email
        )
      `
      )
      .gte('last_active_at', timeoutTime.toISOString())
      .order('last_active_at', { ascending: false });

    if (error) throw error;

    // 处理数据，去重（同一用户可能有多条记录）
    const uniqueUsers = new Map();
    data.forEach(record => {
      const userId = record.user_id;
      if (
        !uniqueUsers.has(userId) ||
        new Date(record.last_active_at) >
          new Date(uniqueUsers.get(userId).last_active_at)
      ) {
        uniqueUsers.set(userId, {
          id: record.users.id,
          name: record.users.name,
          email: record.users.email,
          isOnline: true,
          lastActive: record.last_active_at,
          sessionId: record.session_id,
        });
      }
    });

    return Array.from(uniqueUsers.values());
  } catch (error) {
    console.error('获取在线用户失败:', error);
    throw error;
  }
};

// 获取在线用户数量
export const getOnlineUsersCount = async (timeoutMinutes = 5) => {
  try {
    const timeoutTime = new Date();
    timeoutTime.setMinutes(timeoutTime.getMinutes() - timeoutMinutes);

    const { data, error } = await supabaseAdmin
      .from('online_users')
      .select('user_id', { count: 'exact', head: true })
      .gte('last_active_at', timeoutTime.toISOString());

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('获取在线用户数量失败:', error);
    throw error;
  }
};

// 移除用户在线状态（用户登出时调用）
export const removeUserOnlineStatus = async (userId, sessionId = null) => {
  try {
    let query = supabaseAdmin
      .from('online_users')
      .delete()
      .eq('user_id', userId);

    // 如果提供了 session_id，只删除该会话
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('移除在线状态失败:', error);
    throw error;
  }
};

// 清理过期的在线状态（定期任务）
export const cleanupExpiredOnlineUsers = async (timeoutMinutes = 5) => {
  try {
    const timeoutTime = new Date();
    timeoutTime.setMinutes(timeoutTime.getMinutes() - timeoutMinutes);

    const { error } = await supabaseAdmin
      .from('online_users')
      .delete()
      .lt('last_active_at', timeoutTime.toISOString());

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('清理过期在线状态失败:', error);
    throw error;
  }
};

export default {
  updateUserOnlineStatus,
  getOnlineUsers,
  getOnlineUsersCount,
  removeUserOnlineStatus,
  cleanupExpiredOnlineUsers,
};
