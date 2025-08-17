// 主菜单场景
// 负责显示游戏标题、开始按钮和最高分等信息

class MainMenuScene {
    constructor(canvas, ctx) {
        this.canvas = canvas || (GameGlobal && GameGlobal.canvas) || document.getElementById('gameCanvas');
        this.ctx = ctx || (this.canvas ? this.canvas.getContext('2d') : null);
        this.canvasWidth = this.canvas ? this.canvas.width : 800;
        this.canvasHeight = this.canvas ? this.canvas.height : 600;
        this.isVisible = false;
        
        // UI元素位置和尺寸
        this.elements = {
            title: {
                x: this.canvas.width / 2,
                y: 200,
                text: '🐱 小猫钓鱼 🎣',
                fontSize: 48,
                color: '#FF6B6B'
            },
            
            startButton: {
                x: this.canvas.width / 2 - 100,
                y: 400,
                width: 200,
                height: 60,
                text: '开始游戏',
                fontSize: 24,
                color: '#4ECDC4',
                textColor: '#FFF'
            },
            

            
            highScore: {
                x: this.canvas.width / 2,
                y: 600,
                text: '',
                fontSize: 20,
                color: '#666'
            },
            
            instructions: {
                x: this.canvas.width / 2,
                y: 700,
                text: '点击屏幕投掷鱼竿，90秒内尽可能多钓鱼',
                fontSize: 16,
                color: '#999'
            }
        };
        
        // 绑定触摸事件
        this.bindEvents();
        
        // 背景动画参数
        this.bgAnimation = {
            waves: [],
            bubbles: []
        };
        
        // 初始化背景动画
        this.initBackgroundAnimation();
    }
    
    // 初始化背景动画
    initBackgroundAnimation() {
        // 创建波浪效果
        for (let i = 0; i < 3; i++) {
            this.bgAnimation.waves.push({
                y: 800 + i * 100,
                amplitude: 20 + i * 10,
                frequency: 0.02 + i * 0.01,
                phase: i * Math.PI / 3,
                speed: 1 + i * 0.5,
                color: `rgba(78, 205, 196, ${0.3 - i * 0.1})`
            });
        }
        
        // 创建气泡效果
        for (let i = 0; i < 10; i++) {
            this.bgAnimation.bubbles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 200,
                radius: 5 + Math.random() * 15,
                speed: 1 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }
    
    // 绑定触摸事件
    bindEvents() {
        this.clickHandler = (event) => {
            if (!this.isVisible) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            console.log('点击坐标:', x, y);
            console.log('开始按钮区域:', this.elements.startButton);
            
            // 检查开始游戏按钮
            if (this.isPointInButton(x, y, this.elements.startButton)) {
                console.log('点击了开始游戏按钮');
                this.playClickSound();
                if (this.onStartGame) {
                    this.onStartGame(); // 调用回调函数
                } else if (GameGlobal && GameGlobal.GameState && GameGlobal.SceneManager) {
                    GameGlobal.GameState.gameMode = 'normal';
                    GameGlobal.SceneManager.switchTo('GameScene');
                } else {
                    console.error('GameGlobal对象未正确初始化');
                }
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
    
    // 播放点击音效
    playClickSound() {
        console.log('播放点击音效（已禁用音频）');
        // 暂时禁用音频以避免加载错误
        // const clickSound = GameGlobal.ResourceManager.getSound('click');
        // if (clickSound) {
        //     clickSound.play();
        // }
    }
    
    // 显示场景
    show() {
        this.isVisible = true;
        this.updateHighScoreText();
        this.startRenderLoop();
    }
    
    // 隐藏场景
    hide() {
        this.isVisible = false;
        this.stopRenderLoop();
    }
    
    // 更新最高分显示
    updateHighScoreText() {
        this.elements.highScore.text = `最高分: ${GameGlobal.GameState.highScore}`;
    }
    
    // 开始渲染循环
    startRenderLoop() {
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
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.renderLoop());
    }
    
    // 更新逻辑
    update() {
        // 更新波浪动画
        this.bgAnimation.waves.forEach(wave => {
            wave.phase += wave.speed * 0.02;
        });
        
        // 更新气泡动画
        this.bgAnimation.bubbles.forEach(bubble => {
            bubble.y -= bubble.speed;
            
            // 气泡到达顶部时重置位置
            if (bubble.y < -bubble.radius) {
                bubble.y = this.canvas.height + bubble.radius;
                bubble.x = Math.random() * this.canvas.width;
            }
        });
    }
    
    // 渲染场景
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景渐变
        this.drawBackground();
        
        // 绘制背景动画
        this.drawBackgroundAnimation();
        
        // 绘制UI元素
        this.drawTitle();
        this.drawButtons();
        this.drawHighScore();
        this.drawInstructions();
    }
    
    // 绘制背景
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');  // 天空蓝
        gradient.addColorStop(0.3, '#4ECDC4'); // 浅海蓝
        gradient.addColorStop(1, '#2C5F7C');   // 深海蓝
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 绘制背景动画
    drawBackgroundAnimation() {
        // 绘制波浪
        this.bgAnimation.waves.forEach(wave => {
            this.ctx.beginPath();
            this.ctx.moveTo(0, wave.y);
            
            for (let x = 0; x <= this.canvas.width; x += 10) {
                const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.lineTo(this.canvas.width, this.canvas.height);
            this.ctx.lineTo(0, this.canvas.height);
            this.ctx.closePath();
            
            this.ctx.fillStyle = wave.color;
            this.ctx.fill();
        });
        
        // 绘制气泡
        this.bgAnimation.bubbles.forEach(bubble => {
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
            this.ctx.fill();
            
            // 绘制气泡高光
            this.ctx.beginPath();
            this.ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`;
            this.ctx.fill();
        });
    }
    
    // 绘制标题
    drawTitle() {
        const title = this.elements.title;
        this.ctx.font = `bold ${title.fontSize}px Arial`;
        this.ctx.fillStyle = title.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 绘制标题阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.fillText(title.text, title.x, title.y);
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    // 绘制按钮
    drawButtons() {
        this.drawButton(this.elements.startButton);
    }
    
    // 绘制单个按钮
    drawButton(button) {
        // 绘制按钮背景
        this.ctx.fillStyle = button.color;
        this.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // 绘制按钮边框
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        // 绘制按钮文字
        this.ctx.font = `bold ${button.fontSize}px Arial`;
        this.ctx.fillStyle = button.textColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            button.text,
            button.x + button.width / 2,
            button.y + button.height / 2
        );
    }
    
    // 绘制最高分
    drawHighScore() {
        const highScore = this.elements.highScore;
        this.ctx.font = `${highScore.fontSize}px Arial`;
        this.ctx.fillStyle = highScore.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(highScore.text, highScore.x, highScore.y);
    }
    
    // 绘制游戏说明
    drawInstructions() {
        const instructions = this.elements.instructions;
        this.ctx.font = `${instructions.fontSize}px Arial`;
        this.ctx.fillStyle = instructions.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(instructions.text, instructions.x, instructions.y);
    }
}

// MainMenuScene 实例将在 index.html 的 CatFishingGame 中创建

console.log('主菜单场景加载完成');