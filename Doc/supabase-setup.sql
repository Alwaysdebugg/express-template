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

--- 12/26

-- Table: moods
-- 1. 删除旧的 JSONB 互动字段
ALTER TABLE moods DROP COLUMN IF EXISTS interactions;

-- 2. 添加统一的点赞计数器（冗余字段，用于快速读取）
ALTER TABLE moods ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. (可选) 确保 reply_count 字段存在（你之前的 SQL 已包含，这里做检查）
-- ALTER TABLE moods ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- 创建 interactions 表（核心社交功能）

CREATE TABLE IF NOT EXISTS interactions (
    id BIGSERIAL PRIMARY KEY,
    mood_id BIGINT NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 对应你文档中的 5 种互动类型
    interaction_type VARCHAR(20) NOT NULL CHECK (
        interaction_type IN ('empathy', 'support', 'helpful', 'grateful', 'encourage')
    ),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 核心约束：同一个用户对同一个心情，每种互动类型只能操作一次
    CONSTRAINT unique_user_mood_interaction UNIQUE(user_id, mood_id, interaction_type)
);

-- 索引：方便查询某条心情的所有互动，或某个用户的所有互动
CREATE INDEX IF NOT EXISTS idx_interactions_mood_id ON interactions(mood_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);


-- 创建 comments 表（回复功能）

CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    mood_id BIGINT NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 支持二级回复：如果 parent_id 不为空，说明是回复别人的评论
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引：提高获取某条心情下所有评论的速度
CREATE INDEX IF NOT EXISTS idx_comments_mood_id ON comments(mood_id);
-- 触发器：复用你已有的更新时间函数
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- 12/28
-- topics 表 (话题主表)
-- 存储话题元数据
CREATE TABLE IF NOT EXISTS topics (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL, -- 唯一标识，用于 URL，如 'work-stress'
  name VARCHAR(50) NOT NULL,        -- 显示名称，如 '工作压力'
  description TEXT,                 -- 话题简介
  icon_url TEXT,                    -- 话题图标
  post_count INTEGER DEFAULT 0,     -- 冗余统计：该话题下的帖子总数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始一些话题
INSERT INTO topics (slug, name) VALUES ('daily', '日常碎碎念'), ('growth', '自我成长');

-- mood_topics 表 (关联表)
-- 将心情记录与话题连接起来
CREATE TABLE IF NOT EXISTS mood_topics (
  mood_id BIGINT NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (mood_id, topic_id)
);

CREATE INDEX idx_topic_moods ON mood_topics(topic_id);
