const AuthService = require('../services/auth');
require('dotenv').config();

async function testLogin() {
    const authService = new AuthService();
    try {
        console.log('Starting login test...');
        await authService.login(process.env.AUTH_USERNAME, process.env.AUTH_PASSWORD);
        console.log('Login successful!');
    } catch (error) {
        console.error('Login test failed:', error);
    } finally {
        await authService.close();
    }
}

testLogin(); 