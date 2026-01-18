# 互动功能实现文档

## 功能概述

实现了每位用户对一个post只能进行一次互动（like或unlike），支持以下操作：

1. **首次互动**：用户点击like或unlike，添加该互动
2. **取消互动**：用户再次点击已选中的互动类型，取消该互动
3. **切换互动**：用户点击另一种互动类型，自动切换（删除旧的，添加新的）

## 技术实现

### 后端修改

#### 1. `models/Interactions.js`

**新增函数：**

- `getUserInteraction(moodId, userId)` - 获取用户对指定心情的互动状态
- `getUserInteractions(moodIds, userId)` - 批量获取用户对多个心情的互动状态

**修改函数：**

- `addInteraction(moodId, userId, interactionType)` - 实现智能切换逻辑
  - 返回值：`{ action: 'added' | 'removed', interactionType, data? }`

**逻辑流程：**

```javascript
1. 检查用户当前的互动状态
2. 如果点击的是已有的互动类型 → 删除该互动
3. 如果点击的是不同的互动类型 → 删除旧的，添加新的
4. 如果用户没有互动过 → 添加新互动
```

#### 2. `models/Moods.js`

**修改函数：**

- `getPublicMoods(userId = null)` - 添加可选的userId参数
  - 如果提供userId，会批量查询该用户对所有心情的互动状态
  - 返回数据中包含`userInteraction`字段

**返回数据格式：**

```javascript
{
  id: string,
  user: {...},
  content: string,
  mood: number,
  mood_type: string,
  interactions: {
    like: number,    // 总点赞数
    unlike: number   // 总反对数
  },
  userInteraction: 'like' | 'unlike' | null,  // 当前用户的互动状态
  replies: [...],
  tags: [...]
}
```

#### 3. `controllers/communityController.js`

**修改：**

- `getCommunityMoods` - 从req.user获取userId（可选），传递给getPublicMoods
- `addInteraction` - 返回互动统计和用户当前状态

**返回格式：**

```javascript
{
  success: true,
  data: {
    like: number,
    unlike: number,
    userInteraction: 'like' | 'unlike' | null,
    action: 'added' | 'removed'
  },
  message: '互动成功' | '已取消互动'
}
```

#### 4. `routers/community.js`

**修改：**

- GET `/api/community/moods` - 使用`optionalAuth`中间件
  - 有token时返回用户互动状态
  - 没有token时也能正常访问（userInteraction为null）

### 前端修改

#### 1. `src/types/social.ts`

**修改 CommunityPost 接口：**

```typescript
export interface CommunityPost {
  // ... 其他字段
  userInteraction?: 'like' | 'unlike' | null; // 新增字段
}
```

#### 2. `src/pages/CommunityPage.tsx`

**修改 handleInteraction 函数：**

**乐观更新逻辑：**

1. 找到当前post和用户的互动状态
2. 判断操作类型（新增/取消/切换）
3. 乐观更新UI
4. 调用后端API
5. 使用后端返回的准确数据更新
6. 失败时回滚到原始状态

**UI高亮显示：**

- 已实现Reddit风格的投票UI
- 使用`isLiked`和`isDisliked`判断高亮状态
- 点赞时显示橙色，反对时显示蓝色

## API接口

### 1. 获取社区心情列表

**请求：**

```
GET /api/community/moods
Headers:
  Authorization: Bearer <token>  (可选)
```

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "interactions": {
        "like": 10,
        "unlike": 2
      },
      "userInteraction": "like",  // 当前用户的互动状态
      // ... 其他字段
    }
  ]
}
```

### 2. 添加/切换互动

**请求：**

```
POST /api/community/moods/:id/interaction
Headers:
  Authorization: Bearer <token>  (必需)
Body:
  {
    "interactionType": "like" | "unlike"
  }
```

**响应：**

```json
{
  "success": true,
  "data": {
    "like": 11,
    "unlike": 2,
    "userInteraction": "like",
    "action": "added"
  },
  "message": "互动成功"
}
```

## 测试场景

### 场景1：首次互动

1. 用户点击"点赞"按钮
2. 按钮高亮显示为橙色
3. 点赞数+1
4. userInteraction = 'like'

### 场景2：取消互动

1. 用户已点赞（按钮为橙色）
2. 再次点击"点赞"按钮
3. 按钮恢复灰色
4. 点赞数-1
5. userInteraction = null

### 场景3：切换互动

1. 用户已点赞（点赞按钮为橙色，like=10, unlike=2）
2. 点击"反对"按钮
3. 点赞按钮恢复灰色，反对按钮变为蓝色
4. 数据更新为：like=9, unlike=3
5. userInteraction = 'unlike'

### 场景4：未登录用户

1. 用户未登录
2. 可以看到所有帖子和互动数量
3. userInteraction = null（不显示高亮）
4. 点击互动按钮时提示"请先登录"

## 数据库约束

确保数据库中有以下唯一约束：

```sql
-- interactions 表的唯一约束
ALTER TABLE interactions 
ADD CONSTRAINT unique_user_mood_interaction 
UNIQUE (mood_id, user_id);
```

这确保了一个用户对一个心情只能有一条互动记录。

## 注意事项

1. **乐观更新**：前端先更新UI，提供更好的用户体验
2. **错误回滚**：如果后端失败，会回滚到原始状态
3. **准确性**：使用后端返回的准确数据进行最终更新
4. **性能优化**：批量查询用户互动状态，减少数据库查询次数
5. **可选认证**：获取列表接口支持未登录访问，但会缺少用户互动状态

## 未来优化

1. **实时更新**：使用WebSocket实时同步其他用户的互动
2. **动画效果**：添加更流畅的过渡动画
3. **缓存优化**：缓存用户互动状态，减少数据库查询
4. **统计分析**：添加互动数据的统计和分析功能
