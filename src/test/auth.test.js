const AuthService = require('../services/auth');
require('dotenv').config();

async function testLogin() {
    const authService = new AuthService();
    try {
        console.log('开始登录测试...');
        console.log('使用账号:', process.env.AUTH_USERNAME);
        const cookies = await authService.login(process.env.AUTH_USERNAME, process.env.AUTH_PASSWORD);
        console.log('登录成功！获取到 cookies:', cookies.length, '个');
        return true;
    } catch (error) {
        console.error('登录测试失败:', error.message);
        return false;
    } finally {
        console.log('正在关闭浏览器...');
        await authService.close();
        console.log('测试完成。');
    }
}

testLogin().then(success => {
    process.exit(success ? 0 : 1);
}); 