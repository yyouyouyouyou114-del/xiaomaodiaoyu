// 鱼类实体类
// 负责不同类型鱼的行为、动画和属性管理

class Fish {
    constructor(type, x, y) {
        // 基本属性
        this.type = type;
        this.x = x;
        this.y = y;
        this.originalY = y; // 记录初始Y位置，用于游泳动画
        
        // 根据类型设置属性
        this.setupTypeProperties();
        
        // 运动相关
        this.speed = this.baseSpeed + Math.random() * 50;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.verticalSpeed = 20 + Math.random() * 30;
        this.verticalDirection = Math.random() > 0.5 ? 1 : -1;
        
        // 动画相关
        this.animationTime = Math.random() * Math.PI * 2; // 随机起始动画时间
        this.swimOffset = 0;
        this.tailOffset = 0;
        this.finOffset = 0;
        this.animationManager = null;
        this.currentAnimation = null;
        this.bodyWave = 0; // 身体波动
        this.scaleAnimation = 1; // 缩放动画
        
        // 状态
        this.isAlive = true;
        this.isCaught = false;
        this.isEscaping = false;
        this.escapeTimer = 0;
        this.maxEscapeTime = 3; // 逃跑持续时间
        
        // 行为相关
        this.behaviorTimer = 0;
        this.currentBehavior = 'swimming'; // swimming, resting, escaping, schooling
        this.restTimer = 0;
        this.maxRestTime = 2;
        
        // 群体行为
        this.schoolmates = [];
        this.schoolRadius = 100;
        this.separationRadius = 30;
        
        // 视觉效果
        this.bubbles = [];
        this.bubbleTimer = 0;
        this.bubbleInterval = 1 + Math.random() * 2;
        
        // 稀有鱼特效
        this.glowEffect = this.type === 'rare';
        this.glowIntensity = 0;
        
        // 音效
        this.sounds = {
            splash: null,
            bubble: null
        };
        
        this.init();
    }
    
    // 根据类型设置属性
    setupTypeProperties() {
        const typeConfig = {
            small: {
                width: 40,
                height: 30,
                baseSpeed: 80,
                score: GameGlobal.GameConfig.FISH_SCORES.small,
                color: '#4ECDC4',
                rarity: 'common',
                agility: 1.2,
                escapeChance: 0.1
            },
            medium: {
                width: 60,
                height: 45,
                baseSpeed: 60,
                score: GameGlobal.GameConfig.FISH_SCORES.medium,
                color: '#45B7B8',
                rarity: 'common',
                agility: 1.0,
                escapeChance: 0.15
            },
            large: {
                width: 80,
                height: 60,
                baseSpeed: 40,
                score: GameGlobal.GameConfig.FISH_SCORES.large,
                color: '#26A69A',
                rarity: 'uncommon',
                agility: 0.8,
                escapeChance: 0.25
            },
            rare: {
                width: 70,
                height: 50,
                baseSpeed: 100,
                score: GameGlobal.GameConfig.FISH_SCORES.rare,
                color: '#FFD93D',
                rarity: 'rare',
                agility: 1.5,
                escapeChance: 0.4
            }
        };
        
        const config = typeConfig[this.type] || typeConfig.small;
        Object.assign(this, config);
    }
    
    // 初始化
    init() {
        // 加载音效
        this.loadSounds();
        
        // 设置初始行为
        this.setBehavior('swimming');
    }
    
    // 加载音效
    loadSounds() {
        // 暂时禁用音频加载
        this.sounds.splash = { play: () => {}, pause: () => {}, stop: () => {} };
        this.sounds.bubble = { play: () => {}, pause: () => {}, stop: () => {} };
        // this.sounds.splash = GameGlobal.ResourceManager.getSound('splash');
        // this.sounds.bubble = GameGlobal.ResourceManager.getSound('bubble');
    }
    
    // 更新鱼的状态
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // 更新动画时间
        this.animationTime += deltaTime;
        
        // 更新行为
        this.updateBehavior(deltaTime);
        
        // 更新运动
        this.updateMovement(deltaTime);
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 更新视觉效果
        this.updateVisualEffects(deltaTime);
        
        // 更新气泡
        this.updateBubbles(deltaTime);
        
        // 边界检查
        this.checkBoundaries();
        
