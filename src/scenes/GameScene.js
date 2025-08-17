// 游戏主场景
// 负责游戏的核心玩法逻辑，包括小猫控制、鱼群生成、碰撞检测等

class GameScene {
    constructor(canvas, ctx) {
        this.canvas = canvas || (GameGlobal && GameGlobal.canvas) || document.getElementById('gameCanvas');
        this.ctx = ctx || (this.canvas ? this.canvas.getContext('2d') : null);
        this.canvasWidth = this.canvas ? this.canvas.width : 800;
        this.canvasHeight = this.canvas ? this.canvas.height : 600;
        this.isVisible = false;
        
        // 游戏对象
        this.cat = null;           // 小猫对象
        this.fishes = [];          // 鱼群数组
        this.obstacles = [];       // 障碍物数组
        this.powerUps = [];        // 道具数组
        this.particles = [];       // 粒子效果数组
        
        // 游戏状态
        this.gameTimer = 0;
        this.fishSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // UI元素
        this.ui = {
            scoreText: { x: 20, y: 40, fontSize: 24, color: '#FFF' },
            timeText: { x: this.canvas.width - 20, y: 40, fontSize: 24, color: '#FFF' },
            pauseButton: { x: this.canvas.width / 2 - 40, y: 20, width: 80, height: 40 }
        };
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化游戏对象
        this.initGameObjects();
    }
    
    // 初始化游戏对象
    initGameObjects() {
        console.log('initGameObjects called');
        console.log('window.Cat:', window.Cat);
        console.log('typeof window.Cat:', typeof window.Cat);
        
        // 创建小猫对象
        try {
            this.cat = new window.Cat(this.canvas.width / 2 - 40, 100);
            console.log('Cat created successfully:', this.cat);
            console.log('Cat setAnimationManager method:', typeof this.cat.setAnimationManager);
            
            this.cat.init();
            console.log('Cat initialized successfully');
            
            // 设置钓鱼完成回调
            this.cat.onFishingComplete = (fish) => {
                this.handleFishingComplete(fish);
            };
        } catch (error) {
            console.error('Error creating Cat:', error);
            this.cat = null;
        }
        
        // 设置动画管理器引用（将在游戏初始化时设置）
        this.animationManager = null;
        this.particleSystem = null;
    }
    
    // 绑定触摸事件
    bindEvents() {
        this.clickHandler = (event) => {
            if (!this.isVisible || GameGlobal.GameState.isPaused || GameGlobal.GameState.isGameOver) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // 检查暂停按钮
            if (this.ui && this.ui.pauseButton && this.isPointInButton(x, y, this.ui.pauseButton)) {
                this.togglePause();
                return;
            }
            
            // 鱼竿控制逻辑
            this.handleFishingRodControl();
        };
        
        // 使用标准的浏览器事件监听器
        this.canvas.addEventListener('click', this.clickHandler);
    }
    
    // 处理鱼竿控制
    handleFishingRodControl() {
        if (this.cat && this.cat.canFish()) {
            // 开始投掷鱼竿
            this.cat.startFishing();
        } else if (this.cat && this.cat.isFishingActive()) {
            // 开始收杆
            this.cat.startReeling();
        }
    }
    
    // 开始钓鱼
    startFishing() {
        if (this.cat) {
            this.cat.startFishing();
        }
    }
    
    // 开始收杆
    startReeling() {
        if (this.cat) {
            this.cat.startReeling();
        }
    }
    
    // 检查点击是否在按钮内
    isPointInButton(x, y, button) {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }
    
    // 切换暂停状态
    togglePause() {
        GameGlobal.GameState.isPaused = !GameGlobal.GameState.isPaused;
    }
    
    // 显示场景
    show() {
        this.isVisible = true;
        this.resetGame();
        this.startRenderLoop();
    }
    
    // 开始游戏（由CatFishingGame调用）
    startGame(gameMode = 'normal') {
        console.log('GameScene.startGame called with mode:', gameMode);
        this.gameMode = gameMode;
        GameGlobal.GameState.gameMode = gameMode;
        this.show();
    }
    
