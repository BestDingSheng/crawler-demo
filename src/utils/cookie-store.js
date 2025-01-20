const fs = require('fs');
const path = require('path');

class CookieStore {
    constructor() {
        this.cookieFile = path.join(process.cwd(), 'cookies.json');
    }

    // 保存 cookies 到文件
    async save(cookies) {
        try {
            await fs.promises.writeFile(
                this.cookieFile,
                JSON.stringify(cookies, null, 2)
            );
            console.log('Cookies 已保存到文件');
        } catch (error) {
            console.error('保存 Cookies 失败:', error);
            throw error;
        }
    }

    // 从文件加载 cookies
    async load() {
        try {
            if (!fs.existsSync(this.cookieFile)) {
                console.log('没有找到 Cookies 文件');
                return null;
            }

            const data = await fs.promises.readFile(this.cookieFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('加载 Cookies 失败:', error);
            return null;
        }
    }

    // 删除 cookies 文件
    async clear() {
        try {
            if (fs.existsSync(this.cookieFile)) {
                await fs.promises.unlink(this.cookieFile);
                console.log('Cookies 文件已删除');
            }
        } catch (error) {
            console.error('删除 Cookies 文件失败:', error);
        }
    }
}

module.exports = new CookieStore(); 