# 数据库表结构文档

> 生成时间: 2026-01-18  
> 数据库类型: PostgreSQL (Supabase)  
> Schema: public

## 📊 表概览

| 表名 | 说明 | 行数 | RLS 启用 | 主键 |
|------|------|------|----------|------|
| `users` | 用户信息 | 0 | ❌ | id |
| `moods` | 心情记录 | 0 | ❌ | id |
| `online_users` | 在线用户状态 | 0 | ❌ | id |
| `interactions` | 互动记录 | 0 | ❌ | id |
| `comments` | 评论/回复 | 0 | ❌ | id |
| `topics` | 话题分类 | 0 | ❌ | id |
| `mood_topics` | 心情-话题关联 | 0 | ❌ | (mood_id, topic_id) |

---

## 1. `users` 表 - 用户信息

**描述**: 存储用户基本信息和认证数据

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `id` | bigint | PRIMARY KEY, AUTO INCREMENT | nextval('users_id_seq') | 用户唯一标识 |
| `name` | varchar(255) | NOT NULL | - | 用户名 |
| `email` | varchar(255) | NOT NULL, UNIQUE | - | 用户邮箱 |
| `password_hash` | varchar(255) | NULLABLE | - | 密码哈希（bcrypt 加密） |
| `created_at` | timestamptz | NOT NULL | timezone('utc', now()) | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | timezone('utc', now()) | 更新时间 |

### 索引

- `PRIMARY KEY`: `id`
- `UNIQUE INDEX`: `email`
- `INDEX`: `idx_users_email` ON `email`
- `INDEX`: `idx_users_created_at` ON `created_at DESC`

### 外键关系

**被引用表**:

- `moods.user_id` → `users.id`
- `online_users.user_id` → `users.id`
- `interactions.user_id` → `users.id`
- `comments.user_id` → `users.id`

### 触发器

- `update_users_updated_at`: 自动更新 `updated_at` 字段

---

## 2. `moods` 表 - 心情记录

**描述**: 存储用户的心情记录，支持公开分享和匿名发布

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `id` | bigint | PRIMARY KEY, AUTO INCREMENT | nextval('moods_id_seq') | 心情记录唯一标识 |
| `user_id` | bigint | NOT NULL, FOREIGN KEY | - | 用户 ID（外键） |
| `mood_type` | varchar(20) | NOT NULL, CHECK | - | 心情类型 |
| `note` | text | NULLABLE | '' | 心情笔记 |
| `triggers` | jsonb | NULLABLE | '[]' | 影响因素数组 |
| `is_public` | boolean | NULLABLE | false | 是否公开 |
| `is_anonymous` | boolean | NULLABLE | false | 是否匿名 |
| `likes_count` | integer | NULLABLE | 0 | 点赞数（冗余字段） |
| `reply_count` | integer | NULLABLE | 0 | 回复数（冗余字段） |
| `created_at` | timestamptz | NOT NULL | timezone('utc', now()) | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | timezone('utc', now()) | 更新时间 |

### 约束

- **CHECK**: `mood_type` IN ('very_bad', 'bad', 'neutral', 'good', 'excellent')

### 索引

- `PRIMARY KEY`: `id`
- `INDEX`: `idx_moods_user_id` ON `user_id`
- `INDEX`: `idx_moods_created_at` ON `created_at DESC`
- `INDEX`: `idx_moods_is_public` ON `is_public` WHERE `is_public = true`
- `INDEX`: `idx_moods_user_created` ON `(user_id, created_at DESC)`
- `INDEX`: `idx_moods_mood_type` ON `mood_type`
- `GIN INDEX`: `idx_moods_triggers` ON `triggers`

### 外键关系

**引用表**:

- `user_id` → `users.id` (ON DELETE CASCADE)

**被引用表**:

- `comments.mood_id` → `moods.id`
- `mood_topics.mood_id` → `moods.id`
- `interactions.mood_id` → `moods.id`

### 触发器

- `update_moods_updated_at`: 自动更新 `updated_at` 字段

### 字段说明

#### `mood_type` 枚举值

| 值 | 说明 |
|-------|------|
| `very_bad` | 非常糟糕 |
| `bad` | 糟糕 |
| `neutral` | 一般 |
| `good` | 不错 |
| `excellent` | 非常好 |

#### `triggers` JSONB 格式

```json
["工作", "人际关系", "健康", "财务", "家庭"]
```

---

## 3. `online_users` 表 - 在线用户状态

