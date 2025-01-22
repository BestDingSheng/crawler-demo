const AuthService = require('./auth');
const cookieStore = require('../utils/cookie-store');
const Course = require('../models/course');

class CrawlerService {
  constructor() {
    this.authService = new AuthService();
    this.isLoggedIn = false;
  }

  async init() {
    if (!this.authService.browser) {
      await this.authService.init();
    }

    // 尝试加载并验证已保存的 cookies
    await this.loadAndValidateCookies();
  }

  async loadAndValidateCookies() {
    const cookies = await cookieStore.load();
    if (cookies) {
      console.log('找到已保存的 Cookies，尝试验证...');
      const page = this.authService.page;
      
      // 注入 cookies
      await page.setCookie(...cookies);
      
      // 验证登录状态
      if (await this.validateLogin()) {
        console.log('Cookies 验证成功，无需重新登录');
        this.isLoggedIn = true;
        return true;
      } else {
        console.log('Cookies 已失效，需要重新登录');
        await cookieStore.clear();
      }
    }
    return false;
  }

  async validateLogin() {
    try {
      const page = this.authService.page;
      
      // 访问测试页面
      console.log('正在验证登录状态...');
      await page.goto('https://vip.m987.cn/22973/.html', {
        waitUntil: 'networkidle0',
        timeout: 40 * 1000
      });

      // 获取页面内容
      const content = await page.content();
      
      // 检查是否包含下载链接
      const isLoggedIn = content.includes('/download?post=22973');
      console.log(isLoggedIn ? '验证通过：已登录状态' : '验证失败：未登录状态');
      
      return isLoggedIn;
    } catch (error) {
      console.error('验证登录状态失败:', error);
      return false;
    }
  }

