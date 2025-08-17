// 游戏结算场景
// 显示游戏结束后的分数统计和重新开始选项

class GameOverScene {
    constructor(canvas, ctx) {
        this.canvas = canvas || (GameGlobal && GameGlobal.canvas) || document.getElementById('gameCanvas');
        this.ctx = ctx || (this.canvas ? this.canvas.getContext('2d') : null);
        this.canvasWidth = this.canvas ? this.canvas.width : 800;
        this.canvasHeight = this.canvas ? this.canvas.height : 600;
        this.isVisible = false;
        
        // UI元素定义
        this.ui = {
            title: {
                text: '游戏结束',
                x: this.canvas.width / 2,
                y: 150,
                fontSize: 48,
                color: '#FF6B6B'
            },
            scoreDisplay: {
                x: this.canvas.width / 2,
                y: 250,
                fontSize: 32,
                color: '#4ECDC4'
            },
            highScoreDisplay: {
                x: this.canvas.width / 2,
                y: 300,
                fontSize: 24,
                color: '#FFD93D'
            },
            newRecordText: {
                x: this.canvas.width / 2,
                y: 350,
                fontSize: 28,
                color: '#FF6B6B'
            },
            restartButton: {
                x: this.canvas.width / 2 - 100,
                y: 400,
                width: 200,
                height: 60,
                text: '再来一局',
                fontSize: 24,
                bgColor: '#4ECDC4',
                textColor: '#FFF',
                hoverColor: '#45B7B8'
            },
            menuButton: {
                x: this.canvas.width / 2 - 100,
                y: 480,
                width: 200,
                height: 60,
                text: '返回主菜单',
                fontSize: 20,
                bgColor: '#95A5A6',
                textColor: '#FFF',
                hoverColor: '#7F8C8D'
            },
            shareButton: {
                x: this.canvas.width / 2 - 100,
                y: 560,
                width: 200,
                height: 50,
                text: '分享成绩',
                fontSize: 18,
                bgColor: '#E74C3C',
                textColor: '#FFF',
                hoverColor: '#C0392B'
            }
        };
        
        // 动画相关
        this.animationTime = 0;
        this.particles = [];
        this.isNewRecord = false;
        
        // 绑定事件
        this.bindEvents();
    }
    
    // 绑定触摸事件
    bindEvents() {
        this.clickHandler = (event) => {
            if (!this.isVisible) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // 检查重新开始按钮
            if (this.isPointInButton(x, y, this.ui.restartButton)) {
                this.restartGame();
                return;
            }
            
            // 检查返回主菜单按钮
            if (this.isPointInButton(x, y, this.ui.menuButton)) {
                this.returnToMenu();
                return;
            }
            
            // 检查分享按钮
            if (this.isPointInButton(x, y, this.ui.shareButton)) {
                this.shareScore();
                return;
            }
        };
        
        // 使用标准的浏览器事件监听器
        this.canvas.addEventListener('click', this.clickHandler);
    }
    
    // 检查点击是否在按钮内
    isPointInButton(x, y, button) {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }
    
    // 重新开始游戏
    restartGame() {
        // 播放按钮音效
        const buttonSound = GameGlobal.ResourceManager.getSound('button');
        if (buttonSound) {
            buttonSound.play();
        }
        
        // 使用相同的游戏模式重新开始
        GameGlobal.SceneManager.switchTo('GameScene');
    }
    
    // 返回主菜单
    returnToMenu() {
        // 播放按钮音效
        const buttonSound = GameGlobal.ResourceManager.getSound('button');
        if (buttonSound) {
            buttonSound.play();
        }
        
        GameGlobal.SceneManager.switchTo('MainMenu');
    }
    
    // 分享成绩
    shareScore() {
        // 播放按钮音效
        const buttonSound = GameGlobal.ResourceManager.getSound('button');
        if (buttonSound) {
            buttonSound.play();
        }
        
        // 微信分享功能
        if (typeof wx !== 'undefined' && wx.shareAppMessage) {
            wx.shareAppMessage({
                title: `我在小猫钓鱼中获得了${GameGlobal.GameState.score}分！`,
                desc: '快来挑战我的记录吧！',
                path: 'pages/index/index',
                success: () => {
                    console.log('分享成功');
                },
                fail: (error) => {
                    console.log('分享失败:', error);
                }
            });
        } else {
            // 非微信环境的处理
            console.log('分享功能仅在微信小游戏中可用');
        }
    }
    
    // 显示场景
    show() {
        this.isVisible = true;
        this.animationTime = 0;
        this.particles = [];
        
        // 检查是否创造了新记录
        this.checkNewRecord();
        
        // 如果是新记录，创建庆祝粒子效果
        if (this.isNewRecord) {
            this.createCelebrationParticles();
        }
        
        this.startRenderLoop();
    }
    
    // 隐藏场景
    hide() {
        this.isVisible = false;
        this.stopRenderLoop();
    }
    
    // 检查是否创造新记录
    checkNewRecord() {
        const currentScore = GameGlobal.GameState.score;
        const highScore = GameGlobal.GameState.getHighScore();
        
        this.isNewRecord = currentScore > highScore;
        
        if (this.isNewRecord) {
            // 更新最高分
            GameGlobal.GameState.setHighScore(currentScore);
        }
    }
    
    // 创建庆祝粒子效果
    createCelebrationParticles() {
        for (let i = 0; i < 50; i++) {
            const particle = {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                color: this.getRandomColor(),
                size: 3 + Math.random() * 8,
                life: 2 + Math.random() * 2,
                maxLife: 2 + Math.random() * 2,
                alpha: 1,
                gravity: 200
            };
            
            this.particles.push(particle);
        }
    }
    
