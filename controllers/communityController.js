// controllers/communityController.js
import communityModel from '../models/Community.js';
import moodModel from '../models/Moods.js';

// 获取当前在线用户
export const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await communityModel.getOnlineUsers();
    res.status(200).json({
      success: true,
      data: onlineUsers,
      message: '获取当前在线用户成功',
    });
  } catch (error) {
    res.status(500).json({ error: '获取当前在线用户失败' });
  }
};

// 更新在线状态（心跳）
export const updateOnlineStatus = async (req, res) => {
  try {
    await communityModel.updateOnlineStatus(req.body.sessionId);
    res.status(200).json({
      success: true,
      data: onlineUsers,
      message: '更新在线状态成功',
    });
  } catch (error) {
    res.status(500).json({ error: '更新在线状态失败' });
  }
};

// 移除在线状态（登出）
export const removeOnlineStatus = async (req, res) => {
  try {
    const onlineUsers = await communityModel.removeOnlineStatus(
      req.body.sessionId
    );
    res.status(200).json({
      success: true,
      data: onlineUsers,
      message: '移除在线状态成功',
    });
  } catch (error) {
    res.status(500).json({ error: '移除在线状态失败' });
  }
};

// 获取社区心情列表
export const getCommunityMoods = async (req, res) => {
  try {
    const communityMoods = await moodModel.getPublicMoods();
    res.status(200).json({
      success: true,
      data: communityMoods,
      message: '获取社区心情列表成功',
    });
  } catch (error) {
    res.status(500).json({ error: '获取社区心情列表失败' });
  }
};

// 获取社区心情详情
export const getCommunityMoodById = async (req, res) => {
  try {
    const communityMood = await communityModel.getCommunityMoodById(
      req.params.id
    );
    res.status(200).json({
      success: true,
      data: communityMood,
      message: '获取社区心情详情成功',
    });
  } catch (error) {
    res.status(500).json({ error: '获取社区心情详情失败' });
  }
};

// 点赞社区心情
export const likeCommunityMood = async (req, res) => {
  try {
    const communityMood = await communityModel.likeCommunityMood(req.params.id);
    res.status(200).json({
      success: true,
      data: communityMood,
      message: '点赞社区心情成功',
    });
  } catch (error) {
    res.status(500).json({ error: '点赞社区心情失败' });
  }
};

// 取消点赞社区心情
export const unlikeCommunityMood = async (req, res) => {
  try {
    const communityMood = await communityModel.unlikeCommunityMood(
      req.params.id
    );
    res.status(200).json({
      success: true,
      data: communityMood,
      message: '取消点赞社区心情成功',
    });
  } catch (error) {
    res.status(500).json({ error: '取消点赞社区心情失败' });
  }
};

// 回复社区心情
export const replyToCommunityMood = async (req, res) => {
  try {
    const communityMood = await communityModel.replyToCommunityMood(
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: communityMood,
      message: '回复社区心情成功',
    });
  } catch (error) {
    res.status(500).json({ error: '回复社区心情失败' });
  }
};

export default {
  getOnlineUsers,
  updateOnlineStatus,
  removeOnlineStatus,
  getCommunityMoods,
  getCommunityMoodById,
  likeCommunityMood,
  unlikeCommunityMood,
  replyToCommunityMood,
};
