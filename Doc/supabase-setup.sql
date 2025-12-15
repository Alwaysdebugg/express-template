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

-- 创建 moods 表
CREATE TABLE IF NOT EXISTS moods (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 心情类型：使用枚举类型
  mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN ('very_bad', 'bad', 'neutral', 'good', 'excellent')),
  
  -- 心情笔记
  note TEXT DEFAULT '',
  
  -- 影响因素（触发器）- 使用 JSONB 存储数组
  triggers JSONB DEFAULT '[]'::jsonb,
  
  -- 隐私设置
  is_public BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- 互动统计（用于社区功能）
  interactions JSONB DEFAULT '{"empathy": 0, "support": 0, "helpful": 0, "grateful": 0, "encourage": 0}'::jsonb,
  
  -- 回复数量
  reply_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建触发器：在更新 moods 表时自动更新 updated_at 字段
CREATE TRIGGER update_moods_updated_at 
    BEFORE UPDATE ON moods
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moods_is_public ON moods(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_moods_user_created ON moods(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moods_mood_type ON moods(mood_type);
CREATE INDEX IF NOT EXISTS idx_moods_triggers ON moods USING GIN (triggers);

-- 如果需要启用 Row Level Security (RLS)
-- ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- RLS 策略示例
-- CREATE POLICY "Users can view own moods and public moods" 
--   ON moods FOR SELECT 
--   USING (auth.uid()::bigint = user_id OR is_public = true);

-- CREATE POLICY "Users can insert own moods" 
--   ON moods FOR INSERT 
--   WITH CHECK (auth.uid()::bigint = user_id);

-- CREATE POLICY "Users can update own moods" 
--   ON moods FOR UPDATE 
--   USING (auth.uid()::bigint = user_id);

-- CREATE POLICY "Users can delete own moods" 
--   ON moods FOR DELETE 
--   USING (auth.uid()::bigint = user_id);