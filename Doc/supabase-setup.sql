-- Supabase 数据库设置 SQL 脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本

-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- 密码哈希（使用 bcrypt 加密）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器：在更新 users 表时自动更新 updated_at 字段
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 注意：示例数据不包含密码，需要通过注册 API 创建用户
-- 如果需要测试，请使用 POST /api/auth/register 接口注册用户

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 如果需要启用 Row Level Security (RLS)，取消下面的注释
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 如果需要允许所有操作（仅用于开发环境），取消下面的注释
-- CREATE POLICY "Allow all operations" ON users FOR ALL USING (true) WITH CHECK (true);

