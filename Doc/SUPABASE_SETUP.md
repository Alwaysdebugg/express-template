# Supabase 配置指南

## 📋 配置步骤

### 1. 获取 Supabase 凭证

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目（如果没有，请先创建一个新项目）
3. 进入 **Project Settings** → **API**
4. 复制以下信息：
   - **Project URL** → 填入 `SUPABASE_URL`
   - **anon public** key → 填入 `SUPABASE_ANON_KEY`
   - **service_role** key → 填入 `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 保密，不要泄露）

### 2. 配置环境变量

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的 Supabase 凭证：
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 3. 创建数据库表

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 打开 `Doc/supabase-setup.sql` 文件
3. 复制 SQL 脚本内容
4. 在 SQL Editor 中粘贴并执行

这将创建：
- `users` 表（包含 id, name, email, created_at, updated_at 字段）
- 自动更新 `updated_at` 的触发器
- 示例数据（可选）
- 性能优化索引

### 4. 启动服务器

```bash
npm run dev
```

服务器将在 `http://127.0.0.1:3000` 启动。

## 🧪 测试 API

### 获取所有用户
```bash
curl http://127.0.0.1:3000/api/users
```

### 获取单个用户
```bash
curl http://127.0.0.1:3000/api/users/1
```

### 创建用户
```bash
curl -X POST http://127.0.0.1:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com"}'
```

### 更新用户
```bash
curl -X PUT http://127.0.0.1:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"更新后的名字","email":"updated@example.com"}'
```

### 删除用户
```bash
curl -X DELETE http://127.0.0.1:3000/api/users/1
```

## 📁 项目结构

```
express/
├── config/
│   └── supabase.js          # Supabase 客户端配置
├── models/
│   └── User.js              # 用户数据模型（使用 Supabase）
├── controllers/
│   └── userController.js    # 用户控制器（CRUD 操作）
├── routers/
│   └── users.js             # 用户路由
├── Doc/
│   ├── supabase-setup.sql   # 数据库初始化 SQL
│   └── SUPABASE_SETUP.md    # 本配置指南
├── .env                     # 环境变量（需要自己创建）
├── .env.example             # 环境变量模板
└── .gitignore               # Git 忽略文件（已包含 .env）
```

## ⚠️ 注意事项

1. **不要提交 `.env` 文件**：`.env` 文件已添加到 `.gitignore`，确保不会提交到 Git
2. **保护 Service Role Key**：`SUPABASE_SERVICE_ROLE_KEY` 拥有完整权限，仅在服务端使用
3. **Row Level Security (RLS)**：如果启用了 RLS，可能需要调整策略或使用 service_role key
4. **错误处理**：代码已包含错误处理，会返回友好的错误信息

## 🔧 故障排除

### 错误：缺少 Supabase 环境变量配置
- 检查 `.env` 文件是否存在
- 确认所有三个环境变量都已正确填写

### 错误：relation "users" does not exist
- 确认已在 Supabase SQL Editor 中执行了 `supabase-setup.sql` 脚本

### 错误：duplicate key value violates unique constraint
- 邮箱已存在，尝试使用不同的邮箱地址

## 📚 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端文档](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

