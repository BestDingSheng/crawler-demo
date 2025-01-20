const CrawlerService = require('../services/crawler');

async function test() {
    const crawler = new CrawlerService();
    try {
        // 初始化爬虫（会自动尝试加载和验证已保存的 cookies）
        await crawler.init();
        
        // 如果没有登录，则执行登录
        if (!crawler.isLoggedIn) {
            console.log('需要登录，开始登录...');
            await crawler.login('deson', '11223344');
        }
        
        // 爬取课程列表
        console.log('开始爬取课程列表...');
        const courses = await crawler.crawlCourseList();
        
        // 打印结果
        console.log('爬取完成，共获取到 %d 个课程:', courses.length);
        console.log(JSON.stringify(courses, null, 2));
        
    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        // 关闭浏览器
        await crawler.close();
    }
}

// 运行测试
test(); 