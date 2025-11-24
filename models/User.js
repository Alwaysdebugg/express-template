// models/User.js
import { supabaseAdmin } from '../config/supabase.js';

// 获取所有用户
async function getAllUsers() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取所有用户失败:', error);
    throw error;
  }
}

// 根据ID获取用户
async function getUserById(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('获取用户失败:', error);
    throw error;
  }
}

// 根据邮箱获取用户（用于登录验证）
async function getUserByEmail(email) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('根据邮箱获取用户失败:', error);
    throw error;
  }
}

// 创建用户
async function createUser(userData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 更新用户
async function updateUser(id, userData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

// 删除用户
async function deleteUser(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
}

export default {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
