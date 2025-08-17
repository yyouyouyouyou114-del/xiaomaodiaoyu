// 障碍物实体类
// 负责水草、垃圾等障碍物的行为和动画效果

class Obstacle {
    constructor(type, x, y) {
        // 基本属性
        this.type = type;
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
        
        // 根据类型设置属性
        this.setupTypeProperties();
        
        // 动画相关
        this.animationTime = Math.random() * Math.PI * 2;
        this.swayOffset = 0;
        this.bobOffset = 0;
        this.rotationOffset = 0;
        this.animationManager = null;
        this.currentAnimation = null;
        this.pulseScale = 1; // 脉冲缩放
        this.glowIntensity = 0; // 发光强度
        
        // 状态
        this.isActive = true;
        this.isColliding = false;
        this.collisionTimer = 0;
        this.maxCollisionTime = 0.5;
        
        // 视觉效果
        this.particles = [];
        this.glowEffect = false;
        this.opacity = 1;
        
        // 交互相关
        this.hasBeenHit = false;
        this.hitCount = 0;
        this.maxHits = this.getMaxHits();
        
        // 环境效果
        this.bubbles = [];
        this.bubbleTimer = 0;
        this.bubbleInterval = 2 + Math.random() * 3;
        
        this.init();
    }
    
    // 根据类型设置属性
    setupTypeProperties() {
        const typeConfig = {
            weed: {
                width: 40,
                height: 80,
                color: '#2E7D32',
                penalty: GameGlobal.GameConfig.OBSTACLE_PENALTY,
                swayIntensity: 15,
                bobIntensity: 5,
                destructible: true,
                animated: true,
                description: '水草'
            },
            trash: {
                width: 50,
                height: 40,
                color: '#795548',
                penalty: GameGlobal.GameConfig.OBSTACLE_PENALTY * 1.5,
                swayIntensity: 5,
                bobIntensity: 8,
                destructible: false,
                animated: true,
                description: '垃圾'
            },
            rock: {
                width: 60,
                height: 45,
                color: '#607D8B',
                penalty: GameGlobal.GameConfig.OBSTACLE_PENALTY * 0.5,
                swayIntensity: 0,
                bobIntensity: 2,
                destructible: false,
                animated: false,
                description: '岩石'
            },
            coral: {
                width: 55,
                height: 70,
                color: '#FF7043',
                penalty: GameGlobal.GameConfig.OBSTACLE_PENALTY * 0.8,
                swayIntensity: 8,
                bobIntensity: 3,
                destructible: true,
                animated: true,
                description: '珊瑚'
            },
            seaweed: {
                width: 30,
                height: 100,
                color: '#388E3C',
                penalty: GameGlobal.GameConfig.OBSTACLE_PENALTY * 0.7,
                swayIntensity: 20,
                bobIntensity: 0,
                destructible: true,
                animated: true,
                description: '海草'
            }
        };
        
        const config = typeConfig[this.type] || typeConfig.weed;
        Object.assign(this, config);
    }
    
    // 获取最大撞击次数
    getMaxHits() {
        const hitConfig = {
            weed: 2,
            trash: 1,
            rock: 0,
            coral: 3,
            seaweed: 1
        };
        
        return hitConfig[this.type] || 1;
    }
    
    // 初始化
    init() {
        // 设置初始动画偏移
        this.animationTime = Math.random() * Math.PI * 2;
        
        // 根据类型设置特殊效果
        if (this.type === 'coral') {
            this.glowEffect = true;
        }
    }
    
    // 更新障碍物状态
    update(deltaTime) {
        if (!this.isActive) return;
        
        // 更新动画时间
        this.animationTime += deltaTime;
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 更新碰撞状态
        this.updateCollisionState(deltaTime);
        
        // 更新视觉效果
        this.updateVisualEffects(deltaTime);
        
        // 更新气泡效果
        this.updateBubbles(deltaTime);
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
        
        // 更新脉冲动画
        this.pulseScale = 1 + Math.sin(this.animationTime * 2) * 0.05;
        
        // 更新发光效果（对于特殊障碍物）
        if (this.type === 'coral' || this.type === 'seaweed') {
            this.glowIntensity = (Math.sin(this.animationTime * 1.5) + 1) * 0.5;
        }
    }
    
