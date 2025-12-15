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
};