**描述**: 跟踪当前在线用户的会话信息

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `id` | bigint | PRIMARY KEY, AUTO INCREMENT | nextval('online_users_id_seq') | 记录唯一标识 |
| `user_id` | bigint | NOT NULL, FOREIGN KEY | - | 用户 ID（外键） |
| `session_id` | varchar | NULLABLE | - | 会话 ID |
| `ip_address` | inet | NULLABLE | - | IP 地址 |
| `user_agent` | text | NULLABLE | - | 用户代理字符串 |
| `last_active_at` | timestamptz | NOT NULL | timezone('utc', now()) | 最后活跃时间 |
| `created_at` | timestamptz | NOT NULL | timezone('utc', now()) | 创建时间 |

### 索引

- `PRIMARY KEY`: `id`

### 外键关系

**引用表**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## 4. `interactions` 表 - 互动记录

**描述**: 存储用户对心情记录的互动（点赞、支持等）

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `id` | bigint | PRIMARY KEY, AUTO INCREMENT | nextval('interactions_id_seq') | 互动记录唯一标识 |
| `mood_id` | bigint | NOT NULL, FOREIGN KEY | - | 心情记录 ID（外键） |
| `user_id` | bigint | NOT NULL, FOREIGN KEY | - | 用户 ID（外键） |
| `interaction_type` | varchar(20) | NOT NULL, CHECK | - | 互动类型 |
| `created_at` | timestamptz | NULLABLE | CURRENT_TIMESTAMP | 创建时间 |

### 约束

- **CHECK**: `interaction_type` IN ('empathy', 'support', 'helpful', 'grateful', 'encourage')
- **UNIQUE**: `(user_id, mood_id, interaction_type)` - 同一用户对同一心情的同一类型互动只能有一次

### 索引

- `PRIMARY KEY`: `id`
- `INDEX`: `idx_interactions_mood_id` ON `mood_id`
- `INDEX`: `idx_interactions_user_id` ON `user_id`

### 外键关系

**引用表**:

- `mood_id` → `moods.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

### 字段说明

#### `interaction_type` 枚举值

| 值 | 说明 | 图标建议 |
|-------|------|----------|
| `empathy` | 共鸣 | 💙 |
| `support` | 支持 | 🤝 |
| `helpful` | 有帮助 | 💡 |
| `grateful` | 感谢 | 🙏 |
| `encourage` | 鼓励 | 💪 |

---

## 5. `comments` 表 - 评论/回复

**描述**: 存储用户对心情记录的评论和回复，支持二级回复

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `id` | bigint | PRIMARY KEY, AUTO INCREMENT | nextval('comments_id_seq') | 评论唯一标识 |
| `mood_id` | bigint | NOT NULL, FOREIGN KEY | - | 心情记录 ID（外键） |
| `user_id` | bigint | NOT NULL, FOREIGN KEY | - | 用户 ID（外键） |
| `parent_id` | bigint | NULLABLE, FOREIGN KEY | - | 父评论 ID（外键，支持二级回复） |
| `content` | text | NOT NULL | - | 评论内容 |
| `is_anonymous` | boolean | NULLABLE | false | 是否匿名 |
| `created_at` | timestamptz | NULLABLE | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | timestamptz | NULLABLE | CURRENT_TIMESTAMP | 更新时间 |

### 索引

- `PRIMARY KEY`: `id`
- `INDEX`: `idx_comments_mood_id` ON `mood_id`

### 外键关系

**引用表**:

- `mood_id` → `moods.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)
- `parent_id` → `comments.id` (ON DELETE CASCADE)

### 触发器

- `update_comments_updated_at`: 自动更新 `updated_at` 字段

### 使用说明

- **一级评论**: `parent_id` 为 NULL
- **二级回复**: `parent_id` 指向父评论的 ID

---

## 6. `topics` 表 - 话题分类

**描述**: 存储话题分类信息，用于组织和分类心情记录

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `id` | bigint | PRIMARY KEY, AUTO INCREMENT | nextval('topics_id_seq') | 话题唯一标识 |
| `slug` | varchar(50) | NOT NULL, UNIQUE | - | URL 友好标识符 |
| `name` | varchar(50) | NOT NULL | - | 话题显示名称 |
| `description` | text | NULLABLE | - | 话题简介 |
| `icon_url` | text | NULLABLE | - | 话题图标 URL |
| `post_count` | integer | NULLABLE | 0 | 帖子总数（冗余字段） |
| `created_at` | timestamptz | NULLABLE | now() | 创建时间 |

### 索引

- `PRIMARY KEY`: `id`
- `UNIQUE INDEX`: `slug`

### 外键关系

**被引用表**:

- `mood_topics.topic_id` → `topics.id`

### 初始数据

```sql
INSERT INTO topics (slug, name) VALUES 
  ('daily', '日常碎碎念'),
  ('growth', '自我成长');
```

