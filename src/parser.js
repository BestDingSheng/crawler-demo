const cheerio = require('cheerio');
const axios = require('axios');

// 目标网站URL
const TARGET_URL = 'https://vip.m987.cn/';

// 处理URL，确保完整性
function normalizeUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return TARGET_URL.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
}

async function crawlHomePage() {
  try {
    // 发送HTTP请求获取页面内容
    const response = await axios.get(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': TARGET_URL
      }
    });
    
    const $ = cheerio.load(response.data);
    const results = [];

    // 获取中创网tab下的内容
    $('#zib_widget_ui_tab_post-2-1 posts').each((index, element) => {
      const post = $(element);
      
      // 动态获取type
      const type = $('.list-inline .active a').text().trim();
      
      // 获取互动数据
      const comments = parseInt(post.find('.meta-comm a').text()) || 0;
      const views = parseInt(post.find('.meta-view').text()) || 0;
      const likes = parseInt(post.find('.meta-like').text()) || 0;
      
      // 获取发布时间
      const publishTime = post.find('.meta-author span[title]').attr('title');
      
      // 获取链接
      const link = post.find('.item-heading a').attr('href');
      
      const result = {
        type,
        title: post.find('.item-heading a').text().trim(),
        pageId: parseInt(link.match(/\/(\d+)/)[1]),
        link: normalizeUrl(link),
        desc: post.find('.item-excerpt').text().trim(),
        imgUrl: normalizeUrl(post.find('.item-thumbnail img').attr('src')),
        publishTime,
        stats: {
          comments,
          views,
          likes
        }
      };

      results.push(result);
    });

    return results;
  } catch (error) {
    console.error('爬取过程中出现错误:', error.message);
    throw error;
  }
}

// 执行爬虫
crawlHomePage()
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(error => {
    console.error('程序执行失败:', error);
  }); 