    // 更新动画
    updateAnimation(deltaTime) {
        if (!this.animated) return;
        
        // 摆动动画（主要用于水草类）
        this.swayOffset = Math.sin(this.animationTime * 1.5) * this.swayIntensity;
        
        // 上下浮动动画
        this.bobOffset = Math.sin(this.animationTime * 2) * this.bobIntensity;
        
        // 轻微旋转（用于垃圾等）
        if (this.type === 'trash') {
            this.rotationOffset = Math.sin(this.animationTime * 0.8) * 0.1;
        }
    }
    
    // 更新碰撞状态
    updateCollisionState(deltaTime) {
        if (this.isColliding) {
            this.collisionTimer += deltaTime;
            
            if (this.collisionTimer >= this.maxCollisionTime) {
                this.isColliding = false;
                this.collisionTimer = 0;
            }
        }
    }
    
    // 更新视觉效果
    updateVisualEffects(deltaTime) {
        // 发光效果（珊瑚）
        if (this.glowEffect) {
            this.glowIntensity = 0.3 + Math.sin(this.animationTime * 3) * 0.2;
        }
        
        // 碰撞闪烁效果
        if (this.isColliding) {
            this.opacity = 0.5 + Math.sin(this.animationTime * 10) * 0.3;
        } else {
            this.opacity = 1;
        }
    }
    
    // 更新气泡效果
    updateBubbles(deltaTime) {
        this.bubbleTimer += deltaTime;
        
        // 生成气泡（主要用于有机障碍物）
        if (this.shouldGenerateBubbles() && this.bubbleTimer >= this.bubbleInterval) {
            this.createBubble();
            this.bubbleTimer = 0;
            this.bubbleInterval = 2 + Math.random() * 4;
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
    
    // 判断是否应该生成气泡
    shouldGenerateBubbles() {
        return this.type === 'weed' || this.type === 'seaweed' || this.type === 'coral';
    }
    
    // 创建气泡
    createBubble() {
        const bubble = {
            x: this.x + this.width * 0.3 + Math.random() * this.width * 0.4,
            y: this.y,
            size: 1 + Math.random() * 3,
            speed: 20 + Math.random() * 15,
            wobble: 5 + Math.random() * 5,
            time: 0,
            life: 3 + Math.random() * 2,
            maxLife: 3 + Math.random() * 2,
            alpha: 1
        };
        
        this.bubbles.push(bubble);
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
    
    // 处理碰撞
    onCollision(collider) {
        if (this.isColliding) return false; // 避免重复碰撞
        
        this.isColliding = true;
        this.hasBeenHit = true;
        this.hitCount++;
        
        // 播放碰撞动画
        this.playCollisionAnimation();
        
        // 创建碰撞粒子效果
        this.createCollisionParticles();
        
        // 播放碰撞音效
        this.playCollisionSound();
        
        // 检查是否应该被摧毁
        if (this.destructible && this.hitCount >= this.maxHits) {
            this.destroy();
            return true; // 表示障碍物被摧毁
        }
        
        return false; // 表示障碍物仍然存在
    }
    
    // 创建碰撞粒子效果
    createCollisionParticles() {
        const particleCount = this.type === 'rock' ? 8 : 5;
        const particleColor = this.getParticleColor();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150 - 50,
                color: particleColor,
                size: 2 + Math.random() * 4,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                alpha: 1,
                gravity: 200
            };
            
            this.particles.push(particle);
        }
    }
    
    // 获取粒子颜色
    getParticleColor() {
        const colorMap = {
            weed: '#4CAF50',
            trash: '#8D6E63',
            rock: '#90A4AE',
            coral: '#FF8A65',
            seaweed: '#66BB6A'
        };
        
        return colorMap[this.type] || '#757575';
    }
    
    // 播放碰撞音效
    playCollisionSound() {
        // 暂时禁用音频
        console.log(`播放${this.type}碰撞音效（已禁用）`);
        // const soundMap = {
        //     weed: 'weed_hit',
        //     trash: 'trash_hit',
        //     rock: 'rock_hit',
        //     coral: 'coral_hit',
        //     seaweed: 'weed_hit'
        // };
        // 
        // const soundName = soundMap[this.type];
        // const sound = GameGlobal.ResourceManager.getSound(soundName);
        // 
        // if (sound) {
        //     sound.play();
        // }
    }
    
    // 摧毁障碍物
    destroy() {
        this.isActive = false;
        
        // 创建摧毁粒子效果
        this.createDestroyParticles();
        
        // 播放摧毁音效
        this.playDestroySound();
        
        console.log(`${this.description}被摧毁了！`);
    }
    
    // 创建摧毁粒子效果
    createDestroyParticles() {
        for (let i = 0; i < 15; i++) {
            const particle = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200 - 100,
                color: this.getParticleColor(),
                size: 3 + Math.random() * 6,
                life: 1 + Math.random(),
                maxLife: 1 + Math.random(),
                alpha: 1,
                gravity: 150
            };
            
            this.particles.push(particle);
        }
    }
    
