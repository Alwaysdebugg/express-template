// config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ 缺少 Supabase 环境变量配置。\n' +
    '请检查 .env 文件中的 SUPABASE_URL 和 SUPABASE_ANON_KEY\n' +
    '获取方式：Supabase Dashboard -> Project Settings -> API'
  );
}

// 验证 URL 格式
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(
    '❌ SUPABASE_URL 格式错误。\n' +
    `当前值: ${supabaseUrl}\n` +
    '正确格式应该是: https://your-project-id.supabase.co\n' +
    '注意：不要使用 PostgreSQL 连接字符串，应该使用 API URL'
  );
}

// 检查是否是占位符
if (supabaseUrl.includes('your_supabase_project_url') || 
    supabaseAnonKey.includes('your_supabase_anon_key')) {
  throw new Error(
    '❌ 请替换 .env 文件中的占位符为实际的 Supabase 凭证。\n' +
    '获取方式：Supabase Dashboard -> Project Settings -> API'
  );
}

// 创建客户端（使用 anon key，适用于客户端操作）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 创建服务端客户端（使用 service_role key，绕过 RLS）
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;

