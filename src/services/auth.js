const puppeteer = require('puppeteer-core');
const path = require('path');

class AuthService {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: false,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
        });
        this.page = await this.browser.newPage();
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async login(username, password) {
        try {
            if (!this.browser) {
                await this.init();
            }

            console.log('正在导航到登录页面...');
            await this.page.goto('https://vip.m987.cn/user-sign?tab=signin&redirect_to', {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // 等待登录表单区域加载完成
            await this.page.waitForSelector('.sign.zib-widget', {
                visible: true,
                timeout: 5000
            });

            // 等待并点击账号密码登录链接
            console.log('点击账号密码登录链接...');
            await this.page.waitForSelector('a[data-toggle="tab"][href="#tab-signin-pas"]');
            await this.delay(1000); // 等待一下再点击
            await this.page.click('a[data-toggle="tab"][href="#tab-signin-pas"]');
            
            // 等待标签切换动画完成
            await this.delay(1500);

            // 等待登录表单激活
            console.log('等待登录表单...');
            await this.page.waitForSelector('#tab-signin-pas.active.in');
            await this.delay(500);

            // 清空并输入用户名
            console.log('输入用户名...');
            await this.page.waitForSelector('#tab-signin-pas input[name="username"]');
            await this.page.evaluate(() => document.querySelector('#tab-signin-pas input[name="username"]').value = '');
            await this.page.type('#tab-signin-pas input[name="username"]', username, { delay: 150 });
            await this.delay(800);

            // 清空并输入密码
            console.log('输入密码...');
            await this.page.waitForSelector('#tab-signin-pas input[name="password"]');
            await this.page.evaluate(() => document.querySelector('#tab-signin-pas input[name="password"]').value = '');
            await this.page.type('#tab-signin-pas input[name="password"]', password, { delay: 150 });
            await this.delay(1000);

            // 点击登录按钮
            console.log('点击登录按钮...');
            const submitButton = await this.page.waitForSelector('#tab-signin-pas button.signsubmit-loader');
            await this.delay(500);
            await submitButton.click();

            // 等待滑块验证码出现（如果有的话）
            console.log('等待可能出现的滑块验证码...');
            try {
                // 等待验证码弹窗出现
                await this.delay(2000); // 等待验证码加载
                const verifyPopup = await this.page.waitForSelector('#SliderCaptcha.modal.flex.jc.fade.in', {
                    visible: true,
                    timeout: 5000
                });
                
                if (verifyPopup) {
                    console.log('发现验证码弹窗，处理滑块验证...');
                    await this.delay(2000); // 等待验证码完全加载
                    const verificationSuccess = await this.handleSliderVerification();
                    if (!verificationSuccess) {
                        throw new Error('多次尝试后未能通过滑块验证');
                    }
                }
            } catch (error) {
                if (error.message.includes('多次尝试后未能通过滑块验证')) {
                    throw error;
                }
                console.log('未发现验证码弹窗，继续执行...', error.message);
            }

            // 等待登录成功
            console.log('等待登录结果...');
            try {
                await this.page.waitForNavigation({ 
                    waitUntil: 'networkidle0', 
                    timeout: 10000 
                });
            } catch (error) {
                console.log('导航超时，检查登录状态...');
                // 即使导航超时也检查是否已登录
                const isLoggedIn = await this.page.evaluate(() => {
                    return document.querySelector('.user-info') !== null;
                });
                
                if (!isLoggedIn) {
                    throw new Error('登录失败：登录尝试后未检测到登录状态');
                }
            }

            // 获取cookies
            const cookies = await this.page.cookies();
            return cookies;

        } catch (error) {
            console.error('登录错误:', error);
            // 保存截图用于调试
            await this.page.screenshot({ path: 'login-error.png' });
            throw error;
        }
    }

    async handleSliderVerification(maxRetries = 3) {
        console.log('处理滑块验证...');
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                console.log(`第 ${retryCount + 1} 次尝试，共 ${maxRetries} 次`);
                
                // 等待滑块和背景图加载
                const slider = await this.page.waitForSelector('.captcha-slider', { 
                    visible: true,
                    timeout: 5000
                });

                // 等待验证码图片完全加载
                await this.delay(2000);

                // 获取滑块位置信息
                const sliderBox = await slider.boundingBox();
                if (!sliderBox) {
                    console.log('无法获取滑块位置');
                    continue;
                }

                // 获取验证码图片信息并尝试识别目标位置
                const targetOffset = await this.page.evaluate(() => {
                    const canvas = document.querySelector('.slidercaptcha canvas');
                    if (!canvas) return null;

                    // 获取画布上下文
                    const ctx = canvas.getContext('2d');
                    const width = canvas.width;
                    const height = canvas.height;
                    
                    // 分析图片像素，寻找可能的缺口位置
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    
                    let lastPixel = 0;
                    let maxDiff = 0;
                    let targetX = 0;
                    
                    // 从左向右扫描，寻找像素变化最大的位置
                    for (let x = 50; x < width - 50; x++) {
                        let diffCount = 0;
                        
                        // 在每个x位置，检查垂直线上的像素变化
                        for (let y = 0; y < height; y++) {
                            const pos = (y * width + x) * 4;
                            const r = data[pos];
                            const g = data[pos + 1];
                            const b = data[pos + 2];
                            
                            // 计算当前像素的亮度
                            const brightness = (r + g + b) / 3;
                            
                            // 与上一个像素比较
                            if (Math.abs(brightness - lastPixel) > 30) {
                                diffCount++;
                            }
                            lastPixel = brightness;
                        }
                        
                        // 更新最大差异位置
                        if (diffCount > maxDiff) {
                            maxDiff = diffCount;
                            targetX = x;
                        }
                    }
                    
                    // 返回目标位置的比例
                    return targetX / width;
                });

                if (!targetOffset) {
                    throw new Error('无法确定目标位置');
                }

                // 获取容器宽度
                const containerWidth = await this.page.evaluate(() => {
                    const container = document.querySelector('.slidercaptcha');
                    return container ? container.offsetWidth : 280;
                });

                // 计算实际移动距离，添加微小随机偏移
                const startX = sliderBox.x + 5;
                const startY = sliderBox.y + sliderBox.height / 2;
                const endX = startX + (containerWidth * targetOffset) + (Math.random() * 5 - 2.5);

                // 模拟人类滑动行为
                await this.page.mouse.move(startX, startY);
                // 随机短暂停顿
                await this.delay(Math.random() * 500 + 500);
                await this.page.mouse.down();

                // 生成更自然的移动轨迹
                const steps = 50 + Math.floor(Math.random() * 20); // 更多的步数使移动更平滑
                const movePoints = this.generateTrack(startX, endX, steps);
                
                for (let i = 0; i < movePoints.length; i++) {
                    const currentX = movePoints[i];
                    // 添加自然的上下波动
                    const currentY = startY + Math.sin(i / 2) * (Math.random() * 1.5);
                    
                    await this.page.mouse.move(currentX, currentY, {
                        steps: 1
                    });
                    
                    // 随机的微小延迟
                    if (i % 3 === 0) {
                        await this.delay(Math.random() * 5 + 3);
                    }
                }

                // 模拟人类释放时的微小回弹
                await this.page.mouse.move(endX - Math.random() * 2, startY, { steps: 5 });
                await this.delay(Math.random() * 100 + 50);
                await this.page.mouse.up();
                
                // 等待验证结果
                await this.delay(2000);
                
                // 检查验证是否成功
                const success = await this.page.evaluate(() => {
                    const sliderText = document.querySelector('.sliderText');
                    const modal = document.querySelector('#SliderCaptcha.modal.flex.jc.fade.in');
                    return !modal || (sliderText && !sliderText.textContent.includes('请再试一次'));
                });
                
                if (success) {
                    console.log('滑块验证成功！');
                    return true;
                }

                console.log('验证失败，准备重试...');
                retryCount++;
                // 失败后等待更长时间再重试
                await this.delay(2000);

            } catch (error) {
                console.error(`第 ${retryCount + 1} 次尝试失败:`, error);
                retryCount++;
                await this.delay(2000);
            }
        }

        console.log('所有验证尝试均失败');
        return false;
    }

    // 生成更自然的滑动轨迹
    generateTrack(startX, endX, steps) {
        const distance = endX - startX;
        const track = [];
        let current = startX;
        let mid = distance * 0.8;
        let speed = 0;
        const t = 0.2;
        const v = distance / (steps * t);
        
        // 加速阶段
        while (current - startX < mid) {
            const a = 2 * v / (steps * t);
            speed += a * t;
            current += speed * t + (a * t * t) / 2;
            track.push(current);
        }
        
        // 减速阶段
        while (current < endX) {
            const a = -3 * v / (steps * t);
            speed += a * t;
            current += speed * t + (a * t * t) / 2;
            if (current > endX) {
                track.push(endX);
            } else {
                track.push(current);
            }
        }
        
        return track;
    }

    // 添加缓动函数使移动更自然
    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}module.exports = AuthService; 