        // 更新身体波动动画
        this.bodyWave = Math.sin(this.animationTime * 3) * 0.1;
    }
    
    // 更新行为
    updateBehavior(deltaTime) {
        this.behaviorTimer += deltaTime;
        
        switch (this.currentBehavior) {
            case 'swimming':
                this.updateSwimmingBehavior(deltaTime);
                break;
            case 'resting':
                this.updateRestingBehavior(deltaTime);
                break;
            case 'escaping':
                this.updateEscapingBehavior(deltaTime);
                break;
            case 'schooling':
                this.updateSchoolingBehavior(deltaTime);
                break;
        }
    }
    
    // 更新游泳行为
    updateSwimmingBehavior(deltaTime) {
        // 随机改变方向
        if (this.behaviorTimer > 3 + Math.random() * 4) {
            if (Math.random() < 0.3) {
                this.direction *= -1;
            }
            if (Math.random() < 0.2) {
                this.verticalDirection *= -1;
            }
            
            // 随机切换到休息状态
            if (Math.random() < 0.1) {
                this.setBehavior('resting');
            }
            
            this.behaviorTimer = 0;
        }
    }
    
    // 更新休息行为
    updateRestingBehavior(deltaTime) {
        this.restTimer += deltaTime;
        
        // 休息时减慢速度
        this.speed *= 0.95;
        
        if (this.restTimer >= this.maxRestTime) {
            this.setBehavior('swimming');
            this.restTimer = 0;
        }
    }
    
    // 更新逃跑行为
    updateEscapingBehavior(deltaTime) {
        this.escapeTimer += deltaTime;
        
        // 逃跑时增加速度
        this.speed = this.baseSpeed * 2 * this.agility;
        
        if (this.escapeTimer >= this.maxEscapeTime) {
            this.setBehavior('swimming');
            this.isEscaping = false;
            this.escapeTimer = 0;
        }
    }
    
    // 更新群体行为
    updateSchoolingBehavior(deltaTime) {
        // 实现简单的群体行为逻辑
        this.applySchoolingForces();
    }
    
    // 应用群体行为力
    applySchoolingForces() {
        if (this.schoolmates.length === 0) {
            this.setBehavior('swimming');
            return;
        }
        
        let avgX = 0, avgY = 0;
        let separationX = 0, separationY = 0;
        let count = 0;
        
        this.schoolmates.forEach(fish => {
            if (!fish.isAlive) return;
            
            const dx = fish.x - this.x;
            const dy = fish.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.schoolRadius) {
                avgX += fish.x;
                avgY += fish.y;
                count++;
                
                // 分离力
                if (distance < this.separationRadius && distance > 0) {
                    separationX -= dx / distance;
                    separationY -= dy / distance;
                }
            }
        });
        
        if (count > 0) {
            // 聚合力
            avgX /= count;
            avgY /= count;
            
            const cohesionX = (avgX - this.x) * 0.01;
            const cohesionY = (avgY - this.y) * 0.01;
            
            // 应用力
            this.direction = cohesionX + separationX * 0.1;
            this.verticalDirection = cohesionY + separationY * 0.1;
        }
    }
    
    // 设置行为
    setBehavior(behavior) {
        this.currentBehavior = behavior;
        this.behaviorTimer = 0;
        
        // 根据行为调整速度
        switch (behavior) {
            case 'resting':
                this.speed = this.baseSpeed * 0.3;
                break;
            case 'escaping':
                this.speed = this.baseSpeed * 2;
                this.isEscaping = true;
                break;
            default:
                this.speed = this.baseSpeed + Math.random() * 50;
                break;
        }
    }
    
    // 更新运动
    updateMovement(deltaTime) {
        // 水平运动
        this.x += this.speed * this.direction * deltaTime;
        
        // 垂直运动（轻微的上下游动）
        this.y += this.verticalSpeed * this.verticalDirection * deltaTime * 0.3;
    }
    
    // 更新动画
    updateAnimation(deltaTime) {
        // 游泳动画
        this.swimOffset = Math.sin(this.animationTime * 3) * 2;
        
        // 尾巴摆动
        this.tailOffset = Math.sin(this.animationTime * 4) * 5;
        
        // 鱼鳍摆动
        this.finOffset = Math.sin(this.animationTime * 2.5) * 3;
    }
    
    // 更新视觉效果
    updateVisualEffects(deltaTime) {
        // 稀有鱼发光效果
        if (this.glowEffect) {
            this.glowIntensity = 0.5 + Math.sin(this.animationTime * 2) * 0.3;
        }
    }
    
    // 更新气泡
    updateBubbles(deltaTime) {
        this.bubbleTimer += deltaTime;
        
        // 生成气泡
        if (this.bubbleTimer >= this.bubbleInterval) {
            this.createBubble();
            this.bubbleTimer = 0;
            this.bubbleInterval = 1 + Math.random() * 3;
        }
        
        // 更新现有气泡
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            bubble.y -= bubble.speed * deltaTime;
            bubble.x += Math.sin(bubble.time) * bubble.wobble * deltaTime;
            bubble.time += deltaTime;
            bubble.life -= deltaTime;
            bubble.alpha = bubble.life / bubble.maxLife;
            
            if (bubble.life <= 0 || bubble.y < 0) {
                this.bubbles.splice(i, 1);
            }
        }
    }
    
    // 创建气泡
    createBubble() {
        const bubble = {
            x: this.x + this.width * 0.2,
            y: this.y + this.height * 0.3,
            size: 2 + Math.random() * 4,
            speed: 30 + Math.random() * 20,
            wobble: 10 + Math.random() * 10,
            time: 0,
            life: 2 + Math.random() * 2,
            maxLife: 2 + Math.random() * 2,
            alpha: 1
        };
        
        this.bubbles.push(bubble);
    }
    
    // 边界检查
    checkBoundaries() {
        const canvas = GameGlobal.canvas;
        
        // 水平边界
        if (this.x <= -this.width) {
            this.x = canvas.width;
        } else if (this.x >= canvas.width) {
            this.x = -this.width;
        }
        
        // 垂直边界（保持在水中）
        const waterTop = 200;
        const waterBottom = canvas.height - 50;
        
        if (this.y < waterTop) {
            this.y = waterTop;
            this.verticalDirection = 1;
        } else if (this.y > waterBottom - this.height) {
            this.y = waterBottom - this.height;
            this.verticalDirection = -1;
        }
    }
    
    // 被抓住
    getCaught() {
        this.isCaught = true;
        this.setBehavior('escaping');
        
        // 播放被捕获动画
        this.playCaughtAnimation();
        
        // 有一定几率逃脱
        if (Math.random() < this.escapeChance) {
            setTimeout(() => {
                if (this.isCaught) {
                    this.escape();
                }
            }, 500 + Math.random() * 1000);
        }
    }
    
    // 逃脱
    escape() {
        this.isCaught = false;
        this.setBehavior('escaping');
        
        // 播放逃脱动画
        this.playEscapeAnimation();
        
        // 创建逃脱粒子效果
        this.createEscapeParticles();
        
        console.log(`${this.type}鱼逃脱了！`);
    }
    
    // 创建逃脱粒子效果
    createEscapeParticles() {
        for (let i = 0; i < 8; i++) {
            const bubble = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                size: 3 + Math.random() * 5,
                speed: 50 + Math.random() * 50,
                wobble: 20,
                time: 0,
                life: 1,
                maxLife: 1,
                alpha: 1
            };
            
            this.bubbles.push(bubble);
        }
    }
    
    // 添加到鱼群
    addToSchool(fishes) {
        this.schoolmates = fishes.filter(fish => 
            fish !== this && 
            fish.type === this.type && 
            GameGlobal.Utils.getDistance(this, fish) < this.schoolRadius
        );
        
        if (this.schoolmates.length > 0) {
            this.setBehavior('schooling');
        }
    }
    
    // 渲染鱼
    render(ctx) {
        if (!this.isAlive) return;
        
        // 绘制发光效果（稀有鱼）
        if (this.glowEffect) {
            this.drawGlowEffect(ctx);
        }
        
        // 绘制鱼身体
        this.drawFishBody(ctx);
        
        // 绘制气泡
        this.drawBubbles(ctx);
        
        // 绘制调试信息
        if (GameGlobal.GameConfig.DEBUG_MODE) {
            this.drawDebugInfo(ctx);
        }
    }
    
    // 绘制发光效果
    drawGlowEffect(ctx) {
        ctx.save();
        ctx.globalAlpha = this.glowIntensity;
        
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, this.width
        );
        
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.x - this.width / 2, 
            this.y - this.height / 2, 
            this.width * 2, 
            this.height * 2
        );
        
        ctx.restore();
    }
    
    // 绘制鱼身体
    drawFishBody(ctx) {
        const fishImage = GameGlobal.ResourceManager.getImage(`fish_${this.type}`);
        
        ctx.save();
        
        // 根据游泳方向翻转
        if (this.direction < 0) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        // 应用呼吸效果和缩放动画
        const breathScale = 1 + Math.sin(this.animationTime * 2) * 0.05;
        ctx.scale(breathScale * this.scaleAnimation, breathScale * this.scaleAnimation);
        
        // 应用身体波动
        ctx.rotate(this.bodyWave);
        
        // 添加游泳动画偏移
        const finalY = this.y + this.swimOffset;
        
        if (fishImage) {
            ctx.drawImage(fishImage, 0, finalY, this.width, this.height);
        } else {
            // 备用绘制方案
            this.drawFallbackFish(ctx, finalY);
        }
        
        ctx.restore();
    }
    
    // 备用鱼绘制
    drawFallbackFish(ctx, y) {
        // 绘制鱼身体
        ctx.fillStyle = this.color;
        ctx.fillRect(0, y, this.width, this.height);
        
        // 绘制鱼尾
        ctx.fillStyle = this.getDarkerColor(this.color);
        ctx.beginPath();
        ctx.moveTo(0, y + this.height / 2);
        ctx.lineTo(-this.width * 0.3 + this.tailOffset, y + this.height * 0.2);
        ctx.lineTo(-this.width * 0.3 + this.tailOffset, y + this.height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // 绘制鱼鳍
        ctx.fillStyle = this.getDarkerColor(this.color);
        ctx.beginPath();
        ctx.ellipse(
            this.width * 0.3, 
            y + this.height * 0.7 + this.finOffset, 
            this.width * 0.15, 
            this.height * 0.2, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.width * 0.7, y + this.height * 0.3, this.width * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width * 0.72, y + this.height * 0.3, this.width * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制鱼鳞纹理
        this.drawScales(ctx, y);
    }
    
    // 绘制鱼鳞
    drawScales(ctx, y) {
        ctx.strokeStyle = this.getDarkerColor(this.color);
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const scaleX = this.width * 0.2 + i * this.width * 0.2;
                const scaleY = y + this.height * 0.3 + j * this.height * 0.3;
                
                ctx.beginPath();
                ctx.arc(scaleX, scaleY, this.width * 0.05, 0, Math.PI);
                ctx.stroke();
            }
        }
    }
    
    // 获取更深的颜色
    getDarkerColor(color) {
        // 简单的颜色变暗算法
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            return `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
        }
        
        return color;
    }
    
    // 绘制气泡
    drawBubbles(ctx) {
        this.bubbles.forEach(bubble => {
            ctx.save();
            ctx.globalAlpha = bubble.alpha;
            
            // 绘制气泡
            ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制气泡高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // 绘制调试信息
    drawDebugInfo(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x, this.y - 30, 80, 25);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.type} - ${this.currentBehavior}`, this.x + 2, this.y - 15);
        ctx.fillText(`速度: ${Math.floor(this.speed)}`, this.x + 2, this.y - 5);
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
    
    // 检查是否在屏幕内
    isOnScreen() {
        const canvas = GameGlobal.canvas;
        return this.x > -this.width && 
               this.x < canvas.width + this.width && 
               this.y > 0 && 
               this.y < canvas.height;
    }
    
    // 播放被捕获动画
    playCaughtAnimation() {
        this.scaleAnimation = 1.2;
        // 缩放动画逐渐恢复
        const animateScale = () => {
            this.scaleAnimation = Math.max(1, this.scaleAnimation - 0.01);
            if (this.scaleAnimation > 1) {
                requestAnimationFrame(animateScale);
            }
        };
        requestAnimationFrame(animateScale);
    }
    
    // 播放逃脱动画
    playEscapeAnimation() {
        this.scaleAnimation = 0.8;
        // 快速摆动效果
        let shakeCount = 0;
        const shakeAnimation = () => {
            this.tailOffset = Math.sin(Date.now() * 0.05) * 15;
            shakeCount++;
            if (shakeCount < 30) {
                requestAnimationFrame(shakeAnimation);
            } else {
                this.scaleAnimation = 1;
            }
        };
        requestAnimationFrame(shakeAnimation);
    }
    
    // 销毁鱼
    destroy() {
        this.isAlive = false;
        this.bubbles = [];
        this.schoolmates = [];
    }
}

// 导出鱼类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Fish;
} else {
    window.Fish = Fish;
}

console.log('鱼类实体加载完成');