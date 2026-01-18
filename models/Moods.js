// models/Moods.js
import { supabaseAdmin } from '../config/supabase.js';

// 心情类型映射（用于验证和转换）
const MOOD_TYPES = ['very_bad', 'bad', 'neutral', 'good', 'excellent'];
const MOOD_TYPE_TO_NUMBER = {
  very_bad: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
};

// 生成匿名用户信息
function generateAnonymousUser(userId) {
  const nicknames = [
    '温暖的向日葵',
    '勇敢的小树',
    '坚强的云朵',
    '平静的湖水',
    '乐观的星星',
    '智慧的月亮',
    '温柔的微风',
    '坚韧的竹子',
    '纯真的雪花',
    '希望的晨光',
    '安静的山谷',
    '活力的彩虹',
    '宁静的森林',
    '美好的花朵',
    '自由的鸟儿',
  ];

  const avatarColors = [
    'bg-gradient-to-br from-pink-400 to-purple-400',
    'bg-gradient-to-br from-blue-400 to-teal-400',
    'bg-gradient-to-br from-green-400 to-emerald-400',
    'bg-gradient-to-br from-yellow-400 to-orange-400',
    'bg-gradient-to-br from-purple-400 to-indigo-400',
    'bg-gradient-to-br from-red-400 to-pink-400',
  ];

  // 使用 userId 作为种子，确保同一用户总是生成相同的匿名信息
  // 简单的哈希函数，将 userId 转换为 0-1 之间的值
  const hashUserId = id => {
    if (!id) return Math.random();
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  };

  const seed = hashUserId(userId);
  const nicknameIndex = Math.floor(seed * nicknames.length);
  const avatarIndex = Math.floor(seed * avatarColors.length);

  return {
    id: userId ? String(userId) : `anonymous_${Date.now()}`,
    name: nicknames[nicknameIndex],
    email: '',
    avatar: avatarColors[avatarIndex],
    isOnline: false,
    lastActive: null,
  };
}

// 处理敏感内容
function processContent(content) {
  if (!content) return '';
  let processed = content;

  // 移除可能的个人信息
  processed = processed.replace(/我叫\S+|我是\S+/g, '我');
  processed = processed.replace(/\d{11}|\d{3}-\d{4}-\d{4}/g, '[联系方式]');
  processed = processed.replace(/\S+公司|\S+学校/g, '[工作/学习场所]');

  // 软化负面表达
  processed = processed.replace(/想死|不想活/g, '很难过');
  processed = processed.replace(/恨|讨厌/g, '不喜欢');

  return processed;
}

// 获取心情记录列表（可选：按用户ID筛选）
async function getMoods(user_id = null) {
  try {
    let query = supabaseAdmin
      .from('moods')
      .select('*')
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取心情记录列表失败', error);
    throw error;
  }
}

// 创建心情记录
async function createMood(moodData) {
  try {
    // 验证必需字段
    if (!moodData.user_id || moodData.mood_type === undefined) {
      throw new Error('缺少必需字段: user_id 和 mood_type');
    }

    if (!moodData.mood_type || !MOOD_TYPES.includes(moodData.mood_type)) {
      throw new Error(
        `无效的 mood_type。必须是以下之一: ${MOOD_TYPES.join(', ')}`
      );
    }

    // 构建插入数据
    const insertData = {
      user_id: moodData.user_id,
      mood_type: moodData.mood_type,
      note: moodData.note || '',
      triggers: moodData.triggers || [],
      is_public: moodData.is_public !== undefined ? moodData.is_public : false,
      is_anonymous:
        moodData.is_anonymous !== undefined ? moodData.is_anonymous : false,
      likes_count: 0,
      reply_count: 0,
    };

    // 如果前端提供了 created_at，使用它（否则使用数据库默认值）
    if (moodData.created_at) {
      insertData.created_at = moodData.created_at;
    }

    const { data, error } = await supabaseAdmin
      .from('moods')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('创建心情记录失败:', error);
    throw error;
  }
}