    // 播放摧毁音效
    playDestroySound() {
        // 暂时禁用音频
        console.log('播放障碍物摧毁音效（已禁用）');
        // const sound = GameGlobal.ResourceManager.getSound('obstacle_destroy');
        // if (sound) {
        //     sound.play();
        // }
    }
    
    // 渲染障碍物
    render(ctx) {
        if (!this.isActive) {
            // 只渲染粒子效果
            this.drawParticles(ctx);
            return;
        }
        
        // 绘制发光效果
        if (this.glowEffect) {
            this.drawGlowEffect(ctx);
        }
        
        // 绘制障碍物主体
        this.drawObstacleBody(ctx);
        
        // 绘制气泡
        this.drawBubbles(ctx);
        
        // 绘制粒子效果
        this.drawParticles(ctx);
        
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
    
    // 绘制障碍物主体
    drawObstacleBody(ctx) {
        const obstacleImage = GameGlobal.ResourceManager.getImage(`obstacle_${this.type}`);
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // 应用动画变换
        const finalX = this.x + this.swayOffset;
        const finalY = this.y + this.bobOffset;
        
        // 应用脉冲缩放
        ctx.translate(finalX + this.width / 2, finalY + this.height / 2);
        ctx.scale(this.pulseScale, this.pulseScale);
        
        // 添加发光效果
        if (this.glowIntensity > 0) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10 * this.glowIntensity;
        }
        
        if (this.rotationOffset !== 0) {
            ctx.rotate(this.rotationOffset);
        }
        
        ctx.translate(-this.width / 2, -this.height / 2);
        
        if (obstacleImage) {
            ctx.drawImage(obstacleImage, 0, 0, this.width, this.height);
        } else {
            // 备用绘制方案
            this.drawFallbackObstacle(ctx, 0, 0);
        }
        
        ctx.restore();
    }
    
    // 备用障碍物绘制
    drawFallbackObstacle(ctx, x, y) {
        switch (this.type) {
            case 'weed':
                this.drawWeed(ctx, x, y);
                break;
            case 'trash':
                this.drawTrash(ctx, x, y);
                break;
            case 'rock':
                this.drawRock(ctx, x, y);
                break;
            case 'coral':
                this.drawCoral(ctx, x, y);
                break;
            case 'seaweed':
                this.drawSeaweed(ctx, x, y);
                break;
            default:
                this.drawGeneric(ctx, x, y);
                break;
        }
    }
    
