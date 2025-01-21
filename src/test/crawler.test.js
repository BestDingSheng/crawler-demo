const CrawlerService = require('../services/crawler');
const storage = require('../utils/storage');
const initDatabase = require('../models/init');

async function test() {
    try {
        // 初始化数据库
        await initDatabase();
        
        const crawler = new CrawlerService();
        
        // 初始化存储
        await storage.init();
        
        // 初始化爬虫
        await crawler.init();
        
        // 如果没有登录，则执行登录
        if (!crawler.isLoggedIn) {
            console.log('需要登录，开始登录...');
            await crawler.login('deson', '11223344');
        }
        
        // 爬取课程列表（包含详情和下载链接）
        console.log('开始爬取课程列表...');
        const courses = await crawler.crawlCourseList();
        
        // 保存课程数据
        console.log('\n开始保存课程数据...');
        const savedData = await storage.saveCourses(courses);
        
        // 打印结果
        console.log('\n本次爬取统计:');
        console.log('- 本次爬取课程数:', courses.length);
        console.log('- 总课程数:', savedData.total);
        console.log('- 最后更新时间:', savedData.updateTime);
        
        // 打印每个课程的基本信息
        console.log('\n课程列表:');
        courses.forEach((course, index) => {
            console.log(`\n课程 ${index + 1}/${courses.length}:`);
            console.log('标题:', course.title);
            console.log('ID:', course.pageId);
            console.log('类型:', course.type);
            console.log('发布时间:', course.publishTime);
            console.log('详情内容长度:', course.detailInfo ? course.detailInfo.length : 0);
            console.log('下载链接:', course.downloadLink || '未获取');
        });
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        // 关闭浏览器
        await crawler.close();
    }
}

// 运行测试
test(); 