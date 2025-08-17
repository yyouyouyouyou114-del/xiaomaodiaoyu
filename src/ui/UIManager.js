// UI管理器
// 负责管理游戏中所有UI元素的显示和交互

class UIManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // UI配置
        this.config = {
            // 颜色主题
            colors: {
                primary: '#4A90E2',
                secondary: '#7ED321',
                accent: '#F5A623',
                danger: '#D0021B',
                warning: '#F8E71C',
                success: '#50E3C2',
                background: 'rgba(0, 0, 0, 0.7)',
                text: '#FFFFFF',
                textSecondary: '#CCCCCC'
            },
            
            // 字体设置
            fonts: {
                large: 'bold 24px Arial',
                medium: 'bold 18px Arial',
                small: '14px Arial',
                tiny: '12px Arial'
            },
            
            // 布局设置
            layout: {
                padding: 20,
                margin: 10,
                buttonHeight: 40,
                iconSize: 32
            },
            
            // 动画设置
            animations: {
                fadeSpeed: 0.05,
                scaleSpeed: 0.1,
                slideSpeed: 5
            }
        };
        
        // UI元素
        this.elements = {
            scoreBoard: null,
            timer: null,
            powerUpBar: null,
            comboDisplay: null,
            pauseButton: null,
            gameOverOverlay: null,
            pauseOverlay: null,
            notifications: []
        };
        
        // UI状态
        this.state = {
            visible: true,
            paused: false,
            gameOver: false,
            animating: false
        };
        
        // 触摸/点击处理
        this.touchHandler = {
            isPressed: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
        // 通知系统
        this.notifications = [];
        
        this.init();
    }
    
    // 初始化
    init() {
        this.createUIElements();
        this.setupEventListeners();
        console.log('UI管理器初始化完成');
    }
    
    // 创建UI元素
    createUIElements() {
        // 得分板
        this.elements.scoreBoard = {
            x: this.config.layout.padding,
            y: this.config.layout.padding,
            width: 200,
            height: 80,
            score: 0,
            highScore: 0,
            visible: true,
            alpha: 1.0
        };
        
        // 计时器
        this.elements.timer = {
            x: this.canvas.width - 150 - this.config.layout.padding,
            y: this.config.layout.padding,
            width: 150,
            height: 60,
            timeRemaining: 0,
            totalTime: 0,
            visible: true,
            alpha: 1.0,
            warning: false
        };
        
        // 道具栏
        this.elements.powerUpBar = {
            x: this.config.layout.padding,
            y: this.canvas.height - 100 - this.config.layout.padding,
            width: this.canvas.width - this.config.layout.padding * 2,
            height: 100,
            powerUps: [],
            visible: true,
            alpha: 1.0
        };
        
        // 连击显示
        this.elements.comboDisplay = {
            x: this.canvas.width / 2,
            y: 150,
            combo: 0,
            visible: false,
            alpha: 0.0,
            scale: 1.0,
            pulseTimer: 0
        };
        
        // 暂停按钮
        this.elements.pauseButton = {
            x: this.canvas.width - 60 - this.config.layout.padding,
            y: this.canvas.height - 60 - this.config.layout.padding,
            width: 50,
            height: 50,
            visible: true,
            alpha: 1.0,
            pressed: false
        };
        
        // 游戏结束覆盖层
        this.elements.gameOverOverlay = {
            visible: false,
            alpha: 0.0,
            scale: 0.8,
            finalScore: 0,
            newRecord: false,
            buttons: {
                restart: { x: 0, y: 0, width: 120, height: 40, pressed: false },
                menu: { x: 0, y: 0, width: 120, height: 40, pressed: false }
            }
        };
        
        // 暂停覆盖层
        this.elements.pauseOverlay = {
            visible: false,
            alpha: 0.0,
            buttons: {
                resume: { x: 0, y: 0, width: 120, height: 40, pressed: false },
                restart: { x: 0, y: 0, width: 120, height: 40, pressed: false },
                menu: { x: 0, y: 0, width: 120, height: 40, pressed: false }
            }
        };
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 触摸/鼠标事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    // 更新UI
    update(deltaTime, gameState) {
        // 更新得分板
        this.updateScoreBoard(gameState);
        
        // 更新计时器
        this.updateTimer(gameState);
        
        // 更新道具栏
        this.updatePowerUpBar(gameState);
        
        // 更新连击显示
        this.updateComboDisplay(gameState, deltaTime);
        
        // 更新通知
        this.updateNotifications(deltaTime);
        
        // 更新覆盖层
        this.updateOverlays(deltaTime);
    }
    
    // 更新得分板
    updateScoreBoard(gameState) {
        const scoreBoard = this.elements.scoreBoard;
        scoreBoard.score = gameState.score || 0;
        scoreBoard.highScore = gameState.highScore || 0;
    }
    
    // 更新计时器
    updateTimer(gameState) {
        const timer = this.elements.timer;
        timer.timeRemaining = gameState.timeRemaining || 0;
        timer.totalTime = gameState.totalTime || 60;
        
        // 时间警告
        timer.warning = timer.timeRemaining <= 10 && timer.timeRemaining > 0;
    }
    
    // 更新道具栏
    updatePowerUpBar(gameState) {
        const powerUpBar = this.elements.powerUpBar;
        powerUpBar.powerUps = gameState.powerUps || [];
    }
    
    // 更新连击显示
    updateComboDisplay(gameState, deltaTime) {
        const comboDisplay = this.elements.comboDisplay;
        const newCombo = gameState.combo || 0;
        
        if (newCombo > 1 && newCombo !== comboDisplay.combo) {
            // 显示连击
            comboDisplay.combo = newCombo;
            comboDisplay.visible = true;
            comboDisplay.alpha = 1.0;
            comboDisplay.scale = 1.5;
            comboDisplay.pulseTimer = 0;
        } else if (newCombo <= 1) {
            // 隐藏连击
            comboDisplay.visible = false;
            comboDisplay.alpha = 0.0;
        }
        
        // 动画效果
        if (comboDisplay.visible) {
            comboDisplay.pulseTimer += deltaTime;
            comboDisplay.scale = 1.0 + Math.sin(comboDisplay.pulseTimer * 0.01) * 0.1;
        }
    }
    
    // 更新通知
    updateNotifications(deltaTime) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            
            notification.life -= deltaTime;
            notification.y -= notification.speed;
            
            // 淡出效果
            if (notification.life < 500) {
                notification.alpha = notification.life / 500;
            }
            
            // 移除过期通知
            if (notification.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }
    
    // 更新覆盖层
    updateOverlays(deltaTime) {
        // 游戏结束覆盖层
        if (this.elements.gameOverOverlay.visible) {
            this.elements.gameOverOverlay.alpha = Math.min(1.0, 
                this.elements.gameOverOverlay.alpha + this.config.animations.fadeSpeed);
            this.elements.gameOverOverlay.scale = Math.min(1.0, 
                this.elements.gameOverOverlay.scale + this.config.animations.scaleSpeed);
        }
        
        // 暂停覆盖层
        if (this.elements.pauseOverlay.visible) {
            this.elements.pauseOverlay.alpha = Math.min(1.0, 
                this.elements.pauseOverlay.alpha + this.config.animations.fadeSpeed);
        }
    }
    
    // 渲染UI
    render() {
        if (!this.state.visible) return;
        
        this.ctx.save();
        
        // 渲染得分板
        this.renderScoreBoard();
        
        // 渲染计时器
        this.renderTimer();
        
        // 渲染道具栏
        this.renderPowerUpBar();
        
        // 渲染连击显示
        this.renderComboDisplay();
        
        // 渲染暂停按钮
        this.renderPauseButton();
        
        // 渲染通知
        this.renderNotifications();
        
        // 渲染覆盖层
        this.renderOverlays();
        
        this.ctx.restore();
    }
    
    // 渲染得分板
    renderScoreBoard() {
        const scoreBoard = this.elements.scoreBoard;
        if (!scoreBoard.visible) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = scoreBoard.alpha;
        
        // 背景
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(scoreBoard.x, scoreBoard.y, scoreBoard.width, scoreBoard.height);
        
        // 边框
        this.ctx.strokeStyle = this.config.colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(scoreBoard.x, scoreBoard.y, scoreBoard.width, scoreBoard.height);
        
        // 当前得分
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = this.config.fonts.medium;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('得分:', scoreBoard.x + 10, scoreBoard.y + 25);
        
        this.ctx.fillStyle = this.config.colors.accent;
        this.ctx.font = this.config.fonts.large;
        this.ctx.fillText(scoreBoard.score.toString(), scoreBoard.x + 10, scoreBoard.y + 50);
        
        // 最高分
        this.ctx.fillStyle = this.config.colors.textSecondary;
        this.ctx.font = this.config.fonts.small;
        this.ctx.fillText(`最高: ${scoreBoard.highScore}`, scoreBoard.x + 10, scoreBoard.y + 70);
        
        this.ctx.restore();
    }
    
    // 渲染计时器
    renderTimer() {
        const timer = this.elements.timer;
        if (!timer.visible) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = timer.alpha;
        
        // 背景
        this.ctx.fillStyle = timer.warning ? this.config.colors.danger : this.config.colors.background;
        this.ctx.fillRect(timer.x, timer.y, timer.width, timer.height);
        
        // 边框
        this.ctx.strokeStyle = timer.warning ? this.config.colors.danger : this.config.colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(timer.x, timer.y, timer.width, timer.height);
        
        // 时间文字
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = this.config.fonts.medium;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('时间', timer.x + timer.width / 2, timer.y + 20);
        
        // 时间数值
        const minutes = Math.floor(timer.timeRemaining / 60);
        const seconds = timer.timeRemaining % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.ctx.fillStyle = timer.warning ? this.config.colors.danger : this.config.colors.accent;
        this.ctx.font = this.config.fonts.large;
        this.ctx.fillText(timeText, timer.x + timer.width / 2, timer.y + 45);
        
        // 进度条
        const progress = timer.totalTime > 0 ? timer.timeRemaining / timer.totalTime : 0;
        const barWidth = timer.width - 20;
        const barHeight = 4;
        const barX = timer.x + 10;
        const barY = timer.y + timer.height - 10;
        
        this.ctx.fillStyle = this.config.colors.textSecondary;
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = timer.warning ? this.config.colors.danger : this.config.colors.success;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        this.ctx.restore();
    }
    
    // 渲染道具栏
    renderPowerUpBar() {
        const powerUpBar = this.elements.powerUpBar;
        if (!powerUpBar.visible) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = powerUpBar.alpha;
        
        // 背景
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(powerUpBar.x, powerUpBar.y, powerUpBar.width, powerUpBar.height);
        
        // 边框
        this.ctx.strokeStyle = this.config.colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(powerUpBar.x, powerUpBar.y, powerUpBar.width, powerUpBar.height);
        
        // 标题
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = this.config.fonts.medium;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('道具', powerUpBar.x + 10, powerUpBar.y + 25);
        
        // 道具图标
        const iconSize = this.config.layout.iconSize;
        const iconSpacing = iconSize + 10;
        let iconX = powerUpBar.x + 10;
        const iconY = powerUpBar.y + 35;
        
        powerUpBar.powerUps.forEach((powerUp, index) => {
            if (powerUp.active) {
                // 道具背景
                this.ctx.fillStyle = this.config.colors.success;
                this.ctx.fillRect(iconX, iconY, iconSize, iconSize);
                
                // 道具图标（简化绘制）
                this.ctx.fillStyle = this.config.colors.text;
                this.ctx.font = this.config.fonts.small;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(powerUp.name.charAt(0), iconX + iconSize / 2, iconY + iconSize / 2 + 5);
                
                // 剩余时间
                if (powerUp.duration > 0) {
                    const timeLeft = Math.ceil(powerUp.duration / 1000);
                    this.ctx.fillStyle = this.config.colors.warning;
                    this.ctx.font = this.config.fonts.tiny;
                    this.ctx.fillText(timeLeft.toString(), iconX + iconSize / 2, iconY + iconSize + 12);
                }
                
                iconX += iconSpacing;
            }
        });
        
        this.ctx.restore();
    }
    
    // 渲染连击显示
    renderComboDisplay() {
        const comboDisplay = this.elements.comboDisplay;
        if (!comboDisplay.visible) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = comboDisplay.alpha;
        this.ctx.translate(comboDisplay.x, comboDisplay.y);
        this.ctx.scale(comboDisplay.scale, comboDisplay.scale);
        
        // 连击文字
        this.ctx.fillStyle = this.config.colors.accent;
        this.ctx.font = this.config.fonts.large;
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        
        const comboText = `${comboDisplay.combo} 连击!`;
        this.ctx.strokeText(comboText, 0, 0);
        this.ctx.fillText(comboText, 0, 0);
        
        this.ctx.restore();
    }
    
    // 渲染暂停按钮
    renderPauseButton() {
        const pauseButton = this.elements.pauseButton;
        if (!pauseButton.visible) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = pauseButton.alpha;
        
        // 按钮背景
        this.ctx.fillStyle = pauseButton.pressed ? this.config.colors.primary : this.config.colors.background;
        this.ctx.fillRect(pauseButton.x, pauseButton.y, pauseButton.width, pauseButton.height);
        
        // 按钮边框
        this.ctx.strokeStyle = this.config.colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pauseButton.x, pauseButton.y, pauseButton.width, pauseButton.height);
        
        // 暂停图标（两个竖线）
        this.ctx.fillStyle = this.config.colors.text;
        const iconX = pauseButton.x + pauseButton.width / 2;
        const iconY = pauseButton.y + pauseButton.height / 2;
        
        this.ctx.fillRect(iconX - 8, iconY - 10, 4, 20);
        this.ctx.fillRect(iconX + 4, iconY - 10, 4, 20);
        
        this.ctx.restore();
    }
    
    // 渲染通知
    renderNotifications() {
        this.notifications.forEach(notification => {
            this.ctx.save();
            this.ctx.globalAlpha = notification.alpha;
            
            // 通知背景
            this.ctx.fillStyle = notification.backgroundColor;
            this.ctx.fillRect(notification.x - 10, notification.y - 15, 
                notification.width + 20, notification.height + 10);
            
            // 通知文字
            this.ctx.fillStyle = notification.textColor;
            this.ctx.font = notification.font;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(notification.text, notification.x + notification.width / 2, notification.y);
            
            this.ctx.restore();
        });
    }
    
    // 渲染覆盖层
    renderOverlays() {
        // 游戏结束覆盖层
        if (this.elements.gameOverOverlay.visible) {
            this.renderGameOverOverlay();
        }
        
        // 暂停覆盖层
        if (this.elements.pauseOverlay.visible) {
            this.renderPauseOverlay();
        }
    }
    
    // 渲染游戏结束覆盖层
    renderGameOverOverlay() {
        const overlay = this.elements.gameOverOverlay;
        
        this.ctx.save();
        this.ctx.globalAlpha = overlay.alpha;
        
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 主面板
        const panelWidth = 300;
        const panelHeight = 250;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;
        
        this.ctx.translate(panelX + panelWidth / 2, panelY + panelHeight / 2);
        this.ctx.scale(overlay.scale, overlay.scale);
        this.ctx.translate(-panelWidth / 2, -panelHeight / 2);
        
        // 面板背景
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, panelWidth, panelHeight);
        
        // 面板边框
        this.ctx.strokeStyle = this.config.colors.primary;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, panelWidth, panelHeight);
        
        // 游戏结束文字
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = this.config.fonts.large;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', panelWidth / 2, 40);
        
        // 最终得分
        this.ctx.fillStyle = this.config.colors.accent;
        this.ctx.font = this.config.fonts.medium;
        this.ctx.fillText(`得分: ${overlay.finalScore}`, panelWidth / 2, 80);
        
        // 新纪录提示
        if (overlay.newRecord) {
            this.ctx.fillStyle = this.config.colors.success;
            this.ctx.font = this.config.fonts.medium;
            this.ctx.fillText('新纪录!', panelWidth / 2, 110);
        }
        
        // 按钮
        this.renderButton(overlay.buttons.restart, '重新开始', 50, 150);
        this.renderButton(overlay.buttons.menu, '返回菜单', 170, 150);
        
        this.ctx.restore();
    }
    
    // 渲染暂停覆盖层
    renderPauseOverlay() {
        const overlay = this.elements.pauseOverlay;
        
        this.ctx.save();
        this.ctx.globalAlpha = overlay.alpha;
        
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 暂停文字
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = this.config.fonts.large;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // 按钮
        const buttonY = this.canvas.height / 2;
        this.renderButton(overlay.buttons.resume, '继续游戏', this.canvas.width / 2 - 60, buttonY);
        this.renderButton(overlay.buttons.restart, '重新开始', this.canvas.width / 2 - 60, buttonY + 60);
        this.renderButton(overlay.buttons.menu, '返回菜单', this.canvas.width / 2 - 60, buttonY + 120);
        
        this.ctx.restore();
    }
    
    // 渲染按钮
    renderButton(button, text, x, y) {
        button.x = x;
        button.y = y;
        
        // 按钮背景
        this.ctx.fillStyle = button.pressed ? this.config.colors.primary : this.config.colors.background;
        this.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // 按钮边框
        this.ctx.strokeStyle = this.config.colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        // 按钮文字
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = this.config.fonts.medium;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, button.x + button.width / 2, button.y + button.height / 2 + 5);
    }
    
    // 显示通知
    showNotification(text, type = 'info', duration = 3000) {
        const colors = {
            info: { bg: this.config.colors.primary, text: this.config.colors.text },
            success: { bg: this.config.colors.success, text: '#000' },
            warning: { bg: this.config.colors.warning, text: '#000' },
            error: { bg: this.config.colors.danger, text: this.config.colors.text }
        };
        
        const color = colors[type] || colors.info;
        
        const notification = {
            text: text,
            x: this.canvas.width / 2 - 100,
            y: 200 + this.notifications.length * 40,
            width: 200,
            height: 30,
            life: duration,
            alpha: 1.0,
            speed: 0.5,
            backgroundColor: color.bg,
            textColor: color.text,
            font: this.config.fonts.medium
        };
        
        this.notifications.push(notification);
    }
    
    // 显示游戏结束界面
    showGameOver(finalScore, isNewRecord = false) {
        const overlay = this.elements.gameOverOverlay;
        overlay.visible = true;
        overlay.alpha = 0.0;
        overlay.scale = 0.8;
        overlay.finalScore = finalScore;
        overlay.newRecord = isNewRecord;
        
        this.state.gameOver = true;
    }
    
    // 显示暂停界面
    showPause() {
        const overlay = this.elements.pauseOverlay;
        overlay.visible = true;
        overlay.alpha = 0.0;
        
        this.state.paused = true;
    }
    
    // 隐藏暂停界面
    hidePause() {
        this.elements.pauseOverlay.visible = false;
        this.state.paused = false;
    }
    
    // 触摸开始处理
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchHandler.isPressed = true;
        this.touchHandler.startX = touch.clientX - rect.left;
        this.touchHandler.startY = touch.clientY - rect.top;
        this.touchHandler.currentX = this.touchHandler.startX;
        this.touchHandler.currentY = this.touchHandler.startY;
        
        this.handlePress(this.touchHandler.startX, this.touchHandler.startY);
    }
    
    // 触摸移动处理
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchHandler.isPressed) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchHandler.currentX = touch.clientX - rect.left;
        this.touchHandler.currentY = touch.clientY - rect.top;
    }
    
    // 触摸结束处理
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (this.touchHandler.isPressed) {
            this.handleRelease(this.touchHandler.currentX, this.touchHandler.currentY);
        }
        
        this.touchHandler.isPressed = false;
    }
    
    // 鼠标按下处理
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchHandler.isPressed = true;
        this.touchHandler.startX = e.clientX - rect.left;
        this.touchHandler.startY = e.clientY - rect.top;
        this.touchHandler.currentX = this.touchHandler.startX;
        this.touchHandler.currentY = this.touchHandler.startY;
        
        this.handlePress(this.touchHandler.startX, this.touchHandler.startY);
    }
    
    // 鼠标移动处理
    handleMouseMove(e) {
        if (!this.touchHandler.isPressed) return;
        
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchHandler.currentX = e.clientX - rect.left;
        this.touchHandler.currentY = e.clientY - rect.top;
    }
    
    // 鼠标释放处理
    handleMouseUp(e) {
        if (this.touchHandler.isPressed) {
            const rect = this.canvas.getBoundingClientRect();
            this.handleRelease(e.clientX - rect.left, e.clientY - rect.top);
        }
        
        this.touchHandler.isPressed = false;
    }
    
    // 按下处理
    handlePress(x, y) {
        // 检查暂停按钮
        if (this.isPointInButton(x, y, this.elements.pauseButton)) {
            this.elements.pauseButton.pressed = true;
        }
        
        // 检查覆盖层按钮
        if (this.elements.gameOverOverlay.visible) {
            this.checkOverlayButtons(x, y, this.elements.gameOverOverlay.buttons, true);
        }
        
        if (this.elements.pauseOverlay.visible) {
            this.checkOverlayButtons(x, y, this.elements.pauseOverlay.buttons, true);
        }
    }
    
    // 释放处理
    handleRelease(x, y) {
        // 暂停按钮
        if (this.elements.pauseButton.pressed && this.isPointInButton(x, y, this.elements.pauseButton)) {
            this.onPauseButtonClick();
        }
        this.elements.pauseButton.pressed = false;
        
        // 覆盖层按钮
        if (this.elements.gameOverOverlay.visible) {
            this.checkOverlayButtons(x, y, this.elements.gameOverOverlay.buttons, false);
        }
        
        if (this.elements.pauseOverlay.visible) {
            this.checkOverlayButtons(x, y, this.elements.pauseOverlay.buttons, false);
        }
    }
    
    // 检查覆盖层按钮
    checkOverlayButtons(x, y, buttons, isPress) {
        Object.keys(buttons).forEach(key => {
            const button = buttons[key];
            
            if (isPress) {
                if (this.isPointInButton(x, y, button)) {
                    button.pressed = true;
                }
            } else {
                if (button.pressed && this.isPointInButton(x, y, button)) {
                    this.onOverlayButtonClick(key);
                }
                button.pressed = false;
            }
        });
    }
    
    // 检查点是否在按钮内
    isPointInButton(x, y, button) {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }
    
    // 暂停按钮点击
    onPauseButtonClick() {
        if (this.state.paused) {
            this.hidePause();
            // 触发游戏继续事件
            if (this.onGameResume) {
                this.onGameResume();
            }
        } else {
            this.showPause();
            // 触发游戏暂停事件
            if (this.onGamePause) {
                this.onGamePause();
            }
        }
    }
    
    // 覆盖层按钮点击
    onOverlayButtonClick(buttonType) {
        switch (buttonType) {
            case 'restart':
                if (this.onGameRestart) {
                    this.onGameRestart();
                }
                break;
            case 'menu':
                if (this.onReturnToMenu) {
                    this.onReturnToMenu();
                }
                break;
            case 'resume':
                this.hidePause();
                if (this.onGameResume) {
                    this.onGameResume();
                }
                break;
        }
    }
    
    // 重置UI
    reset() {
        this.elements.gameOverOverlay.visible = false;
        this.elements.pauseOverlay.visible = false;
        this.elements.comboDisplay.visible = false;
        this.notifications = [];
        
        this.state.paused = false;
        this.state.gameOver = false;
        
        console.log('UI管理器已重置');
    }
    
    // 设置可见性
    setVisible(visible) {
        this.state.visible = visible;
    }
    
    // 获取UI状态
    getState() {
        return { ...this.state };
    }
}

// 导出UI管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}

console.log('UI管理器加载完成');