    // 绘制水草
    drawWeed(ctx, x, y) {
        ctx.fillStyle = this.color;
        
        // 绘制多个水草叶片
        for (let i = 0; i < 3; i++) {
            const leafX = x + i * (this.width / 3);
            const leafWidth = this.width / 4;
            
            ctx.beginPath();
            ctx.ellipse(leafX + leafWidth / 2, y + this.height / 2, leafWidth, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制垃圾
    drawTrash(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
        
        // 添加一些细节
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x + 5, y + 5, this.width - 10, 5);
        ctx.fillRect(x + 5, y + this.height - 10, this.width - 10, 5);
    }
    
    // 绘制岩石
    drawRock(ctx, x, y) {
        ctx.fillStyle = this.color;
        
        // 绘制不规则岩石形状
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加纹理
        ctx.fillStyle = '#546E7A';
        ctx.beginPath();
        ctx.ellipse(x + this.width * 0.3, y + this.height * 0.3, this.width * 0.1, this.height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制珊瑚
    drawCoral(ctx, x, y) {
        ctx.fillStyle = this.color;
        
        // 绘制珊瑚分支
        const branches = 4;
        for (let i = 0; i < branches; i++) {
            const angle = (i / branches) * Math.PI * 2;
            const branchLength = this.height * 0.4;
            const endX = x + this.width / 2 + Math.cos(angle) * branchLength;
            const endY = y + this.height / 2 + Math.sin(angle) * branchLength;
            
            ctx.beginPath();
            ctx.moveTo(x + this.width / 2, y + this.height / 2);
            ctx.lineTo(endX, endY);
            ctx.lineWidth = 8;
            ctx.stroke();
            
            // 绘制分支末端
            ctx.beginPath();
            ctx.arc(endX, endY, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制海草
    drawSeaweed(ctx, x, y) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        
        // 绘制弯曲的海草
        ctx.beginPath();
        ctx.moveTo(x + this.width / 2, y + this.height);
        
        const segments = 10;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const segmentY = y + this.height - (t * this.height);
            const curve = Math.sin(t * Math.PI * 2 + this.animationTime) * 10;
            
            ctx.lineTo(x + this.width / 2 + curve, segmentY);
        }
        
        ctx.stroke();
    }
    
    // 绘制通用障碍物
    drawGeneric(ctx, x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
    }
    
    // 绘制气泡
    drawBubbles(ctx) {
        this.bubbles.forEach(bubble => {
            ctx.save();
            ctx.globalAlpha = bubble.alpha;
            
            // 绘制气泡
            ctx.fillStyle = 'rgba(173, 216, 230, 0.4)';
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制气泡高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
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
        ctx.fillRect(this.x, this.y - 35, 100, 30);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.description}`, this.x + 2, this.y - 25);
        ctx.fillText(`撞击: ${this.hitCount}/${this.maxHits}`, this.x + 2, this.y - 15);
        ctx.fillText(`惩罚: ${this.penalty}`, this.x + 2, this.y - 5);
    }
    
    // 获取碰撞矩形
    getCollisionRect() {
        return {
            x: this.x + this.swayOffset,
            y: this.y + this.bobOffset,
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
    
    // 播放碰撞动画
    playCollisionAnimation() {
        // 震动效果
        let shakeCount = 0;
        const originalX = this.x;
        const shakeAnimation = () => {
            this.x = originalX + (Math.random() - 0.5) * 10;
            shakeCount++;
            if (shakeCount < 10) {
                requestAnimationFrame(shakeAnimation);
            } else {
                this.x = originalX;
            }
        };
        requestAnimationFrame(shakeAnimation);
        
        // 缩放效果
        this.pulseScale = 1.3;
        const scaleAnimation = () => {
            this.pulseScale = Math.max(1, this.pulseScale - 0.02);
            if (this.pulseScale > 1) {
                requestAnimationFrame(scaleAnimation);
            }
        };
        requestAnimationFrame(scaleAnimation);
    }
    
    // 获取障碍物信息
    getInfo() {
        return {
            type: this.type,
            description: this.description,
            penalty: this.penalty,
            destructible: this.destructible,
            hitCount: this.hitCount,
            maxHits: this.maxHits,
            isActive: this.isActive
        };
    }
}

// 导出障碍物类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Obstacle;
} else {
    window.Obstacle = Obstacle;
}

console.log('障碍物实体加载完成');