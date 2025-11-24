import UserModel from '../models/User.js';
import { sanitizeUsers, sanitizeUser } from '../utils/userUtils.js';

// 获取所有用户
export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        const sanitizedUsers = sanitizeUsers(users);
        res.json({
            success: true,
            data: sanitizedUsers,
            count: sanitizedUsers.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取所有用户失败',
            message: error.message,
        })
    }
}

// 根据ID获取用户
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.getUserById(id);

        if(!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
            });
        }

        res.json({
            success: true,
            data: sanitizeUser(user),
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取用户失败',
            message: error.message
        });
    }
}

// 创建用户
export const createUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        // 验证必填字段
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: '缺少必填字段',
                message: 'name 和 email 字段是必需的',
            });
        }

        const user = await UserModel.createUser({ name, email });
        
        res.status(201).json({
            success: true,
            data: sanitizeUser(user),
            message: '用户创建成功',
        });
    } catch (error) {
        // 处理唯一约束错误（邮箱重复）
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: '邮箱已存在',
                message: '该邮箱已被注册',
            });
        }

        res.status(500).json({
            success: false,
            error: '创建用户失败',
            message: error.message,
        });
    }
}

// 更新用户
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        // 构建更新数据（只包含提供的字段）
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;

        // 如果没有提供任何更新字段
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: '缺少更新字段',
                message: '请提供至少一个要更新的字段（name 或 email）',
            });
        }

        const user = await UserModel.updateUser(id, updateData);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
            });
        }

        res.json({
            success: true,
            data: sanitizeUser(user),
            message: '用户更新成功',
        });
    } catch (error) {
        // 处理唯一约束错误（邮箱重复）
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: '邮箱已存在',
                message: '该邮箱已被其他用户使用',
            });
        }

        res.status(500).json({
            success: false,
            error: '更新用户失败',
            message: error.message,
        });
    }
}

// 删除用户
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.deleteUser(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
            });
        }

        res.json({
            success: true,
            data: sanitizeUser(user),
            message: '用户删除成功',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '删除用户失败',
            message: error.message,
        });
    }
}