    // 设置系统引用
    setSystems(animationManager, particleSystem) {
        this.animationManager = animationManager;
        this.particleSystem = particleSystem;
        
        // 设置小猫的动画管理器
        console.log('setSystems called:', {
            cat: this.cat,
            animationManager: animationManager,
            catType: typeof this.cat,
            hasSetAnimationManager: this.cat && typeof this.cat.setAnimationManager === 'function'
        });
        
        if (this.cat && animationManager) {
            if (typeof this.cat.setAnimationManager === 'function') {
                this.cat.setAnimationManager(animationManager);
                console.log('setAnimationManager called successfully');
            } else {
                console.error('setAnimationManager is not a function on cat object:', this.cat);
            }
        } else {
            console.warn('Cannot set animation manager - cat or animationManager is null:', {
                cat: this.cat,
                animationManager: animationManager
            });
        }
    }
    
    // 隐藏场景
    hide() {
        this.isVisible = false;
        this.stopRenderLoop();
    }
    
    // 重置游戏
    resetGame() {
        GameGlobal.GameState.reset();
        this.gameTimer = 0;
        this.fishSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // 清空游戏对象数组
        this.fishes = [];
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        
        // 重置小猫的鱼竿状态
        if (this.cat && this.cat.fishingRod) {
            this.cat.resetFishingRod();
        }
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
        const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;
        
        if (!GameGlobal.GameState.isPaused && !GameGlobal.GameState.isGameOver) {
            this.update(deltaTime);
        }
        
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.renderLoop());
    }
    
    // 更新游戏逻辑
    update(deltaTime) {
        // 更新游戏计时器
        this.updateGameTimer(deltaTime);
        
        // 更新小猫
        if (this.cat) {
            this.cat.update(deltaTime);
        }
        
        // 鱼竿更新现在由 Cat 实例处理
        
        // 生成游戏对象
        this.spawnGameObjects(deltaTime);
        
        // 更新游戏对象
        this.updateFishes(deltaTime);
        this.updateObstacles(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateParticles(deltaTime);
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理超出屏幕的对象
        this.cleanupObjects();
    }
    
    // 更新游戏计时器
    updateGameTimer(deltaTime) {
        if (GameGlobal.GameState.gameMode === 'normal') {
            GameGlobal.GameState.timeLeft -= deltaTime;
            
            if (GameGlobal.GameState.timeLeft <= 0) {
                GameGlobal.GameState.timeLeft = 0;
                this.endGame();
            }
        } else {
            // 无尽模式，增加游戏时间
            this.gameTimer += deltaTime;
        }
    }
    
    // 处理钓鱼完成的游戏逻辑
    handleFishingComplete(fish) {
        if (fish) {
            // 计算得分
            let score = GameGlobal.GameConfig.FISH_SCORES[fish.type] || 10;
            
            // 应用倍数道具效果
            if (GameGlobal.GameState.powerUps.multiplier) {
                score *= GameGlobal.GameConfig.POWER_UPS.multiplier;
            }
            
            GameGlobal.GameState.addScore(score);
            this.createScoreParticle(fish.x, fish.y, score);
            
            // 从鱼群中移除
            const fishIndex = this.fishes.indexOf(fish);
            if (fishIndex > -1) {
                this.fishes.splice(fishIndex, 1);
            }
        }
    }
    
    // 生成游戏对象
    spawnGameObjects(deltaTime) {
        // 生成鱼类
        this.fishSpawnTimer += deltaTime;
        if (this.fishSpawnTimer >= GameGlobal.GameConfig.FISH_SPAWN_INTERVAL) {
            this.spawnFish();
            this.fishSpawnTimer = 0;
        }
        
        // 生成障碍物
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= 4) { // 每4秒生成一个障碍物
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // 生成道具
        this.powerUpSpawnTimer += deltaTime;
        if (this.powerUpSpawnTimer >= 10) { // 每10秒生成一个道具
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }
    }
    
    // 生成鱼类
    spawnFish() {
        const fishTypes = ['small', 'medium', 'large', 'rare'];
        const weights = [50, 30, 15, 5]; // 生成权重
        
        // 根据权重随机选择鱼类型
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        let fishType = fishTypes[0];
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                fishType = fishTypes[i];
                break;
            }
        }
        
        // 创建鱼对象
        const fish = {
            type: fishType,
            x: Math.random() * (this.canvas.width - 60),
            y: 300 + Math.random() * (this.canvas.height - 400),
            width: this.getFishSize(fishType).width,
            height: this.getFishSize(fishType).height,
            speed: 50 + Math.random() * 100,
            direction: Math.random() > 0.5 ? 1 : -1,
            score: GameGlobal.GameConfig.FISH_SCORES[fishType],
            image: GameGlobal.ResourceManager.getImage(`fish_${fishType}`),
            animationTime: 0
        };
        
        this.fishes.push(fish);
    }
    
    // 获取鱼类尺寸
    getFishSize(type) {
        const sizes = {
            small: { width: 40, height: 30 },
            medium: { width: 60, height: 45 },
            large: { width: 80, height: 60 },
            rare: { width: 70, height: 50 }
        };
        return sizes[type] || sizes.small;
    }
    
    // 生成障碍物
    spawnObstacle() {
        const obstacleTypes = ['weed', 'trash'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        const obstacle = {
            type: type,
            x: Math.random() * (this.canvas.width - 40),
            y: 400 + Math.random() * (this.canvas.height - 500),
            width: 40,
            height: 60,
            image: GameGlobal.ResourceManager.getImage(`obstacle_${type}`)
        };
        
        this.obstacles.push(obstacle);
    }
    
    // 生成道具
    spawnPowerUp() {
        const powerUpTypes = ['bait', 'speed', 'bonus'];
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const powerUp = {
            type: type,
            x: Math.random() * (this.canvas.width - 30),
            y: 300 + Math.random() * (this.canvas.height - 400),
            width: 30,
            height: 30,
            duration: 10, // 道具持续时间（秒）
            animationTime: 0
        };
        
        this.powerUps.push(powerUp);
    }
    
    // 更新鱼类
    updateFishes(deltaTime) {
        this.fishes.forEach(fish => {
            // 移动鱼
            fish.x += fish.speed * fish.direction * deltaTime;
            fish.animationTime += deltaTime;
            
            // 边界检测，鱼游出屏幕后改变方向
            if (fish.x <= 0 || fish.x >= this.canvas.width - fish.width) {
                fish.direction *= -1;
            }
        });
    }
    
    // 更新障碍物
    updateObstacles(deltaTime) {
        // 障碍物通常是静态的，这里可以添加一些动画效果
        this.obstacles.forEach(obstacle => {
            // 可以添加轻微的摆动效果
            obstacle.animationTime = (obstacle.animationTime || 0) + deltaTime;
        });
    }
    
    // 更新道具
    updatePowerUps(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.animationTime += deltaTime;
            
            // 道具旋转动画
            powerUp.rotation = (powerUp.rotation || 0) + deltaTime * 2;
        });
    }
    
    // 更新粒子效果
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 碰撞检测
    checkCollisions() {
        if (!this.cat || !this.cat.isFishingActive()) return;
        
        const hookRect = this.cat.getHookCollisionRect();
        
        // 检测与鱼的碰撞
        if (!this.cat.fishingRod.caughtFish) {
            this.fishes.forEach(fish => {
                if (GameGlobal.Utils.checkCollision(hookRect, fish)) {
                    this.cat.setCaughtFish(fish);
                    
                    // 如果正在下降，立即开始收杆
                    if (this.cat.fishingRod.isDropping) {
                        this.cat.startReeling();
                    }
                }
            });
        }
        
        // 检测与障碍物的碰撞
        this.obstacles.forEach(obstacle => {
            if (GameGlobal.Utils.checkCollision(hookRect, obstacle)) {
                // 碰到障碍物，扣分并强制收杆
                GameGlobal.GameState.addScore(GameGlobal.GameConfig.OBSTACLE_PENALTY);
                this.createScoreParticle(obstacle.x, obstacle.y, GameGlobal.GameConfig.OBSTACLE_PENALTY);
                
                if (this.cat.fishingRod.isDropping) {
                    this.cat.startReeling();
                }
            }
        });
        
        // 检测与道具的碰撞
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (GameGlobal.Utils.checkCollision(hookRect, powerUp)) {
                this.activatePowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    // 激活道具
    activatePowerUp(powerUp) {
        GameGlobal.GameState.powerUps[powerUp.type] = true;
        
        // 设置道具失效定时器
        setTimeout(() => {
            GameGlobal.GameState.powerUps[powerUp.type] = false;
        }, powerUp.duration * 1000);
        
        // 创建道具获得粒子效果
        this.createPowerUpParticle(powerUp.x, powerUp.y, powerUp.type);
    }
    
    // 创建分数粒子效果
    createScoreParticle(x, y, score) {
        const particle = {
            x: x,
            y: y,
            vx: 0,
            vy: -100,
            text: score > 0 ? `+${score}` : `${score}`,
            color: score > 0 ? '#4ECDC4' : '#FF6B6B',
            fontSize: 20,
            life: 1.5,
            maxLife: 1.5,
            alpha: 1,
            type: 'score'
        };
        
        this.particles.push(particle);
    }
    
    // 创建道具获得粒子效果
    createPowerUpParticle(x, y, type) {
        for (let i = 0; i < 10; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#FFD93D',
                size: 3 + Math.random() * 5,
                life: 1,
                maxLife: 1,
                alpha: 1,
                type: 'sparkle'
            };
            
            this.particles.push(particle);
        }
    }
    
    // 清理超出屏幕的对象
    cleanupObjects() {
        // 清理超出屏幕的鱼
        this.fishes = this.fishes.filter(fish => {
            return fish.x > -fish.width && fish.x < this.canvas.width + fish.width;
        });
    }
    
    // 结束游戏
    endGame() {
        GameGlobal.GameState.isGameOver = true;
        
        // 延迟切换到结算场景
        setTimeout(() => {
            GameGlobal.SceneManager.switchTo('GameOver');
        }, 1000);
    }
    
    // 渲染场景
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制游戏对象
        this.drawFishes();
        this.drawObstacles();
        this.drawPowerUps();
        this.drawCat();
        this.drawParticles();
        
        // 绘制UI
        this.drawUI();
        
        // 绘制暂停/游戏结束覆盖层
        if (GameGlobal.GameState.isPaused) {
            this.drawPauseOverlay();
        }
        
        if (GameGlobal.GameState.isGameOver) {
            this.drawGameOverOverlay();
        }
    }
    
    // 绘制背景
    drawBackground() {
        // 绘制水面渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');   // 天空蓝
        gradient.addColorStop(0.2, '#4ECDC4'); // 浅水蓝
        gradient.addColorStop(1, '#2C5F7C');   // 深水蓝
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制水面线
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 200);
        this.ctx.lineTo(this.canvas.width, 200);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // 绘制小猫
    drawCat() {
        if (this.cat) {
            this.cat.render(this.ctx);
        }
    }
    
    // 鱼竿绘制现在由 Cat 实例处理
    
    // 绘制鱼群
    drawFishes() {
        this.fishes.forEach(fish => {
            if (!this.cat || fish !== this.cat.fishingRod.caughtFish) {
                this.drawFish(fish);
            }
        });
    }
    
    // 绘制单条鱼
    drawFish(fish) {
        this.ctx.save();
        
        // 如果鱼向左游，翻转图像
        if (fish.direction < 0) {
            this.ctx.scale(-1, 1);
            this.ctx.translate(-fish.x - fish.width, 0);
        } else {
            this.ctx.translate(fish.x, 0);
        }
        
        // 添加游泳动画效果
        const swimOffset = Math.sin(fish.animationTime * 3) * 2;
        
        if (fish.image) {
            this.ctx.drawImage(fish.image, 0, fish.y + swimOffset, fish.width, fish.height);
        } else {
            // 备用绘制方案
            const colors = {
                small: '#4ECDC4',
                medium: '#45B7B8',
                large: '#26A69A',
                rare: '#FFD93D'
            };
            
            this.ctx.fillStyle = colors[fish.type] || colors.small;
            this.ctx.fillRect(0, fish.y + swimOffset, fish.width, fish.height);
            
            // 绘制鱼的眼睛
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(fish.width * 0.7, fish.y + fish.height * 0.3 + swimOffset, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(fish.width * 0.7, fish.y + fish.height * 0.3 + swimOffset, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    // 绘制障碍物
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.image) {
                this.ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                // 备用绘制方案
                const colors = {
                    weed: '#2E7D32',
                    trash: '#795548'
                };
                
                this.ctx.fillStyle = colors[obstacle.type] || colors.weed;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
    }
    
    // 绘制道具
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            
            // 旋转动画
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.rotation || 0);
            
            // 闪烁效果
            const alpha = 0.7 + Math.sin(powerUp.animationTime * 5) * 0.3;
            this.ctx.globalAlpha = alpha;
            
            // 绘制道具
            const colors = {
                bait: '#FF6B6B',
                speed: '#4ECDC4',
                bonus: '#FFD93D'
            };
            
            this.ctx.fillStyle = colors[powerUp.type] || colors.bait;
            this.ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
            
            // 绘制道具图标
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const icons = {
                bait: '🪱',
                speed: '⚡',
                bonus: '💎'
            };
            
            this.ctx.fillText(icons[powerUp.type] || '?', 0, 0);
            
            this.ctx.restore();
        });
    }
    
    // 绘制粒子效果
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            
            if (particle.type === 'score') {
                this.ctx.fillStyle = particle.color;
                this.ctx.font = `bold ${particle.fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(particle.text, particle.x, particle.y);
            } else if (particle.type === 'sparkle') {
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    // 绘制UI
    drawUI() {
        // 绘制分数
        this.ctx.fillStyle = this.ui.scoreText.color;
        this.ctx.font = `bold ${this.ui.scoreText.fontSize}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`分数: ${GameGlobal.GameState.score}`, this.ui.scoreText.x, this.ui.scoreText.y);
        
        // 绘制时间（仅普通模式）
        if (GameGlobal.GameState.gameMode === 'normal') {
            this.ctx.fillStyle = this.ui.timeText.color;
            this.ctx.font = `bold ${this.ui.timeText.fontSize}px Arial`;
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`时间: ${Math.ceil(GameGlobal.GameState.timeLeft)}`, this.ui.timeText.x, this.ui.timeText.y);
        }
        
        // 绘制暂停按钮
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(this.ui.pauseButton.x, this.ui.pauseButton.y, this.ui.pauseButton.width, this.ui.pauseButton.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⏸️', this.ui.pauseButton.x + this.ui.pauseButton.width / 2, this.ui.pauseButton.y + this.ui.pauseButton.height / 2);
        
        // 绘制道具状态
        this.drawPowerUpStatus();
    }
    
    // 绘制道具状态
    drawPowerUpStatus() {
        let yOffset = 80;
        
        Object.keys(GameGlobal.GameState.powerUps).forEach(powerUpType => {
            if (GameGlobal.GameState.powerUps[powerUpType]) {
                const names = {
                    bait: '鱼饵',
                    speed: '加速',
                    bonus: '奖励'
                };
                
                this.ctx.fillStyle = 'rgba(255, 215, 61, 0.8)';
                this.ctx.fillRect(10, yOffset, 80, 25);
                
                this.ctx.fillStyle = '#000';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(names[powerUpType], 50, yOffset + 12.5);
                
                yOffset += 30;
            }
        });
    }
    
    // 绘制暂停覆盖层
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('点击暂停按钮继续', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    // 绘制游戏结束覆盖层
    drawGameOverOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`最终分数: ${GameGlobal.GameState.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
}

// 创建并注册游戏场景
// GameScene 实例将在 index.html 的 CatFishingGame 中创建

console.log('游戏场景加载完成');