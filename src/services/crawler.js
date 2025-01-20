const puppeteer = require('puppeteer-core');

class CrawlerService {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.platform === 'darwin' 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'  // macOS
        : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'   // Windows
        : '/usr/bin/google-chrome',                                      // Linux
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async crawlPage(url) {
    if (!this.browser) {
      await this.initialize();
    }

    try {
      const page = await this.browser.newPage();
      
      // Set default navigation timeout
      page.setDefaultNavigationTimeout(30000);

      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Get page title
      const title = await page.title();

      // Get page content (example)
      const content = await page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          // Add more selectors as needed
        };
      });

      await page.close();
      return content;

    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new CrawlerService(); 