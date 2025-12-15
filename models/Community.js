// models/Community.js
import { supabaseAdmin } from '../config/supabase.js';

// 获取当前在线用户
export const getOnlineUsers = async () => {
  const { data, error } = await supabaseAdmin.from('online_users').select('*');
  if (error) throw error;
  return data;
};

export default {
  getOnlineUsers,
};
