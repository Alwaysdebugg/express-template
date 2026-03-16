# MoodTrack Backend - High-Level Data Flow 数据流示意图

## 1. 系统总览

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          客户端 (React Frontend)                         │
└──────────────┬───────────────────────────────────────┬───────────────────┘
               │ HTTP Request                          │ Google OAuth
               │ Authorization: Bearer <JWT>           │
               ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Express.js 应用 (index.js)                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                      中间件管道 Middleware Pipeline              │     │
│  │                                                                 │     │
│  │   CORS ──▶ JSON解析 ──▶ URL解析 ──▶ 日志记录 ──▶ Passport      │     │
│  └─────────────────────────────┬───────────────────────────────────┘     │
│                                │                                         │
│                                ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                         路由分发 Route Dispatch                  │     │
│  │                                                                 │     │
│  │  /api/auth/*  ──▶ authRouter        (认证: 注册/登录/OAuth)     │     │
│  │  /api/users/* ──▶ usersRouter       (用户 CRUD)                │     │
│  │  /api/moods/* ──▶ moodRouter        (心情记录 CRUD)            │     │
│  │  /api/community/* ──▶ communityRouter (社区互动)                │     │
│  │  /oauth2/*    ──▶ oauthRouter       (Google OAuth 入口)        │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │  404 处理     │    │ 全局错误处理  │    │ 静态文件服务 (public/)   │   │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                                   │
│  users │ moods │ interactions │ comments │ online_users │ topics         │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. 请求处理分层架构

```
  HTTP Request
       │
       ▼
┌─────────────┐
│   Router    │  路由层: 匹配 URL, 挂载中间件
│  routers/*  │  决定哪些路由需要 authenticateToken / optionalAuth
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │  认证层: JWT 验证, 附加 req.user
│authMiddleware│  authenticateToken → 必须登录
│             │  optionalAuth      → 可选登录 (社区公开浏览)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │  业务逻辑层: 参数校验, 调用 Model, 组装响应
│controllers/*│  统一返回 { success, data, message, error }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Model     │  数据访问层: Supabase 查询, 数据转换
│  models/*   │  使用 supabaseAdmin (绕过 RLS)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │  数据库层: PostgreSQL
│  config/    │  supabase (anon) + supabaseAdmin (service_role)
└─────────────┘
```

## 3. 认证数据流

### 3a. 邮箱注册/登录

```
客户端                     authController                User Model           Supabase DB
  │                              │                           │                     │
  │  POST /api/auth/register     │                           │                     │
  │  { name, email, password }   │                           │                     │
  │─────────────────────────────▶│                           │                     │
  │                              │  bcrypt.hash(password)    │                     │
  │                              │──────────┐                │                     │
  │                              │◀─────────┘                │                     │
  │                              │  createUser(name,email,   │                     │
  │                              │    password_hash)         │                     │
  │                              │──────────────────────────▶│                     │
  │                              │                           │  INSERT INTO users  │
  │                              │                           │────────────────────▶│
  │                              │                           │◀────────────────────│
  │                              │◀──────────────────────────│                     │
  │                              │  jwtUtils.generateToken() │                     │
  │                              │──────────┐                │                     │
  │                              │◀─────────┘                │                     │
  │  { success, token, user }    │                           │                     │
  │◀─────────────────────────────│                           │                     │


  │  POST /api/auth/login        │                           │                     │
  │  { email, password }         │                           │                     │
  │─────────────────────────────▶│                           │                     │
  │                              │  findByEmail(email)       │                     │
  │                              │──────────────────────────▶│                     │
  │                              │                           │  SELECT FROM users  │
  │                              │                           │────────────────────▶│
  │                              │◀──────────────────────────│◀────────────────────│
  │                              │  bcrypt.compare()         │                     │
  │                              │  generateToken()          │                     │
  │  { success, token, user }    │                           │                     │
  │◀─────────────────────────────│                           │                     │
```

### 3b. Google OAuth

```
客户端                   oauthRouter        Google OAuth       authController       DB
  │                          │                   │                   │              │
  │ GET /oauth2/             │                   │                   │              │
  │   authorization/google   │                   │                   │              │
  │─────────────────────────▶│                   │                   │              │
  │                          │  passport.auth    │                   │              │
  │                          │  (google策略)     │                   │              │
  │◀─────────────────────────│──────────────────▶│                   │              │
  │  重定向到 Google 授权页   │                   │                   │              │
  │─────────────────────────────────────────────▶│                   │              │
  │  用户授权                 │                   │                   │              │
  │◀─────────────────────────────────────────────│                   │              │
  │                          │  callback + code  │                   │              │
  │  GET /api/auth/google/   │                   │                   │              │
  │    callback              │                   │                   │              │
  │─────────────────────────▶│──────────────────▶│                   │              │
  │                          │                   │  verify token     │              │
  │                          │                   │──────────────────▶│              │
  │                          │                   │                   │ find/create  │
  │                          │                   │                   │    user      │
  │                          │                   │                   │─────────────▶│
  │                          │                   │                   │◀─────────────│
  │                          │                   │  JWT token        │              │
  │                          │                   │◀──────────────────│              │
  │  重定向 FRONTEND_URL/     │                   │                   │              │
  │  login-callback?token=xx │                   │                   │              │
  │◀─────────────────────────│                   │                   │              │
```

### 3c. JWT 认证中间件

```
                     authenticateToken                        optionalAuth
                            │                                      │
      有 Token?             │                    有 Token?         │
     ┌──┴──┐                │                   ┌──┴──┐            │
     │     │                │                   │     │            │
    Yes    No               │                  Yes    No           │
     │     │                │                   │     │            │
     ▼     ▼                │                   ▼     ▼            │
  verify  401               │                verify  直接放行      │
     │  未授权              │                   │   (req.user      │
  ┌──┴──┐                   │                ┌──┴──┐  = undefined) │
  │     │                   │                │     │               │
 有效  无效                 │               有效  无效              │
  │     │                   │                │     │               │
  ▼     ▼                   │                ▼     ▼               │
req.user  403               │             req.user  直接放行       │
= decoded Token无效         │             = decoded (忽略错误)     │
  │                         │                │                     │
  ▼                         │                ▼                     │
next()                      │              next()                  │
```

## 4. 心情记录数据流

```
客户端                    moodRouter       authMiddleware     moodController      Moods Model        DB
  │                          │                  │                  │                  │              │
  │ POST /api/moods          │                  │                  │                  │              │
  │ { mood_type, note,       │                  │                  │                  │              │
  │   triggers, is_public,   │                  │                  │                  │              │
  │   is_anonymous }         │                  │                  │                  │              │
  │─────────────────────────▶│                  │                  │                  │              │
  │                          │  authenticateToken                  │                  │              │
  │                          │─────────────────▶│                  │                  │              │
  │                          │  req.user ✓      │                  │                  │              │
  │                          │◀─────────────────│                  │                  │              │
  │                          │                  │  createMood()    │                  │              │
  │                          │─────────────────────────────────────▶│                  │              │
  │                          │                  │                  │  createMood()    │              │
  │                          │                  │                  │─────────────────▶│              │
  │                          │                  │                  │                  │  验证mood_type│
  │                          │                  │                  │                  │  INSERT moods│
  │                          │                  │                  │                  │─────────────▶│
  │                          │                  │                  │                  │◀─────────────│
  │                          │                  │                  │◀─────────────────│              │
  │  { success, data: mood } │                  │                  │                  │              │
  │◀─────────────────────────│◀─────────────────────────────────────│                  │              │


  │ GET /api/moods            │                  │                  │                  │              │
  │─────────────────────────▶│  authenticateToken│                  │                  │              │
  │                          │─────────────────▶│  getMoods()      │                  │              │
  │                          │─────────────────────────────────────▶│  getMoods()      │              │
  │                          │                  │                  │─────────────────▶│              │
  │                          │                  │                  │                  │  SELECT      │
  │                          │                  │                  │                  │  WHERE       │
  │                          │                  │                  │                  │  user_id=?   │
  │                          │                  │                  │                  │─────────────▶│
  │  { success, data: [...] }│                  │                  │                  │              │
  │◀─────────────────────────│◀─────────────────────────────────────│◀─────────────────│◀─────────────│
```

## 5. 社区互动数据流

```
客户端                  communityRouter    中间件           communityController    Models           DB
  │                          │               │                   │                  │              │
  │                          │               │                   │                  │              │
  │ ─── 公开浏览（无需登录）──────────────────────────────────────────────────────────              │
  │                          │               │                   │                  │              │
  │ GET /community/moods     │               │                   │                  │              │
  │─────────────────────────▶│  optionalAuth │                   │                  │              │
  │                          │──────────────▶│                   │                  │              │
  │                          │  (有token则   │                   │                  │              │
  │                          │   附加user)   │                   │                  │              │
  │                          │──────────────────────────────────▶│                  │              │
  │                          │               │                   │ getPublicMoods() │              │
  │                          │               │                   │─────────────────▶│              │
  │                          │               │                   │                  │  SELECT moods│
  │                          │               │                   │                  │  WHERE       │
  │                          │               │                   │                  │  is_public   │
  │                          │               │                   │                  │  JOIN users  │
  │                          │               │                   │                  │─────────────▶│
  │                          │               │                   │                  │              │
  │                          │               │                   │                  │  处理匿名:    │
  │                          │               │                   │                  │  is_anonymous │
  │                          │               │                   │                  │  → 生成假名   │
  │                          │               │                   │                  │  → 移除PII    │
  │  { success, data: [...] }│               │                   │                  │              │
  │◀─────────────────────────│◀──────────────────────────────────│◀─────────────────│◀─────────────│
  │                          │               │                   │                  │              │
  │                          │               │                   │                  │              │
  │ ─── 互动操作（需要登录）──────────────────────────────────────────────────────────              │
  │                          │               │                   │                  │              │
  │ POST /community/moods/   │               │                   │                  │              │
  │   :id/interaction        │               │                   │                  │              │
  │ { interaction_type }     │ authenticate  │                   │                  │              │
  │─────────────────────────▶│──────────────▶│                   │                  │              │
  │                          │  req.user ✓   │                   │                  │              │
  │                          │──────────────────────────────────▶│  addInteraction()│              │
  │                          │               │                   │─────────────────▶│              │
  │                          │               │                   │                  │  UPSERT      │
  │                          │               │                   │                  │  interactions│
  │                          │               │                   │                  │  (unique:    │
  │                          │               │                   │                  │   user+mood+ │
  │                          │               │                   │                  │   type)      │
  │                          │               │                   │                  │─────────────▶│
  │  { success }             │               │                   │                  │              │
  │◀─────────────────────────│◀──────────────────────────────────│◀─────────────────│◀─────────────│
  │                          │               │                   │                  │              │
  │                          │               │                   │                  │              │
  │ POST /community/moods/   │               │                   │                  │              │
  │   :id/reply              │ authenticate  │                   │                  │              │
  │ { content, is_anonymous }│──────────────▶│                   │                  │              │
  │─────────────────────────▶│  req.user ✓   │                   │                  │              │
  │                          │──────────────────────────────────▶│                  │              │
  │                          │               │                   │ replyToCommunity │              │
  │                          │               │                   │   Mood()         │              │
  │                          │               │                   │─────────────────▶│              │
  │                          │               │                   │                  │  INSERT      │
  │                          │               │                   │                  │  comments    │
  │                          │               │                   │                  │  (支持       │
  │                          │               │                   │                  │   parent_id  │
  │                          │               │                   │                  │   嵌套回复)   │
  │                          │               │                   │                  │─────────────▶│
  │  { success, data }       │               │                   │                  │              │
  │◀─────────────────────────│◀──────────────────────────────────│◀─────────────────│◀─────────────│
```

## 6. 在线状态心跳机制

```
客户端                                  communityController         Community Model          DB
  │                                            │                         │                   │
  │  ┌─────────────────────────┐               │                         │                   │
  │  │ setInterval (每30秒)    │               │                         │                   │
  │  │ 发送心跳保持在线状态     │               │                         │                   │
  │  └────────────┬────────────┘               │                         │                   │
  │               │                            │                         │                   │
  │  POST /community/online-status/heartbeat   │                         │                   │
  │  { session_id, ip_address, user_agent }    │                         │                   │
  │───────────────────────────────────────────▶│                         │                   │
  │                                            │  updateOnlineStatus()   │                   │
  │                                            │────────────────────────▶│                   │
  │                                            │                         │  UPSERT           │
  │                                            │                         │  online_users     │
  │                                            │                         │  SET last_active_at│
  │                                            │                         │  = NOW()          │
  │                                            │                         │──────────────────▶│
  │  { success }                               │                         │                   │
  │◀───────────────────────────────────────────│◀────────────────────────│◀──────────────────│
  │                                            │                         │                   │
  │  ┌─────────────────────────┐               │                         │                   │
  │  │ 用户离开/登出           │               │                         │                   │
  │  └────────────┬────────────┘               │                         │                   │
  │               │                            │                         │                   │
  │  POST /community/online-status/remove      │                         │                   │
  │───────────────────────────────────────────▶│  removeOnlineStatus()   │                   │
  │                                            │────────────────────────▶│  DELETE FROM      │
  │                                            │                         │  online_users     │
  │                                            │                         │──────────────────▶│
  │  { success }                               │                         │                   │
  │◀───────────────────────────────────────────│◀────────────────────────│◀──────────────────│
```

## 7. 数据库表关系图

```
┌───────────────────┐
│      users        │
├───────────────────┤
│ id (PK)           │◀──────────────┬──────────────┬──────────────┐
│ name              │               │              │              │
│ email (UNIQUE)    │               │              │              │
│ password_hash     │               │              │              │
│ created_at        │               │              │              │
│ updated_at        │               │              │              │
└───────────────────┘               │              │              │
                                    │              │              │
                            user_id │       user_id│       user_id│
                                    │              │              │
                    ┌───────────────┴──┐    ┌──────┴───────┐  ┌──┴────────────────┐
                    │      moods       │    │ online_users │  │   (interactions   │
                    ├──────────────────┤    ├──────────────┤  │    & comments     │
                    │ id (PK)          │◀─┐│ id (PK)      │  │    也有 user_id)  │
                    │ user_id (FK)     │  ││ user_id (FK)  │  └───────────────────┘
                    │ mood_type (ENUM) │  ││ session_id    │
                    │ note             │  ││ ip_address    │
                    │ triggers (JSONB) │  ││ user_agent    │
                    │ is_public        │  ││ last_active_at│
                    │ is_anonymous     │  │└──────────────┘
                    │ likes_count ★    │  │
                    │ reply_count ★    │  │  mood_id
                    │ created_at       │  │
                    └──────────────────┘  │
                              │           │
                  ┌───────────┤           │
                  │           │           │
          mood_id │   mood_id │           │
                  │           │           │
          ┌───────▼────────┐  │  ┌────────▼─────────┐
          │  interactions  │  │  │    comments       │
          ├────────────────┤  │  ├────────────────── ┤
          │ id (PK)        │  │  │ id (PK)           │
          │ mood_id (FK)   │  │  │ mood_id (FK)      │
          │ user_id (FK)   │  │  │ user_id (FK)      │
          │ interaction_   │  │  │ parent_id (FK)  ──┤◀─┐ 自关联
          │   type (ENUM)  │  │  │ content           │  │ (嵌套回复)
          │ created_at     │  │  │ is_anonymous      │──┘
          └────────────────┘  │  │ created_at        │
                              │  └───────────────────┘
          UNIQUE(user_id,     │
           mood_id, type)     │
                              │
                      mood_id │
                              │
                    ┌─────────▼────────┐       ┌────────────────┐
                    │   mood_topics    │       │    topics       │
                    ├──────────────────┤       ├────────────────┤
                    │ mood_id (FK)     │       │ id (PK)        │
                    │ topic_id (FK)  ──│──────▶│ slug (UNIQUE)  │
                    │ (复合主键)        │       │ name           │
                    └──────────────────┘       │ description    │
                                               │ icon_url       │
      ★ 反范式化字段，需手动同步               │ post_count     │
                                               └────────────────┘

  ENUM mood_type: very_bad | bad | neutral | good | excellent
  ENUM interaction_type: empathy | support | helpful | grateful | encourage
```

## 8. 统一响应格式

```
所有 API 端点返回统一结构:

  成功:                              失败:
  ┌──────────────────────┐           ┌──────────────────────┐
  │ {                    │           │ {                    │
  │   "success": true,   │           │   "success": false,  │
  │   "data": { ... },   │           │   "error": "...",    │
  │   "message": "..."   │           │   "message": "..."   │
  │ }                    │           │ }                    │
  └──────────────────────┘           └──────────────────────┘

  HTTP 状态码:
  200  成功
  201  创建成功
  400  请求参数错误
  401  未授权 (缺少/过期 Token)
  403  禁止访问 (无效 Token)
  404  资源不存在
  500  服务器内部错误
```
