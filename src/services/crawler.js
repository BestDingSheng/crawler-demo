const AuthService = require('./auth');
const cookieStore = require('../utils/cookie-store');

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

  async crawlCourseList() {
    if (!this.isLoggedIn) {
      throw new Error('请先登录');
    }

    try {
      const page = this.authService.page;
      
      // 导航到首页
      console.log('正在访问首页...');
      await page.goto('https://vip.m987.cn/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 等待课程列表加载完成
      await page.waitForSelector('#zib_widget_ui_tab_post-2-1 posts');

      // 提取课程列表数据
      const courses = await page.evaluate(() => {
        const results = [];
        const posts = document.querySelectorAll('#zib_widget_ui_tab_post-2-1 posts');

        posts.forEach(post => {
          // 获取类型
          const type = document.querySelector('.list-inline .active a')?.textContent.trim() || '';

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
            type,
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
            }
          });
        });

        return results;
      });

      return courses;
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

      console.log('\n课程详情:');
      console.log(detailInfo);

      return {
        pageId,
        detailInfo
      };

    } catch (error) {
      console.error('爬取课程详情失败:', error.message);
      throw error;
    }
  }

  async close() {
    await this.authService.close();
    this.isLoggedIn = false;
  }
}

module.exports = CrawlerService; 