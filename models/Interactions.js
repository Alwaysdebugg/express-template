import { supabaseAdmin } from '../config/supabase.js';

// 添加或切换互动（点赞、支持等）
async function addInteraction(moodId, userId, interactionType) {
  try {
    // 验证互动类型
    const validTypes = [
      'empathy',
      'support',
      'helpful',
      'grateful',
      'encourage',
      'like', // 当前只有点赞和不喜欢两种互动类型
      'unlike',
    ];
    if (!validTypes.includes(interactionType)) {
      throw new Error(`无效的互动类型: ${interactionType}`);
    }

    // 检查用户当前的互动状态
    const { data: existingInteraction, error: checkError } = await supabaseAdmin
      .from('interactions')
      .select('interaction_type')
      .eq('mood_id', moodId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    // 如果用户已经进行过相同类型的互动，则取消该互动
    if (existingInteraction && existingInteraction.interaction_type === interactionType) {
      await removeInteraction(moodId, userId, interactionType);
      return { action: 'removed', interactionType };
    }

    // 如果用户已经进行过不同类型的互动，先删除旧的
    if (existingInteraction && existingInteraction.interaction_type !== interactionType) {
      await removeInteraction(moodId, userId, existingInteraction.interaction_type);
    }

    // 添加新的互动
    const { data, error } = await supabaseAdmin
      .from('interactions')
      .insert({
        mood_id: moodId,
        user_id: userId,
        interaction_type: interactionType,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 更新 moods 表的 likes_count（如果是点赞类型）
    if (interactionType === 'like') {
      const { error } = await supabaseAdmin.rpc('increment_likes', {
        target_mood_id: moodId,
      });

      if (error) throw error;
    }

    return { action: 'added', interactionType, data };
  } catch (error) {
    console.error('添加互动失败:', error);
    throw error;
  }
}

// 移除互动
async function removeInteraction(moodId, userId, interactionType) {
  try {
    const { error } = await supabaseAdmin
      .from('interactions')
      .delete()
      .eq('mood_id', moodId)
      .eq('user_id', userId)
      .eq('interaction_type', interactionType);

    if (error) throw error;

    // 更新 moods 表的 likes_count（如果是点赞类型）
    if (interactionType === 'empathy') {
      await supabaseAdmin
        .from('moods')
        .update({
          likes_count: supabaseAdmin.raw('GREATEST(likes_count - 1, 0)'),
        })
        .eq('id', moodId);
    }

    return true;
  } catch (error) {
    console.error('移除互动失败:', error);
    throw error;
  }
}

// 获取帖子的所有互动统计
async function getMoodInteractions(moodId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('interactions')
      .select('interaction_type')
      .eq('mood_id', moodId);

    if (error) throw error;

    // 统计每种互动类型的数量
    const stats = {
      like: 0,
      unlike: 0,
    };

    data.forEach(interaction => {
      if (stats.hasOwnProperty(interaction.interaction_type)) {
        stats[interaction.interaction_type]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('获取互动统计失败:', error);
    throw error;
  }
}

// 检查用户是否已对某个帖子进行过特定互动
async function hasUserInteracted(moodId, userId, interactionType) {
  try {
    const { data, error } = await supabaseAdmin
      .from('interactions')
      .select('id')
      .eq('mood_id', moodId)
      .eq('user_id', userId)
      .eq('interaction_type', interactionType)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('检查互动状态失败:', error);
    throw error;
  }
}

// 获取用户对指定心情的互动状态
async function getUserInteraction(moodId, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('interactions')
      .select('interaction_type')
      .eq('mood_id', moodId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? data.interaction_type : null;
  } catch (error) {
    console.error('获取用户互动状态失败:', error);
    throw error;
  }
}

// 批量获取用户对多个心情的互动状态
async function getUserInteractions(moodIds, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('interactions')
      .select('mood_id, interaction_type')
      .in('mood_id', moodIds)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // 转换为对象形式 { moodId: interactionType }
    const interactions = {};
    if (data) {
      data.forEach(item => {
        interactions[item.mood_id] = item.interaction_type;
      });
    }

    return interactions;
  } catch (error) {
    console.error('批量获取用户互动状态失败:', error);
    throw error;
  }
}

export default {
  addInteraction,
  removeInteraction,
  getMoodInteractions,
  hasUserInteracted,
  getUserInteraction,
  getUserInteractions,
};