---

## 7. `mood_topics` 表 - 心情-话题关联

**描述**: 多对多关联表，连接心情记录和话题

### 表结构

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| `mood_id` | bigint | PRIMARY KEY (part 1), FOREIGN KEY | - | 心情记录 ID（外键） |
| `topic_id` | bigint | PRIMARY KEY (part 2), FOREIGN KEY | - | 话题 ID（外键） |

### 索引

- `PRIMARY KEY`: `(mood_id, topic_id)` - 联合主键
- `INDEX`: `idx_topic_moods` ON `topic_id`

### 外键关系

**引用表**:

- `mood_id` → `moods.id` (ON DELETE CASCADE)
- `topic_id` → `topics.id` (ON DELETE CASCADE)

### 使用说明

- 一条心情记录可以关联多个话题
- 一个话题可以包含多条心情记录
- 删除心情记录或话题时，关联关系自动删除

---

## 🔗 表关系图

```
users (用户)
  ├─→ moods (心情记录)
  │     ├─→ interactions (互动)
  │     ├─→ comments (评论)
  │     └─→ mood_topics (话题关联)
  │           └─→ topics (话题)
  ├─→ online_users (在线状态)
  ├─→ interactions (互动)
  └─→ comments (评论)
        └─→ comments (二级回复)
```

## 📝 数据库设计说明

### 1. 级联删除策略

所有外键都设置了 `ON DELETE CASCADE`，确保数据一致性：

- 删除用户 → 自动删除其所有心情记录、互动、评论
- 删除心情记录 → 自动删除其所有互动、评论、话题关联
- 删除评论 → 自动删除其所有子评论

### 2. 冗余字段

为了提高查询性能，使用了以下冗余字段：

- `moods.likes_count`: 点赞数（避免每次 COUNT）
- `moods.reply_count`: 回复数（避免每次 COUNT）
- `topics.post_count`: 帖子数（避免每次 COUNT）

**注意**: 需要在应用层或使用触发器保持这些字段的同步更新。

### 3. JSONB 字段

- `moods.triggers`: 使用 JSONB 存储影响因素数组，支持灵活的查询和索引

### 4. 隐私和匿名

- `moods.is_public`: 控制心情记录是否公开到社区
- `moods.is_anonymous`: 公开时是否隐藏用户身份
- `comments.is_anonymous`: 评论时是否隐藏用户身份

### 5. Row Level Security (RLS)

当前所有表的 RLS 都未启用。如需启用，参考以下策略：

```sql
-- 启用 RLS
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的私有心情和所有公开心情
CREATE POLICY "Users can view own moods and public moods" 
  ON moods FOR SELECT 
  USING (auth.uid()::bigint = user_id OR is_public = true);

-- 用户只能插入自己的心情
CREATE POLICY "Users can insert own moods" 
  ON moods FOR INSERT 
  WITH CHECK (auth.uid()::bigint = user_id);

-- 用户只能更新自己的心情
CREATE POLICY "Users can update own moods" 
  ON moods FOR UPDATE 
  USING (auth.uid()::bigint = user_id);

-- 用户只能删除自己的心情
CREATE POLICY "Users can delete own moods" 
  ON moods FOR DELETE 
  USING (auth.uid()::bigint = user_id);
```

### 6. 索引优化

已创建的索引：

- **单列索引**: 用于常见的查询条件（如 `user_id`, `created_at`）
- **复合索引**: 用于组合查询（如 `(user_id, created_at)`）
- **部分索引**: 用于特定条件查询（如 `WHERE is_public = true`）
- **GIN 索引**: 用于 JSONB 字段查询

### 7. 触发器

自动更新时间戳触发器：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

应用于表：

- `users`
- `moods`
- `comments`

---

## 🚀 使用建议

### 1. 查询优化

- 使用索引字段作为查询条件
- 避免全表扫描
- 使用 `EXPLAIN ANALYZE` 分析查询性能

### 2. 数据完整性

- 使用事务处理复杂操作
- 保持冗余字段的同步更新
- 定期检查外键约束

### 3. 安全性

- 考虑启用 RLS 进行行级别访问控制
- 使用参数化查询防止 SQL 注入
- 敏感字段（如 `password_hash`）不要在日志中输出

### 4. 性能监控

- 定期检查慢查询日志
- 监控索引使用情况
- 定期 VACUUM 和 ANALYZE

---

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [数据库设置 SQL](./supabase-setup.sql)
- [Supabase 配置指南](./SUPABASE_SETUP.md)

---

**最后更新**: 2026-01-18  
**维护者**: MoodTrack Team