    // 获取随机颜色
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7B8', '#FFD93D', '#6C5CE7', '#A29BFE'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 开始渲染循环
    startRenderLoop() {
        this.lastTime = Date.now();
        this.renderLoop();
    }
    
    // 停止渲染循环
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // 渲染循环
    renderLoop() {
        if (!this.isVisible) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.renderLoop());
    }
    
    // 更新逻辑
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
    }
    
    // 更新粒子效果
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // 应用重力
            particle.vy += particle.gravity * deltaTime;
            
            // 更新生命值和透明度
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            
            // 移除死亡的粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 渲染场景
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制粒子效果
        this.drawParticles();
        
        // 绘制UI元素
        this.drawTitle();
        this.drawScoreInfo();
        this.drawButtons();
        
        // 如果是新记录，绘制特殊效果
        if (this.isNewRecord) {
            this.drawNewRecordEffect();
        }
    }
    
    // 绘制背景
    drawBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2C3E50');
        gradient.addColorStop(1, '#34495E');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制装饰性的圆圈
        this.drawDecorationCircles();
    }
    
    // 绘制装饰圆圈
    drawDecorationCircles() {
        const circles = [
            { x: 100, y: 100, radius: 30, alpha: 0.1 },
            { x: this.canvas.width - 80, y: 150, radius: 40, alpha: 0.08 },
            { x: 150, y: this.canvas.height - 100, radius: 35, alpha: 0.12 },
            { x: this.canvas.width - 120, y: this.canvas.height - 80, radius: 25, alpha: 0.1 }
        ];
        
        circles.forEach(circle => {
            this.ctx.save();
            this.ctx.globalAlpha = circle.alpha;
            this.ctx.fillStyle = '#4ECDC4';
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    // 绘制标题
    drawTitle() {
        // 标题动画效果
        const scale = 1 + Math.sin(this.animationTime * 2) * 0.05;
        
        this.ctx.save();
        this.ctx.translate(this.ui.title.x, this.ui.title.y);
        this.ctx.scale(scale, scale);
        
        // 绘制标题阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.font = `bold ${this.ui.title.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.ui.title.text, 3, 3);
        
        // 绘制标题文字
        this.ctx.fillStyle = this.ui.title.color;
        this.ctx.fillText(this.ui.title.text, 0, 0);
        
        this.ctx.restore();
    }
    
    // 绘制分数信息
    drawScoreInfo() {
        const currentScore = GameGlobal.GameState.score;
        const highScore = GameGlobal.GameState.getHighScore();
        
        // 绘制当前分数
        this.ctx.fillStyle = this.ui.scoreDisplay.color;
        this.ctx.font = `bold ${this.ui.scoreDisplay.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`本次分数: ${currentScore}`, this.ui.scoreDisplay.x, this.ui.scoreDisplay.y);
        
        // 绘制最高分
        this.ctx.fillStyle = this.ui.highScoreDisplay.color;
        this.ctx.font = `${this.ui.highScoreDisplay.fontSize}px Arial`;
        this.ctx.fillText(`最高分: ${highScore}`, this.ui.highScoreDisplay.x, this.ui.highScoreDisplay.y);
        
        // 如果是新记录，显示特殊文字
        if (this.isNewRecord) {
            const alpha = 0.7 + Math.sin(this.animationTime * 4) * 0.3;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = this.ui.newRecordText.color;
            this.ctx.font = `bold ${this.ui.newRecordText.fontSize}px Arial`;
            this.ctx.fillText('🎉 新记录！ 🎉', this.ui.newRecordText.x, this.ui.newRecordText.y);
            this.ctx.restore();
        }
    }
    
    // 绘制按钮
    drawButtons() {
        this.drawButton(this.ui.restartButton);
        this.drawButton(this.ui.menuButton);
        this.drawButton(this.ui.shareButton);
    }
    
    // 绘制单个按钮
    drawButton(button) {
        // 按钮动画效果
        const hoverScale = 1 + Math.sin(this.animationTime * 3) * 0.02;
        
        this.ctx.save();
        this.ctx.translate(button.x + button.width / 2, button.y + button.height / 2);
        this.ctx.scale(hoverScale, hoverScale);
        
        // 绘制按钮阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-button.width / 2 + 3, -button.height / 2 + 3, button.width, button.height);
        
        // 绘制按钮背景
        this.ctx.fillStyle = button.bgColor;
        this.ctx.fillRect(-button.width / 2, -button.height / 2, button.width, button.height);
        
        // 绘制按钮边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-button.width / 2, -button.height / 2, button.width, button.height);
        
        // 绘制按钮文字
        this.ctx.fillStyle = button.textColor;
        this.ctx.font = `bold ${button.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(button.text, 0, 0);
        
        this.ctx.restore();
    }
    
    // 绘制新记录特效
    drawNewRecordEffect() {
        // 绘制光环效果
        const radius = 100 + Math.sin(this.animationTime * 3) * 20;
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2,
            0,
            this.canvas.width / 2, this.canvas.height / 2,
            radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 215, 61, 0)');
        gradient.addColorStop(0.7, 'rgba(255, 215, 61, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 215, 61, 0)');
        
        this.ctx.save();
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    // 绘制粒子效果
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
}

// GameOverScene 实例将在 index.html 的 CatFishingGame 中创建

console.log('游戏结算场景加载完成');