// 获取社区心情列表 (is_public:true)
async function getPublicMoods(userId = null) {
  try {
    // 查询公开的心情记录
    const { data: moods, error: moodsError } = await supabaseAdmin
      .from('moods')
      .select(
        `
      *,
      users (
        id,
        name,
        email
      )
    `
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (moodsError) throw moodsError;
    if (!moods || moods.length === 0) return [];

    // 获取所有心情的 ID
    const moodIds = moods.map(m => m.id);

    // 批量查询所有互动数据
    const { data: allInteractions, error: interactionsError } =
      await supabaseAdmin
        .from('interactions')
        .select('mood_id, interaction_type')
        .in('mood_id', moodIds);

    if (interactionsError) {
      console.warn('获取互动数据失败:', interactionsError);
    }

    // 如果提供了userId，查询该用户的互动状态
    let userInteractions = {};
    if (userId) {
      const { data: userInteractionData, error: userInteractionsError } =
        await supabaseAdmin
          .from('interactions')
          .select('mood_id, interaction_type')
          .in('mood_id', moodIds)
          .eq('user_id', userId);

      if (userInteractionsError) {
        console.warn('获取用户互动数据失败:', userInteractionsError);
      } else if (userInteractionData) {
        userInteractionData.forEach(item => {
          userInteractions[item.mood_id] = item.interaction_type;
        });
      }
    }

    // 批量查询所有评论数据
    const { data: allComments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select(
        `
      id,
      mood_id,
      user_id,
      content,
      is_anonymous,
      created_at,
      users (
        id,
        name,
        email
      )
    `
      )
      .in('mood_id', moodIds)
      .is('parent_id', null) // 只获取一级评论
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.warn('获取评论数据失败:', commentsError);
    }

    // 按 mood_id 组织互动数据
    const interactionsByMood = {};
    if (allInteractions) {
      allInteractions.forEach(interaction => {
        if (!interactionsByMood[interaction.mood_id]) {
          interactionsByMood[interaction.mood_id] = {
            like: 0,
            unlike: 0,
          };
        }
        if (
          interactionsByMood[interaction.mood_id].hasOwnProperty(
            interaction.interaction_type
          )
        ) {
          interactionsByMood[interaction.mood_id][
            interaction.interaction_type
          ]++;
        }
      });
    }

    // 按 mood_id 组织评论数据
    const commentsByMood = {};
    if (allComments) {
      allComments.forEach(comment => {
        if (!commentsByMood[comment.mood_id]) {
          commentsByMood[comment.mood_id] = [];
        }
        commentsByMood[comment.mood_id].push(comment);
      });
    }

    // 转换数据格式
    const processedData = moods.map(mood => {
      const moodId = mood.id;
      const isAnonymous = mood.is_anonymous;

      // 处理用户信息
      let user;
      if (isAnonymous) {
        user = generateAnonymousUser(mood.user_id);
      } else {
        user = {
          id: String(mood.users?.id || mood.user_id),
          name: mood.users?.name || '匿名用户',
          email: mood.users?.email || '',
          avatar: generateAnonymousUser(mood.user_id).avatar, // 使用相同的逻辑生成头像
          isOnline: false,
          lastActive: null,
        };
      }

      // 处理评论
      const replies = (commentsByMood[moodId] || []).map(comment => {
        const commentIsAnonymous = comment.is_anonymous;
        let commentUser;
        if (commentIsAnonymous) {
          commentUser = generateAnonymousUser(comment.user_id);
        } else {
          commentUser = {
            id: String(comment.users?.id || comment.user_id),
            name: comment.users?.name || '匿名用户',
            email: comment.users?.email || '',
            avatar: generateAnonymousUser(comment.user_id).avatar,
            isOnline: false,
            lastActive: null,
          };
        }

        return {
          id: String(comment.id),
          user: commentUser,
          content: comment.content,
          timestamp: comment.created_at, // 前端期望 timestamp 字段
          isAIGenerated: false,
        };
      });

      // 转换心情类型为数字
      const moodNumber = MOOD_TYPE_TO_NUMBER[mood.mood_type] || 3;

      // 处理内容
      const note = mood.note || '';
      const processedContent = processContent(note);

      return {
        id: String(mood.id),
        user: user,
        content: note, // 原始内容
        note: note,
        processedContent: processedContent,
        mood: moodNumber,
        mood_type: mood.mood_type,
        created_at: mood.created_at,
        updated_at: mood.updated_at,
        interactions: interactionsByMood[moodId] || {
          like: 0,
          unlike: 0,
        },
        userInteraction: userInteractions[moodId] || null, // 当前用户的互动状态
        replies: replies,
        tags: Array.isArray(mood.triggers) ? mood.triggers : [],
      };
    });

    return processedData;
  } catch (error) {
    console.error('获取社区心情列表失败:', error);
    throw error;
  }
}

// 根据ID获取心情记录详情
async function getMoodById(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('moods')
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
    console.error('获取心情记录详情失败:', error);
    throw error;
  }
}

// 删除心情记录
async function deleteMood(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('moods')
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
    console.error('删除心情记录失败:', error);
    throw error;
  }
}

// 更新心情记录
async function updateMood(id, moodData) {
  try {
    // 只允许更新特定字段
    const updateFields = {};
    if (moodData.mood !== undefined) updateFields.mood = moodData.mood;
    if (moodData.note !== undefined) updateFields.note = moodData.note;
    if (moodData.is_public !== undefined)
      updateFields.is_public = moodData.is_public;

    const { data, error } = await supabaseAdmin
      .from('moods')
      .update(updateFields)
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
    console.error('更新心情记录失败:', error);
    throw error;
  }
}

export default {
  getMoods,
  createMood,
  getMoodById,
  deleteMood,
  updateMood,
  getPublicMoods,
};