  async login(username, password) {
    try {
      await this.init();
      
      // 如果已经登录，直接返回
      if (this.isLoggedIn) {
        return true;
      }

      // 执行登录
      console.log('开始登录...');
      const cookies = await this.authService.login(username, password);
      
      // 保存 cookies
      await cookieStore.save(cookies);
      
      // 验证登录状态
      this.isLoggedIn = await this.validateLogin();
      if (!this.isLoggedIn) {
        throw new Error('登录验证失败');
      }

      return true;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  async saveCourseToDatabase(courseData) {
    try {
      // 尝试查找已存在的记录
      const existingCourse = await Course.findOne({
        where: { pageId: courseData.pageId }
      });

      if (existingCourse) {
        // 如果课程已存在，直接跳过
        console.log(`课程已存在，跳过: ${courseData.title}`);
        return;
      } else {
        // 创建新记录
        await Course.create(courseData);
        console.log(`新增课程: ${courseData.title}`);
      }
    } catch (error) {
      console.error(`保存课程失败: ${courseData.title}`, error);
      throw error;
    }
  }

  async crawlCourseList() {
    if (!this.isLoggedIn) {
      throw new Error('请先登录');
    }

    try {
      const page = this.authService.page;
      const allCourses = [];
      
      // 导航到首页
      console.log('正在访问首页...');
      await page.goto('https://vip.m987.cn/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 定义所有tab的信息
      const tabs = [
        { id: '#zib_widget_ui_tab_post-2-1', name: '中创网' },
        // { id: '#zib_widget_ui_tab_post-2-2', name: '福源论坛' },
        // { id: '#zib_widget_ui_tab_post-2-3', name: '冒泡网' },
        // { id: '#zib_widget_ui_tab_post-2-4', name: '自学成才网' }
      ];

      // 添加延迟函数
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      // 遍历每个tab
      for (const tab of tabs) {
        console.log(`\n开始爬取 ${tab.name} 的内容...`);
        
        // 点击tab切换内容
        if (tab.id !== '#zib_widget_ui_tab_post-2-1') { // 第一个tab默认已经激活
          const tabSelector = `a[href="${tab.id}"]`;
          await page.waitForSelector(tabSelector);
          await page.click(tabSelector);
          await delay(2000); // 等待内容加载
        }

        // 点击两次"加载更多"以获取三页数据
        for (let i = 0; i < 2; i++) {
          try {
            const loadMoreSelector = `${tab.id} .ajax-next a`;
            await page.waitForSelector(loadMoreSelector, { timeout: 5000 });
            await page.click(loadMoreSelector);
            console.log(`已点击第 ${i + 1} 次加载更多`);
            await delay(2000); // 等待新内容加载
          } catch (error) {
            console.log(`加载更多按钮点击失败: ${error.message}`);
            break;
          }
        }

        // 等待所有文章加载完成
        await page.waitForSelector(`${tab.id} posts`);

        // 提取当前tab下的所有文章数据
        const tabCourses = await page.evaluate((tabId, tabName) => {
          const results = [];
          const posts = document.querySelectorAll(`${tabId} posts`);

          posts.forEach(post => {
            // 获取互动数据
            const comments = parseInt(post.querySelector('.meta-comm a')?.textContent) || 0;
            const views = parseInt(post.querySelector('.meta-view')?.textContent) || 0;
            const likes = parseInt(post.querySelector('.meta-like')?.textContent) || 0;

            // 获取链接和标题
            const titleElement = post.querySelector('.item-heading a');
            const link = titleElement?.href || '';
            const title = titleElement?.textContent.trim() || '';

            // 获取其他信息
            const desc = post.querySelector('.item-excerpt')?.textContent.trim() || '';
            const imgUrl = post.querySelector('.item-thumbnail img')?.src || '';
            const publishTime = post.querySelector('.meta-author span[title]')?.getAttribute('title') || '';

            // 从链接中提取 pageId
            const pageIdMatch = link.match(/\/(\d+)/);
            const pageId = pageIdMatch ? parseInt(pageIdMatch[1]) : null;

            results.push({
              type: tabName,
              title,
              pageId,
              link,
              desc,
              imgUrl,
              publishTime,
              stats: {
                comments,
                views,
                likes
              },
              detailInfo: null,    // 将在后面填充
              downloadLink: null    // 将在后面填充
            });
          });

          return results;
        }, tab.id, tab.name);

        allCourses.push(...tabCourses);
        console.log(`已获取 ${tab.name} 的 ${tabCourses.length} 条数据`);
      }

      console.log(`\n所有tab爬取完成，共获取到 ${allCourses.length} 个课程`);

      // 修改保存逻辑
      for (let i = 0; i < allCourses.length; i++) {
        const course = allCourses[i];
        console.log(`\n正在处理第 ${i + 1}/${allCourses.length} 个课程...`);
        
        try {
          // 获取详情和下载链接
          await page.goto(course.link, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });

          // 获取详情内容
          const detailInfo = await page.evaluate(() => {
            const fontElement = document.querySelector('.wp-posts-content');
            if (!fontElement) return null;

            // 在浏览器环境中完成 DOM 清理
            // 1. 删除 img 标签
            fontElement.querySelectorAll('img').forEach(img => img.remove());
            // 2. 删除特定类名的元素
            fontElement.querySelectorAll('.article-timeout, .text-center, .article-tags').forEach(el => el.remove());
            // 3. 删除 style 标签
            fontElement.querySelectorAll('style').forEach(style => style.remove());
            // 4. 删除空标签
            function removeEmptyElements(element) {
              element.querySelectorAll('*').forEach(el => {
                removeEmptyElements(el);
                if (!el.innerHTML.trim()) {
                  el.remove();
                }
              });
              if (!element.innerHTML.trim()) {
                element.remove();
              }
            }
            removeEmptyElements(fontElement);

            // 返回清理后的 HTML
            return fontElement.outerHTML;
          });

          if (detailInfo) {
            course.detailInfo = detailInfo;  // 直接使用清理后的 HTML
          }

          // 获取下载链接
          const downloadUrl = `https://vip.m987.cn/download?post=${course.pageId}`;
          await page.goto(downloadUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });

          // 等待百度网盘按钮出现
          await page.waitForSelector('a.but.b-theme.baidu[href*="pay-download"]', { timeout: 10000 });
          
          // 获取按钮的href属性
          const payDownloadUrl = await page.$eval('a.but.b-theme.baidu[href*="pay-download"]', el => el.href);
          
          // 访问支付下载页面
          await page.goto(payDownloadUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });

          // 获取最终的URL
          const finalUrl = page.url();
          if (finalUrl.includes('pan.baidu.com/share/init')) {
            course.downloadLink = finalUrl;
          }

          // 保存到数据库
          await this.saveCourseToDatabase(course);

        } catch (error) {
          console.error(`处理课程 ${course.title} 失败:`, error.message);
        }

        // 添加延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return allCourses;

    } catch (error) {
      console.error('爬取课程列表失败:', error);
      throw error;
    }
  }

  async crawlCourseDetail(pageId = 22973) {
    try {
      // 确保已登录
      const isLoggedIn = await this.validateLogin();
      if (!isLoggedIn) {
        throw new Error('需要登录才能访问课程详情');
      }

      // 构建详情页URL
      const detailUrl = `https://vip.m987.cn/${pageId}/.html`;
      console.log(`\n开始爬取课程详情...`);
      
      // 访问详情页
      await this.authService.page.goto(detailUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 获取课程标题
      const title = await this.authService.page.$eval('.article-title', el => el.textContent.trim());
      console.log(`课程标题: ${title}`);
      console.log(`课程ID: ${pageId}`);
      console.log(`正在访问课程详情页: ${detailUrl}`);

      // 提取课程详情信息
      const detailInfo = await this.authService.page.evaluate(() => {
        const fontElement = document.querySelector('.wp-posts-content font');
        if (!fontElement) return null;
        
        // 获取font标签的outerHTML
        return fontElement.outerHTML;
      });

      if (!detailInfo) {
        throw new Error('未找到课程详情内容');
      }

      // 获取下载链接
      console.log('正在获取下载链接...');
      const downloadLink = await this.getDownloadLink(pageId);

      console.log('\n课程详情:');
      console.log(detailInfo);
      console.log('\n下载链接:');
      console.log(downloadLink);

      return {
        pageId,
        detailInfo,
        downloadLink
      };

    } catch (error) {
      console.error('爬取课程详情失败:', error.message);
      throw error;
    }
  }

  async getDownloadLink(pageId) {
    try {
      const page = this.authService.page;
      
      // 访问下载页面
      const downloadUrl = `https://vip.m987.cn/download?post=${pageId}`;
      console.log(`访问下载页面: ${downloadUrl}`);
      
      await page.goto(downloadUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 等待百度网盘按钮出现
      await page.waitForSelector('a.but.b-theme.baidu[href*="pay-download"]', { timeout: 10000 });
      
      // 获取按钮的href属性
      const payDownloadUrl = await page.$eval('a.but.b-theme.baidu[href*="pay-download"]', el => el.href);
      console.log('获取到支付下载链接:', payDownloadUrl);
      
      // 访问支付下载页面
      const response = await page.goto(payDownloadUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 获取最终的URL（经过所有重定向后的URL）
      const finalUrl = page.url();
      if (!finalUrl.includes('pan.baidu.com/share/init')) {
        throw new Error('未能获取到百度网盘链接');
      }

      return finalUrl;

    } catch (error) {
      console.error('获取下载链接失败:', error.message);
      throw error;
    }
  }

  async close() {
    await this.authService.close();
    this.isLoggedIn = false;
  }
}

module.exports = CrawlerService; 