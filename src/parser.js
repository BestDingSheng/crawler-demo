const cheerio = require('cheerio');
const fs = require('fs');

// 读取HTML文件
const html = fs.readFileSync('src/1.html', 'utf8');
const $ = cheerio.load(html);

// 存储结果的数组
const results = [];

// 获取中创网tab下的内容
$('#zib_widget_ui_tab_post-2-1 posts').each((index, element) => {
  const post = $(element);
  
  // 动态获取type
  const type = $('.list-inline .active a').text().trim();
  
  const result = {
    type,
    title: post.find('.item-heading a').text().trim(),
    pageId: parseInt(post.find('.item-heading a').attr('href').match(/\/(\d+)/)[1]),
    desc: post.find('.item-excerpt').text().trim(),
    imgUrl: post.find('.item-thumbnail img').attr('src')
  };

  results.push(result);
});

// 打印结果
console.log(JSON.stringify(results, null, 2)); 