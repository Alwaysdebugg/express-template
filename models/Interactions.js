import { supabaseAdmin } from '../config/supabase.js';

// 添加互动（点赞、支持等）
async function addInteraction(moodId, userId, interactionType) {
  try {
    // 验证互动类型
    const validTypes = [
      'empathy',
      'support',
      'helpful',
      'grateful',
      'encourage',
    ];
    if (!validTypes.includes(interactionType)) {
      throw new Error(`无效的互动类型: ${interactionType}`);
    }

    // 插入互动记录（如果已存在会因唯一约束失败）
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
      // 如果是唯一约束错误，说明用户已经互动过了
      if (error.code === '23505') {
        throw new Error('您已经进行过此互动');
      }
      throw error;
    }

    // 更新 moods 表的 likes_count（如果是点赞类型）
    if (interactionType === 'empathy') {
      const { error } = await supabaseAdmin.rpc('increment_likes', {
        target_mood_id: moodId,
      });

      if (error) throw error;
    }

    return data;
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
      empathy: 0,
      support: 0,
      helpful: 0,
      grateful: 0,
      encourage: 0,
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

export default {
  addInteraction,
  removeInteraction,
  getMoodInteractions,
  hasUserInteracted,
};
