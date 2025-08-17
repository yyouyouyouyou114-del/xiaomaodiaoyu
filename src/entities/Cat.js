// 小猫角色类
// 负责小猫的动画、状态管理和鱼竿控制逻辑

class Cat {
    constructor(x, y) {
        // 基本属性
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        
        // 动画相关
        this.animationTime = 0;
        this.currentAnimation = 'idle'; // idle, fishing, reeling, celebrating
        this.animationSpeed = 1;
        this.frameIndex = 0;
        this.frameTime = 0;
        this.frameDuration = 0.2; // 每帧持续时间
        this.animationManager = null; // 动画管理器引用
        this.bodyTilt = 0; // 身体倾斜角度
        this.armAngle = 0; // 手臂角度
        
        // 状态
        this.isFishing = false;
        this.isReeling = false;
        this.mood = 'happy'; // happy, excited, disappointed
        
        // 鱼竿相关
        this.fishingRod = {
            x: this.x + this.width / 2,
            y: this.y + this.height,
            hookX: this.x + this.width / 2,
            hookY: this.y + this.height,
            isDropping: false,
            isReeling: false,
            speed: GameGlobal.GameConfig.FISHING_SPEED,
            maxDepth: 0, // 将在初始化时设置
            caughtFish: null,
            lineSegments: [],
            rodAngle: 0, // 鱼竿角度
            targetAngle: 0 // 目标角度
        };
        
        // 表情和动作
        this.expressions = {
            idle: ['😸', '😺', '😊'],
            fishing: ['😤', '🎣', '😠'],
            reeling: ['😾', '💪', '😤'],
            celebrating: ['😻', '🎉', '😸'],
            disappointed: ['😿', '😾', '😞']
        };
        
        // 粒子效果
        this.particles = [];
        
        // 音效引用
        this.sounds = {
            cast: null,
            reel: null,
            catch: null,
            miss: null
        };
        
        this.init();
    }
    
    // 初始化
    init() {
        // 设置鱼竿最大深度（增加深度以钓到深水区的鱼）
        this.fishingRod.maxDepth = GameGlobal.canvas.height - 20;
        
        // 加载音效
        this.loadSounds();
        
        // 初始化鱼竿位置
        this.updateFishingRodPosition();
    }
    
    // 加载音效
    loadSounds() {
        // 暂时禁用音频加载
        this.sounds.cast = { play: () => {}, pause: () => {}, stop: () => {} };
        this.sounds.reel = { play: () => {}, pause: () => {}, stop: () => {} };
        this.sounds.catch = { play: () => {}, pause: () => {}, stop: () => {} };
        this.sounds.miss = { play: () => {}, pause: () => {}, stop: () => {} };
        // this.sounds.cast = GameGlobal.ResourceManager.getSound('cast');
        // this.sounds.reel = GameGlobal.ResourceManager.getSound('reel');
        // this.sounds.catch = GameGlobal.ResourceManager.getSound('catch');
        // this.sounds.miss = GameGlobal.ResourceManager.getSound('miss');
    }
    
    // 更新小猫状态
    update(deltaTime) {
        // 更新动画时间
        this.animationTime += deltaTime;
        this.frameTime += deltaTime;
        
        // 更新动画帧
        this.updateAnimation(deltaTime);
        
        // 更新鱼竿
        this.updateFishingRod(deltaTime);
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
        
        // 更新鱼竿位置
        this.updateFishingRodPosition();
    }
    
    // 更新动画
    updateAnimation(deltaTime) {
        // 切换动画帧
        if (this.frameTime >= this.frameDuration) {
            this.frameIndex = (this.frameIndex + 1) % this.getAnimationFrameCount();
            this.frameTime = 0;
        }
        
        // 根据状态自动切换动画
        this.updateAnimationState();
    }
    
    // 更新动画状态
    updateAnimationState() {
        if (this.fishingRod.isDropping) {
            this.currentAnimation = 'fishing';
        } else if (this.fishingRod.isReeling) {
            this.currentAnimation = 'reeling';
        } else {
            this.currentAnimation = 'idle';
        }
    }
    
    // 获取当前动画的帧数
    getAnimationFrameCount() {
        const frameCounts = {
            idle: 3,
            fishing: 2,
            reeling: 2,
            celebrating: 4,
            disappointed: 2
        };
        
        return frameCounts[this.currentAnimation] || 1;
    }
    
