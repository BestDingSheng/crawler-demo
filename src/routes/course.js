const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course');

// 获取课程列表
router.get('/courses', courseController.getCourseList);

// 获取课程详情
router.get('/courses/:pageId', courseController.getCourseDetail);

module.exports = router; 