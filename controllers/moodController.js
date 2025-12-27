// controllers/moodController.js
import moodModel from '../models/Moods.js';

// 获取心情记录列表
export const getMoods = async (req, res) => {
  try {
    const { user_id } = req;
    const moods = await moodModel.getMoods(user_id);
    res.status(200).json({
      success: true,
      data: moods,
      message: '获取心情记录列表成功',
    });
  } catch (error) {
    res.status(500).json({ error: '获取心情记录列表失败' });
  }
};

// 创建心情记录
export const createMood = async (req, res) => {
  try {
    const moodData = {
      user_id: req.user?.id,
      mood_type: req.body.mood_type,
      note: req.body.note,
      triggers: req.body.triggers,
      is_public: req.body.is_public,
      is_anonymous: req.body.is_anonymous,
      created_at: req.body.created_at,
    };

    const mood = await moodModel.createMood(moodData);
    const message = moodData.is_public
      ? '心情记录创建成功，已发布到社区'
      : '心情记录创建成功';

    res.status(200).json({
      success: true,
      data: mood,
      message: message,
      isCommunityPost: moodData.is_public || false,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    console.error('创建心情记录失败:', error);
    throw new Error(error.message);
  }
};

// 获取心情记录详情
export const getMoodById = async (req, res) => {
  try {
    const mood = await moodModel.getMoodById(req.params.id);
    res.status(200).json({
      success: true,
      data: mood,
      message: '获取心情记录详情成功',
    });
  } catch (error) {
    res.status(500).json({ error: '获取心情记录详情失败' });
  }
};

// 删除心情记录
export const deleteMoodById = async (req, res) => {
  try {
    await moodModel.deleteMoodById(req.params.id);
    res.status(200).json({
      success: true,
      message: '心情记录删除成功',
    });
  } catch (error) {
    res.status(500).json({ error: '删除心情记录失败' });
  }
};

export default {
  getMoods,
  createMood,
  getMoodById,
  deleteMoodById,
};