    // 更新鱼竿
    updateFishingRod(deltaTime) {
        // 更新鱼竿角度动画
        const angleDiff = this.fishingRod.targetAngle - this.fishingRod.rodAngle;
        this.fishingRod.rodAngle += angleDiff * deltaTime * 5; // 角度插值
        
        if (this.fishingRod.isDropping) {
            // 记录鱼钩之前的位置
            const prevHookY = this.fishingRod.hookY;
            
            // 鱼钩下降
            this.fishingRod.hookY += this.fishingRod.speed * deltaTime;
            
            // 检查鱼钩是否刚刚接触水面（产生波纹效果）
            const waterSurface = GameGlobal.canvas.height * 0.4;
            if (prevHookY < waterSurface && this.fishingRod.hookY >= waterSurface) {
                // 鱼钩刚刚接触水面，创建波纹效果
                if (window.addRipple) {
                    window.addRipple(this.fishingRod.hookX, waterSurface);
                }
                
                // 播放水花音效
                if (this.sounds.splash) {
                    this.sounds.splash.play();
                }
            }
            
            // 检查是否到达最大深度
            if (this.fishingRod.hookY >= this.fishingRod.maxDepth) {
                this.fishingRod.hookY = this.fishingRod.maxDepth;
                this.startReeling();
            }
        } else if (this.fishingRod.isReeling) {
            // 鱼钩上升
            this.fishingRod.hookY -= this.fishingRod.speed * deltaTime;
            
            // 如果有抓到的鱼，一起移动
            if (this.fishingRod.caughtFish) {
                this.fishingRod.caughtFish.x = this.fishingRod.hookX - this.fishingRod.caughtFish.width / 2;
                this.fishingRod.caughtFish.y = this.fishingRod.hookY;
            }
            
            // 检查是否回到起始位置
            if (this.fishingRod.hookY <= this.y + this.height) {
                this.completeFishing();
            }
        }
        
        // 更新鱼线分段
        this.updateFishingLine();
    }
    
    // 更新鱼竿位置
    updateFishingRodPosition() {
        this.fishingRod.x = this.x + this.width / 2;
        this.fishingRod.y = this.y + this.height;
        
        // 如果鱼竿没有在使用中，重置鱼钩位置
        if (!this.fishingRod.isDropping && !this.fishingRod.isReeling) {
            this.fishingRod.hookX = this.fishingRod.x;
            this.fishingRod.hookY = this.fishingRod.y;
        }
    }
    
