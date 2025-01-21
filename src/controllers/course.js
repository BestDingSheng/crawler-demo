const Course = require('../models/course');
const { Op } = require('sequelize');

// 课程类型枚举
const COURSE_TYPES = ['中创网', '福源论坛', '冒泡网', '自学成才网'];

// 获取课程列表
async function getCourseList(req, res) {
    try {
        const { type, page = 1, pageSize = 10 } = req.query;
        console.log('收到请求参数:', { type, page, pageSize });
        
        // 构建查询条件
        const where = {};
        if (type) {
            if (!COURSE_TYPES.includes(type)) {
                console.log('无效的课程类型:', type);
                return res.json({ code: 20002, message: '无效的课程类型' });
            }
            where.type = type;
        }

        const offset = (page - 1) * pageSize;
        console.log('查询参数:', { where, offset, limit: parseInt(pageSize) });
        
        // 查询数据
        const { count, rows } = await Course.findAndCountAll({
            where,
            offset,
            limit: parseInt(pageSize),
            order: [['publishTime', 'DESC']],
            attributes: [
                'pageId', 'type', 'title', 'desc', 
                'imgUrl', 'publishTime', 'link'
            ]
        });

        console.log('查询结果:', { count, rowCount: rows.length });

        return res.json({
            code: 0,
            result: {
                list: rows,
                total: count,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });

    } catch (error) {
        console.error('获取课程列表失败:', error);
        return res.json({ code: 20003, message: '获取课程列表失败' });
    }
}

// 获取课程详情
async function getCourseDetail(req, res) {
    try {
        const { pageId } = req.params;

        if (!pageId) {
            return res.json({ code: 20004, message: 'pageId不能为空' });
        }

        const course = await Course.findOne({
            where: { pageId },
            attributes: [
                'pageId', 'type', 'title', 'desc', 
                'imgUrl', 'publishTime', 'link',
                'detailInfo', 'downloadLink'
            ]
        });

        if (!course) {
            return res.json({ code: 20005, message: '课程不存在' });
        }

        return res.json({
            code: 0,
            result: course
        });

    } catch (error) {
        console.error('获取课程详情失败:', error);
        return res.json({ code: 20006, message: '获取课程详情失败' });
    }
}

module.exports = {
    getCourseList,
    getCourseDetail,
    COURSE_TYPES
}; 