    // 更新鱼线
    updateFishingLine() {
        this.fishingRod.lineSegments = [];
        
        const startX = this.fishingRod.x;
        const startY = this.fishingRod.y;
        const endX = this.fishingRod.hookX;
        const endY = this.fishingRod.hookY;
        
        // 创建弯曲的鱼线效果
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            
            // 添加轻微的弯曲效果和风的影响
            const curve = Math.sin(t * Math.PI) * 10;
            const wind = Math.sin(this.animationTime * 2 + t * 5) * 3;
            
            this.fishingRod.lineSegments.push({ 
                x: x + curve + wind, 
                y: y 
            });
        }
    }
    
    // 更新粒子效果
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            // 应用重力
            if (particle.gravity) {
                particle.vy += particle.gravity * deltaTime;
            }
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 开始钓鱼
    startFishing() {
        if (!this.fishingRod) {
            console.error('鱼竿对象未初始化');
            return false;
        }
        
        if (this.fishingRod.isDropping || this.fishingRod.isReeling) {
            return false; // 已经在钓鱼中
        }
        
        this.fishingRod.isDropping = true;
        this.fishingRod.isReeling = false;
        this.fishingRod.caughtFish = null;
        this.isFishing = true;
        
        // 设置鱼竿角度
        this.fishingRod.targetAngle = Math.PI / 6; // 30度
        
        // 播放投掷音效
        if (this.sounds.cast) {
            this.sounds.cast.play();
        }
        
        // 创建投掷粒子效果
        this.createCastParticles();
        
        // 播放投掷动画
        this.playCastAnimation();
        
        // 改变表情
        this.mood = 'fishing';
        
        return true;
    }
    
    // 开始收杆
    startReeling() {
        if (!this.fishingRod) {
            console.error('鱼竿对象未初始化');
            return false;
        }
        
        if (!this.fishingRod.isDropping) {
            return false;
        }
        
        this.fishingRod.isDropping = false;
        this.fishingRod.isReeling = true;
        
        // 应用加速道具效果
        if (GameGlobal.GameState.powerUps.speed) {
            this.fishingRod.speed *= GameGlobal.GameConfig.POWER_UPS.speed;
        }
        
        // 设置鱼竿角度
        this.fishingRod.targetAngle = -Math.PI / 4; // -45度
        
        // 播放收杆音效
        if (this.sounds.reel) {
            this.sounds.reel.play();
        }
        
        // 播放收杆动画
        this.playReelAnimation();
        
        // 改变表情
        this.mood = 'reeling';
        
        return true;
    }
    
    // 完成钓鱼
    completeFishing() {
        const hadCatch = this.fishingRod.caughtFish !== null;
        const caughtFish = this.fishingRod.caughtFish;
        
        if (hadCatch) {
            // 成功抓到鱼
            this.handleSuccessfulCatch();
            
            // 通知游戏场景处理得分和移除鱼
            if (this.onFishingComplete) {
                this.onFishingComplete(caughtFish);
            }
        } else {
            // 没有抓到鱼
            this.handleMissedCatch();
        }
        
        // 重置鱼竿状态
        this.resetFishingRod();
    }
    
    // 处理成功抓鱼
    handleSuccessfulCatch() {
        const fish = this.fishingRod.caughtFish;
        
        // 播放抓鱼音效
        if (this.sounds.catch) {
            this.sounds.catch.play();
        }
        
        // 创建庆祝粒子效果
        this.createCelebrationParticles();
        
        // 改变表情为庆祝
        this.mood = 'celebrating';
        this.currentAnimation = 'celebrating';
        
        // 延迟恢复正常状态
        setTimeout(() => {
            this.mood = 'happy';
            this.currentAnimation = 'idle';
        }, 2000);
        
        console.log(`小猫抓到了一条${fish.type}鱼！`);
    }
    
    // 处理未抓到鱼
    handleMissedCatch() {
        // 播放失败音效
        if (this.sounds.miss) {
            this.sounds.miss.play();
        }
        
        // 改变表情为失望
        this.mood = 'disappointed';
        this.currentAnimation = 'disappointed';
        
        // 延迟恢复正常状态
        setTimeout(() => {
            this.mood = 'happy';
            this.currentAnimation = 'idle';
        }, 1500);
        
        console.log('小猫没有抓到鱼...');
    }
    
    // 重置鱼竿状态
    resetFishingRod() {
        if (!this.fishingRod) {
            console.error('鱼竿对象未初始化');
            return;
        }
        
        this.fishingRod.isDropping = false;
        this.fishingRod.isReeling = false;
        this.fishingRod.caughtFish = null;
        this.fishingRod.speed = GameGlobal.GameConfig.FISHING_SPEED;
        this.fishingRod.targetAngle = 0;
        this.isFishing = false;
        this.isReeling = false;
    }
    
    // 设置抓到的鱼
    setCaughtFish(fish) {
        this.fishingRod.caughtFish = fish;
    }
    
    // 创建投掷粒子效果
    createCastParticles() {
        for (let i = 0; i < 5; i++) {
            const particle = {
                x: this.fishingRod.hookX,
                y: this.fishingRod.hookY,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                color: '#87CEEB',
                size: 2 + Math.random() * 3,
                life: 0.5,
                maxLife: 0.5,
                alpha: 1,
                gravity: 200
            };
            
            this.particles.push(particle);
        }
    }
    
    // 创建庆祝粒子效果
    createCelebrationParticles() {
        for (let i = 0; i < 15; i++) {
            const particle = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 200,
                vy: -Math.random() * 150 - 50,
                color: this.getRandomCelebrationColor(),
                size: 3 + Math.random() * 5,
                life: 1 + Math.random(),
                maxLife: 1 + Math.random(),
                alpha: 1,
                gravity: 150
            };
            
            this.particles.push(particle);
        }
    }
    
    // 获取随机庆祝颜色
    getRandomCelebrationColor() {
        const colors = ['#FFD93D', '#4ECDC4', '#FF6B6B', '#45B7B8', '#6C5CE7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 获取当前表情
    getCurrentExpression() {
        const expressions = this.expressions[this.mood] || this.expressions.idle;
        const index = Math.floor(this.animationTime * 0.5) % expressions.length;
        return expressions[index];
    }
    
    // 渲染小猫
    render(ctx) {
        // 绘制小猫身体
        this.drawCatBody(ctx);
        
        // 绘制鱼竿
        this.drawFishingRod(ctx);
        
        // 绘制粒子效果
        this.drawParticles(ctx);
        
        // 绘制状态指示器（调试用）
        if (GameGlobal.GameConfig.DEBUG_MODE) {
            this.drawDebugInfo(ctx);
        }
    }
    
    // 绘制小猫身体
    drawCatBody(ctx) {
        const catImage = GameGlobal.ResourceManager.getImage('cat');
        
        ctx.save();
        
        // 添加轻微的呼吸动画
        const breathScale = 1 + Math.sin(this.animationTime * 2) * 0.02;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(breathScale, breathScale);
        
        // 应用身体倾斜动画
        ctx.rotate(this.bodyTilt * Math.PI / 180);
        
        if (false && catImage) {
            ctx.drawImage(catImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // 使用完整的猫咪绘制
            this.drawFallbackCat(ctx);
        }
        
        ctx.restore();
        
        // 表情已集成到完整猫咪绘制中
    }
    
    // 备用小猫绘制 - 完整的猫咪
    drawFallbackCat(ctx) {
        // 猫咪主色调
        const catColor = '#FF8C69'; // 橙色猫咪
        const darkColor = '#E55555'; // 深色部分
        const lightColor = '#FFB6C1'; // 浅色部分
        
        // 绘制猫咪身体（椭圆形）
        ctx.fillStyle = catColor;
        ctx.beginPath();
        ctx.ellipse(0, this.height * 0.1, this.width * 0.35, this.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制猫咪头部（圆形）
        ctx.fillStyle = catColor;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.15, this.width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制猫咪耳朵
        ctx.fillStyle = darkColor;
        // 左耳
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.2, -this.height * 0.35);
        ctx.lineTo(-this.width * 0.1, -this.height * 0.5);
        ctx.lineTo(-this.width * 0.05, -this.height * 0.35);
        ctx.closePath();
        ctx.fill();
        
        // 右耳
        ctx.beginPath();
        ctx.moveTo(this.width * 0.05, -this.height * 0.35);
        ctx.lineTo(this.width * 0.1, -this.height * 0.5);
        ctx.lineTo(this.width * 0.2, -this.height * 0.35);
        ctx.closePath();
        ctx.fill();
        
        // 绘制耳朵内部（粉色）
        ctx.fillStyle = lightColor;
        // 左耳内部
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.15, -this.height * 0.37);
        ctx.lineTo(-this.width * 0.1, -this.height * 0.45);
        ctx.lineTo(-this.width * 0.08, -this.height * 0.37);
        ctx.closePath();
        ctx.fill();
        
        // 右耳内部
        ctx.beginPath();
        ctx.moveTo(this.width * 0.08, -this.height * 0.37);
        ctx.lineTo(this.width * 0.1, -this.height * 0.45);
        ctx.lineTo(this.width * 0.15, -this.height * 0.37);
        ctx.closePath();
        ctx.fill();
        
        // 绘制猫咪眼睛
        ctx.fillStyle = '#000';
        // 左眼
        ctx.beginPath();
        ctx.ellipse(-this.width * 0.1, -this.height * 0.2, this.width * 0.04, this.height * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.ellipse(this.width * 0.1, -this.height * 0.2, this.width * 0.04, this.height * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼睛高光
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-this.width * 0.08, -this.height * 0.22, this.width * 0.015, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.width * 0.12, -this.height * 0.22, this.width * 0.015, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制鼻子
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.1);
        ctx.lineTo(-this.width * 0.02, -this.height * 0.05);
        ctx.lineTo(this.width * 0.02, -this.height * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // 绘制嘴巴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.05);
        ctx.quadraticCurveTo(-this.width * 0.08, -this.height * 0.02, -this.width * 0.12, -this.height * 0.08);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.05);
        ctx.quadraticCurveTo(this.width * 0.08, -this.height * 0.02, this.width * 0.12, -this.height * 0.08);
        ctx.stroke();
        
        // 绘制胡须
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        // 左侧胡须
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.25, -this.height * 0.15);
        ctx.lineTo(-this.width * 0.4, -this.height * 0.18);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.25, -this.height * 0.1);
        ctx.lineTo(-this.width * 0.4, -this.height * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.25, -this.height * 0.05);
        ctx.lineTo(-this.width * 0.4, -this.height * 0.02);
        ctx.stroke();
        
        // 右侧胡须
        ctx.beginPath();
        ctx.moveTo(this.width * 0.25, -this.height * 0.15);
        ctx.lineTo(this.width * 0.4, -this.height * 0.18);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.width * 0.25, -this.height * 0.1);
        ctx.lineTo(this.width * 0.4, -this.height * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.width * 0.25, -this.height * 0.05);
        ctx.lineTo(this.width * 0.4, -this.height * 0.02);
        ctx.stroke();
        
        // 绘制猫咪四肢
        ctx.fillStyle = catColor;
        // 前腿
        ctx.fillRect(-this.width * 0.2, this.height * 0.25, this.width * 0.1, this.height * 0.2);
        ctx.fillRect(this.width * 0.1, this.height * 0.25, this.width * 0.1, this.height * 0.2);
        
        // 后腿
        ctx.fillRect(-this.width * 0.15, this.height * 0.3, this.width * 0.08, this.height * 0.15);
        ctx.fillRect(this.width * 0.07, this.height * 0.3, this.width * 0.08, this.height * 0.15);
        
        // 绘制爪子
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(-this.width * 0.15, this.height * 0.45, this.width * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.width * 0.15, this.height * 0.45, this.width * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(-this.width * 0.11, this.height * 0.45, this.width * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.width * 0.11, this.height * 0.45, this.width * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制尾巴（动态摆动）
        ctx.strokeStyle = catColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3, this.height * 0.1);
        
        const tailWave = Math.sin(this.animationTime * 3) * 25;
        const tailWave2 = Math.sin(this.animationTime * 3 + 1) * 15;
        ctx.quadraticCurveTo(
            this.width * 0.5 + tailWave, -this.height * 0.1 + tailWave2,
            this.width * 0.4 + tailWave * 0.7, -this.height * 0.4 + tailWave2
        );
        ctx.stroke();
        
        // 尾巴尖端
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(
            this.width * 0.4 + tailWave * 0.7,
            -this.height * 0.4 + tailWave2,
            this.width * 0.04,
            0, Math.PI * 2
        );
        ctx.fill();
    }
    
    // 表情已集成到完整猫咪绘制中，不再需要单独绘制
    
    // 绘制鱼竿
    drawFishingRod(ctx) {
        // 绘制鱼竿杆子
        ctx.save();
        ctx.translate(this.fishingRod.x, this.fishingRod.y);
        ctx.rotate(this.fishingRod.rodAngle + this.armAngle * Math.PI / 180);
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -60);
        ctx.stroke();
        
        ctx.restore();
        
        // 绘制鱼线
        if (this.fishingRod.lineSegments.length > 0) {
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            ctx.moveTo(this.fishingRod.lineSegments[0].x, this.fishingRod.lineSegments[0].y);
            for (let i = 1; i < this.fishingRod.lineSegments.length; i++) {
                ctx.lineTo(this.fishingRod.lineSegments[i].x, this.fishingRod.lineSegments[i].y);
            }
            
            ctx.stroke();
        }
        
        // 绘制鱼钩
        this.drawFishHook(ctx);
        
        // 如果有抓到的鱼，在鱼钩位置绘制它
        if (this.fishingRod.caughtFish) {
            this.drawCaughtFish(ctx);
        }
    }
    
    // 绘制鱼钩
    drawFishHook(ctx) {
        const hookImage = GameGlobal.ResourceManager.getImage('hook');
        
        // 强制使用自定义鱼钩绘制（忽略图片）
        if (false && hookImage) {
            // 添加鱼钩摆动效果
            const swingAngle = Math.sin(Date.now() * 0.003) * 0.1;
            ctx.save();
            ctx.translate(this.fishingRod.hookX, this.fishingRod.hookY);
            ctx.rotate(swingAngle);
            ctx.drawImage(hookImage, -10, -10, 20, 20);
            ctx.restore();
        } else {
            // 更精美的备用鱼钩绘制
            ctx.save();
            
            // 添加鱼钩摆动效果
            const swingAngle = Math.sin(Date.now() * 0.003) * 0.1;
            ctx.translate(this.fishingRod.hookX, this.fishingRod.hookY);
            ctx.rotate(swingAngle);
            
            // 绘制鱼钩主体（更大更明显的金属质感）
            const gradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, 12);
            gradient.addColorStop(0, '#FFE55C');
            gradient.addColorStop(0.3, '#FFD93D');
            gradient.addColorStop(0.7, '#FFA500');
            gradient.addColorStop(1, '#B8860B');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加外圈阴影
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // 绘制鱼钩的钩子部分（更大更明显的形状）
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            
            // 主钩身（更大）
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.quadraticCurveTo(12, 10, 12, 20);
            ctx.quadraticCurveTo(12, 24, 8, 24);
            ctx.stroke();
            
            // 钩尖（更明显）
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(8, 24);
            ctx.lineTo(4, 20);
            ctx.stroke();
            
            // 添加钩子的倒刺
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(6, 22);
            ctx.lineTo(8, 20);
            ctx.stroke();
            
            // 添加金属光泽效果（更明显）
            ctx.strokeStyle = '#FFFACD';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(-3, -3, 4, 0, Math.PI);
            ctx.stroke();
            
            // 添加闪烁效果
            const sparkle = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.8})`;
            ctx.beginPath();
            ctx.arc(-2, -2, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加彩虹光泽
            const time = Date.now() * 0.005;
            const hue = (time % 360);
            ctx.strokeStyle = `hsla(${hue}, 70%, 80%, 0.6)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // 绘制被抓到的鱼
    drawCaughtFish(ctx) {
        const fish = this.fishingRod.caughtFish;
        
        ctx.save();
        
        // 添加挣扎动画
        const struggle = Math.sin(this.animationTime * 8) * 3;
        ctx.translate(this.fishingRod.hookX + struggle, this.fishingRod.hookY + struggle * 0.5);
        
        // 绘制鱼
        if (fish.image) {
            ctx.drawImage(fish.image, -fish.width/2, -fish.height/2, fish.width, fish.height);
        } else {
            // 使用完整的鱼类绘制逻辑，保持与游戏中一致的外观
            this.drawDetailedFish(ctx, fish);
        }
        
        ctx.restore();
    }
    
    // 绘制详细的鱼类（与游戏中保持一致）
    drawDetailedFish(ctx, fish) {
        const swimOffset = 0; // 被捕获的鱼不需要游泳动画
        const tailWave = 0; // 被捕获的鱼尾巴不摆动
        
        // 辅助函数
        const darkenColor = (color, factor) => {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(255 * factor);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
                (G > 0 ? G : 0) * 0x100 + (B > 0 ? B : 0)).toString(16).slice(1);
        };
        
        const lightenColor = (color, amount) => {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(255 * amount);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        };
        
        // 绘制发光效果（稀有鱼）
        if (fish.glowEffect) {
            this.drawFishGlow(ctx, fish);
        }
        
        // 绘制鱼身
        this.drawFishBody(ctx, fish, swimOffset, darkenColor, lightenColor);
        
        // 绘制鱼尾
        this.drawFishTail(ctx, fish, tailWave, darkenColor);
        
        // 绘制鱼鳍
        this.drawFishFins(ctx, fish, swimOffset, darkenColor);
        
        // 绘制鱼眼
        this.drawFishEyes(ctx, fish, swimOffset);
        
        // 绘制图案
        this.drawFishPattern(ctx, fish, darkenColor, lightenColor);
    }
    
    // 绘制鱼类发光效果
    drawFishGlow(ctx, fish) {
        ctx.save();
        const glowIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
        ctx.globalAlpha = glowIntensity * 0.6;
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, fish.width);
        gradient.addColorStop(0, fish.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.width * 0.8, fish.height * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // 绘制鱼身（根据类型选择绘制方式）
    drawFishBody(ctx, fish, swimOffset, darkenColor, lightenColor) {
        ctx.save();
        
        // 根据鱼类类型使用特殊绘制
        if (fish.type === 'shark') {
            // 鲨鱼流线型鱼身
            const bodyGradient = ctx.createLinearGradient(-fish.width/2, swimOffset - fish.height/2, fish.width/2, swimOffset + fish.height/2);
            bodyGradient.addColorStop(0, fish.color);
            bodyGradient.addColorStop(0.3, fish.secondaryColor);
            bodyGradient.addColorStop(1, darkenColor(fish.color, 0.2));
            ctx.fillStyle = bodyGradient;
            
            // 绘制流线型鲨鱼身体
            ctx.beginPath();
            ctx.moveTo(-fish.width/2, swimOffset);
            ctx.quadraticCurveTo(-fish.width/3, swimOffset - fish.height/2, fish.width/4, swimOffset - fish.height/3);
            ctx.quadraticCurveTo(fish.width/2, swimOffset, fish.width/4, swimOffset + fish.height/3);
            ctx.quadraticCurveTo(-fish.width/3, swimOffset + fish.height/2, -fish.width/2, swimOffset);
            ctx.fill();
            
            // 移除轮廓线条
        } else if (fish.type === 'loach') {
            // 泥鳅细长身体
            ctx.fillStyle = fish.color;
            ctx.beginPath();
            ctx.ellipse(0, swimOffset, fish.width / 2, fish.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加泥鳅特有的条纹
            ctx.strokeStyle = darkenColor(fish.color, 0.3);
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-fish.width/3 + i * fish.width/6, swimOffset - fish.height/4);
                ctx.lineTo(-fish.width/3 + i * fish.width/6, swimOffset + fish.height/4);
                ctx.stroke();
            }
        } else if (fish.type === 'whale') {
            // 鲸鱼巨大身体
            const whaleGradient = ctx.createLinearGradient(0, swimOffset - fish.height/2, 0, swimOffset + fish.height/2);
            whaleGradient.addColorStop(0, fish.color);
            whaleGradient.addColorStop(0.5, lightenColor(fish.color, 0.2));
            whaleGradient.addColorStop(1, darkenColor(fish.color, 0.2));
            ctx.fillStyle = whaleGradient;
            
            ctx.beginPath();
            ctx.ellipse(0, swimOffset, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 鲸鱼腹部白色
            ctx.fillStyle = '#F0F8FF';
            ctx.beginPath();
            ctx.ellipse(0, swimOffset + fish.height/4, fish.width / 3, fish.height / 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 其他鱼类的标准绘制
            ctx.fillStyle = fish.color;
            ctx.beginPath();
            ctx.ellipse(0, swimOffset, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加渐变效果
            const gradient = ctx.createRadialGradient(0, swimOffset - fish.height/4, 0, 0, swimOffset, fish.width/2);
            gradient.addColorStop(0, lightenColor(fish.color, 0.3));
            gradient.addColorStop(1, fish.color);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 绘制鱼尾
    drawFishTail(ctx, fish, tailWave, darkenColor) {
        ctx.save();
        
        if (fish.type === 'shark') {
            // 鲨鱼月牙形尾巴
            ctx.fillStyle = fish.color;
            const tailX = -fish.width / 2;
            const tailSize = fish.width * 0.5;
            
            ctx.beginPath();
            // 上半部分
            ctx.moveTo(tailX, tailWave);
            ctx.quadraticCurveTo(tailX - tailSize * 0.8, tailWave - tailSize * 0.6, tailX - tailSize, tailWave - tailSize * 0.3);
            ctx.quadraticCurveTo(tailX - tailSize * 0.6, tailWave - tailSize * 0.1, tailX - tailSize * 0.3, tailWave);
            // 下半部分
            ctx.quadraticCurveTo(tailX - tailSize * 0.6, tailWave + tailSize * 0.1, tailX - tailSize, tailWave + tailSize * 0.3);
            ctx.quadraticCurveTo(tailX - tailSize * 0.8, tailWave + tailSize * 0.6, tailX, tailWave);
            ctx.fill();
            
            // 移除轮廓线条
        } else {
            // 标准鱼尾绘制方式
            ctx.fillStyle = fish.color;
            const tailX = -fish.width / 2;
            const tailSize = fish.width * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(tailX, tailWave);
            ctx.quadraticCurveTo(tailX - tailSize, tailWave - tailSize/2, tailX - tailSize * 0.8, tailWave);
            ctx.quadraticCurveTo(tailX - tailSize, tailWave + tailSize/2, tailX, tailWave);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 绘制鱼鳍
    drawFishFins(ctx, fish, swimOffset, darkenColor) {
        ctx.save();
        
        const finOffset = 0; // 被捕获的鱼鳍不摆动
        
        if (fish.type === 'shark') {
            // 鲨鱼尖锐鱼鳍
            ctx.fillStyle = fish.secondaryColor;
            const finSize = fish.width * 0.2;
            
            // 背鳍 - 三角形
            ctx.beginPath();
            ctx.moveTo(-fish.width * 0.1, swimOffset - fish.height * 0.3 + finOffset);
            ctx.lineTo(0, swimOffset - fish.height * 0.6 + finOffset);
            ctx.lineTo(fish.width * 0.1, swimOffset - fish.height * 0.3 + finOffset);
            ctx.closePath();
            ctx.fill();
            
            // 腹鳍 - 小三角形
            ctx.beginPath();
            ctx.moveTo(-fish.width * 0.05, swimOffset + fish.height * 0.25 - finOffset);
            ctx.lineTo(0, swimOffset + fish.height * 0.4 - finOffset);
            ctx.lineTo(fish.width * 0.05, swimOffset + fish.height * 0.25 - finOffset);
            ctx.closePath();
            ctx.fill();
            
            // 胸鳍 - 尖锐形状
            ctx.beginPath();
            ctx.moveTo(fish.width * 0.05, swimOffset + finOffset * 0.5);
            ctx.lineTo(fish.width * 0.2, swimOffset - fish.height * 0.1 + finOffset * 0.5);
            ctx.lineTo(fish.width * 0.15, swimOffset + fish.height * 0.1 + finOffset * 0.5);
            ctx.closePath();
            ctx.fill();
        } else if (fish.type === 'loach') {
            // 泥鳅小鱼鳍
            ctx.fillStyle = fish.secondaryColor;
            const finSize = fish.width * 0.1;
            
            // 小背鳍
            ctx.beginPath();
            ctx.arc(0, swimOffset - fish.height * 0.2 + finOffset, finSize * 0.5, 0, Math.PI, true);
            ctx.fill();
            
            // 小腹鳍
            ctx.beginPath();
            ctx.arc(0, swimOffset + fish.height * 0.15 - finOffset, finSize * 0.3, Math.PI, 0, true);
            ctx.fill();
        } else if (fish.type === 'whale') {
            // 鲸鱼大鱼鳍
            ctx.fillStyle = fish.secondaryColor;
            const finSize = fish.width * 0.3;
            
            // 大背鳍
            ctx.beginPath();
            ctx.moveTo(-fish.width * 0.2, swimOffset - fish.height * 0.4 + finOffset);
            ctx.quadraticCurveTo(0, swimOffset - fish.height * 0.6 + finOffset, fish.width * 0.2, swimOffset - fish.height * 0.4 + finOffset);
            ctx.quadraticCurveTo(0, swimOffset - fish.height * 0.3, -fish.width * 0.2, swimOffset - fish.height * 0.4 + finOffset);
            ctx.fill();
            
            // 大胸鳍
            ctx.beginPath();
            ctx.ellipse(fish.width * 0.1, swimOffset + finOffset * 0.5, finSize * 0.8, finSize * 0.4, -Math.PI / 6, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // 标准鱼鳍
            ctx.fillStyle = fish.secondaryColor;
            const finSize = fish.width * 0.2;
            
            // 背鳍
            ctx.beginPath();
            ctx.moveTo(-fish.width * 0.1, swimOffset - fish.height * 0.3 + finOffset);
            ctx.quadraticCurveTo(0, swimOffset - fish.height * 0.5 + finOffset, fish.width * 0.1, swimOffset - fish.height * 0.3 + finOffset);
            ctx.quadraticCurveTo(0, swimOffset - fish.height * 0.25, -fish.width * 0.1, swimOffset - fish.height * 0.3 + finOffset);
            ctx.fill();
            
            // 腹鳍
            ctx.beginPath();
            ctx.moveTo(-fish.width * 0.05, swimOffset + fish.height * 0.2 - finOffset);
            ctx.quadraticCurveTo(0, swimOffset + fish.height * 0.35 - finOffset, fish.width * 0.05, swimOffset + fish.height * 0.2 - finOffset);
            ctx.quadraticCurveTo(0, swimOffset + fish.height * 0.15, -fish.width * 0.05, swimOffset + fish.height * 0.2 - finOffset);
            ctx.fill();
            
            // 胸鳍
            ctx.beginPath();
            ctx.ellipse(fish.width * 0.1, swimOffset + finOffset * 0.5, finSize * 0.6, finSize * 0.3, -Math.PI / 8, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 绘制鱼眼
    drawFishEyes(ctx, fish, swimOffset) {
        // 白色眼球
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(fish.width * 0.2, swimOffset - fish.height * 0.1, fish.width * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // 黑色瞳孔
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(fish.width * 0.22, swimOffset - fish.height * 0.1, fish.width * 0.04, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制鱼类图案
    drawFishPattern(ctx, fish, darkenColor, lightenColor) {
        ctx.save();
        
        // 根据鱼类图案类型绘制
        if (fish.pattern === 'spots') {
            // 斑点图案
            ctx.fillStyle = darkenColor(fish.color, 0.3);
            const spotSize = fish.width * 0.05;
            const spots = [
                { x: -fish.width * 0.1, y: -fish.height * 0.1 },
                { x: fish.width * 0.05, y: fish.height * 0.05 },
                { x: -fish.width * 0.05, y: fish.height * 0.15 }
            ];
            
            spots.forEach(spot => {
                ctx.beginPath();
                ctx.arc(spot.x, spot.y, spotSize, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (fish.pattern === 'stripes') {
            // 条纹图案 - 移除轮廓线条
            // 原条纹图案已移除
        } else if (fish.pattern === 'gradient') {
            // 渐变图案
            const gradient = ctx.createLinearGradient(-fish.width/2, 0, fish.width/2, 0);
            gradient.addColorStop(0, fish.color);
            gradient.addColorStop(0.5, lightenColor(fish.color, 0.2));
            gradient.addColorStop(1, darkenColor(fish.color, 0.2));
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.ellipse(0, 0, fish.width / 3, fish.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 辅助函数：获取更深的颜色
    getDarkerColor(color) {
        // 简单的颜色加深函数
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // 绘制粒子效果
    drawParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    // 绘制调试信息
    drawDebugInfo(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - 10, this.y - 40, 120, 30);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`状态: ${this.currentAnimation}`, this.x - 5, this.y - 25);
        ctx.fillText(`心情: ${this.mood}`, this.x - 5, this.y - 15);
    }
    
    // 获取碰撞矩形
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    // 获取鱼钩碰撞矩形
    getHookCollisionRect() {
        return {
            x: this.fishingRod.hookX - 10,
            y: this.fishingRod.hookY - 10,
            width: 20,
            height: 20
        };
    }
    
    // 检查是否可以钓鱼
    canFish() {
        if (!this.fishingRod) {
            console.error('鱼竿对象未初始化');
            return false;
        }
        return !this.fishingRod.isDropping && !this.fishingRod.isReeling;
    }
    
    // 检查是否正在钓鱼
    isFishingActive() {
        if (!this.fishingRod) {
            console.error('鱼竿对象未初始化');
            return false;
        }
        return this.fishingRod.isDropping || this.fishingRod.isReeling;
    }
    
    // 获取鱼竿状态
    getFishingRodState() {
        if (!this.fishingRod) {
            console.error('鱼竿对象未初始化');
            return 'idle';
        }
        if (this.fishingRod.isDropping) return 'dropping';
        if (this.fishingRod.isReeling) return 'reeling';
        return 'idle';
    }
    
    // 设置动画管理器
    setAnimationManager(animationManager) {
        this.animationManager = animationManager;
    }
    
    // 播放投掷动画
    playCastAnimation() {
        if (this.animationManager && this.currentAnimationInstance) {
            this.animationManager.stopAnimation(this.currentAnimationInstance);
        }
        
        if (this.animationManager) {
            // 小猫身体前倾动画
            this.currentAnimationInstance = this.animationManager.createAnimation(this, {
                duration: 300,
                easing: 'easeOutQuad',
                to: {
                    bodyTilt: 15,
                    armAngle: -30
                },
                onComplete: () => {
                    // 回到正常姿态
                    this.currentAnimationInstance = this.animationManager.createAnimation(this, {
                        duration: 200,
                        easing: 'easeOutBounce',
                        to: {
                            bodyTilt: 0,
                            armAngle: 0
                        }
                    });
                }
            });
        }
    }
    
    // 播放收杆动画
    playReelAnimation() {
        if (this.animationManager && this.currentAnimationInstance) {
            this.animationManager.stopAnimation(this.currentAnimationInstance);
        }
        
        if (this.animationManager) {
            // 小猫用力拉杆动画
            this.currentAnimationInstance = this.animationManager.createAnimation(this, {
                duration: 400,
                easing: 'easeInOutQuad',
                to: {
                    bodyTilt: -10,
                    armAngle: 45
                },
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    this.bodyTilt = 0;
                    this.armAngle = 0;
                }
            });
        }
    }
}

// 导出小猫类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cat;
} else {
    window.Cat = Cat;
}

console.log('小猫角色类加载完成');