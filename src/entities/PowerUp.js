// 道具实体类
// 负责鱼饵、加速器、增益药水等道具的功能和效果

class PowerUp {
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
        this.floatOffset = 0;
        this.rotationOffset = 0;
        this.scaleOffset = 1;
        this.glowIntensity = 0;
        this.animationManager = null;
        this.currentAnimation = null;
        this.glowRadius = 0; // 光环半径
        this.collectAnimation = 1; // 收集动画缩放
        
        // 状态
        this.isActive = true;
        this.isCollected = false;
        this.collectionTimer = 0;
        this.maxCollectionTime = 0.8;
        
        // 视觉效果
        this.particles = [];
        this.sparkles = [];
        this.aura = [];
        this.opacity = 1;
        
        // 移动相关
        this.moveSpeed = 20 + Math.random() * 10;
        this.moveDirection = Math.random() * Math.PI * 2;
        this.driftSpeed = 5;
        
        // 生命周期
        this.lifeTime = 0;
        this.maxLifeTime = 30; // 30秒后消失
        this.blinkTime = 25; // 25秒后开始闪烁
        
        // 磁性效果（吸引鱼钩）
        this.magneticRange = this.getMagneticRange();
        this.magneticStrength = 50;
        
        this.init();
    }
    
    // 根据类型设置属性
    setupTypeProperties() {
        const typeConfig = {
            bait: {
                width: 35,
                height: 35,
                color: '#FF6B35',
                glowColor: '#FF8A50',
                effect: 'attract_fish',
                duration: 15,
                value: 0,
                rarity: 'common',
                description: '鱼饵',
                sparkleColor: '#FFD700',
                floatIntensity: 8,
                rotationSpeed: 2
            },
            accelerator: {
                width: 40,
                height: 30,
                color: '#00BCD4',
                glowColor: '#26C6DA',
                effect: 'speed_boost',
                duration: 10,
                value: 0,
                rarity: 'uncommon',
                description: '加速器',
                sparkleColor: '#00E5FF',
                floatIntensity: 6,
                rotationSpeed: 3
            },
            buff_potion: {
                width: 30,
                height: 45,
                color: '#9C27B0',
                glowColor: '#BA68C8',
                effect: 'score_multiplier',
                duration: 20,
                value: 2, // 2倍分数
                rarity: 'rare',
                description: '增益药水',
                sparkleColor: '#E1BEE7',
                floatIntensity: 10,
                rotationSpeed: 1.5
            },
            time_bonus: {
                width: 38,
                height: 38,
                color: '#4CAF50',
                glowColor: '#66BB6A',
                effect: 'time_extension',
                duration: 0,
                value: 10, // 增加10秒
                rarity: 'uncommon',
                description: '时间奖励',
                sparkleColor: '#A5D6A7',
                floatIntensity: 7,
                rotationSpeed: 2.5
            },
            lucky_charm: {
                width: 32,
                height: 32,
                color: '#FFD700',
                glowColor: '#FFEB3B',
                effect: 'rare_fish_boost',
                duration: 25,
                value: 0,
                rarity: 'epic',
                description: '幸运符',
                sparkleColor: '#FFF176',
                floatIntensity: 12,
                rotationSpeed: 4
            },
            magnet: {
                width: 36,
                height: 36,
                color: '#F44336',
                glowColor: '#EF5350',
                effect: 'magnetic_hook',
                duration: 12,
                value: 0,
                rarity: 'rare',
                description: '磁力钩',
                sparkleColor: '#FFCDD2',
                floatIntensity: 5,
                rotationSpeed: 1
            }
        };
        
        const config = typeConfig[this.type] || typeConfig.bait;
        Object.assign(this, config);
    }
    
    // 获取磁性范围
    getMagneticRange() {
        const rangeConfig = {
            bait: 60,
            accelerator: 40,
            buff_potion: 50,
            time_bonus: 45,
            lucky_charm: 70,
            magnet: 80
        };
        
        return rangeConfig[this.type] || 50;
    }
    
    // 初始化
    init() {
        // 设置初始动画偏移
        this.animationTime = Math.random() * Math.PI * 2;
        
        // 创建初始光环粒子
        this.createAuraParticles();
        
        // 根据稀有度设置特殊效果
        this.setupRarityEffects();
    }
    
    // 设置稀有度效果
    setupRarityEffects() {
        switch (this.rarity) {
            case 'epic':
                this.createSparkleEffect(15);
                break;
            case 'rare':
                this.createSparkleEffect(10);
                break;
            case 'uncommon':
                this.createSparkleEffect(5);
                break;
            default:
                this.createSparkleEffect(3);
                break;
        }
    }
    
    // 创建光环粒子
    createAuraParticles() {
        const particleCount = this.rarity === 'epic' ? 8 : (this.rarity === 'rare' ? 6 : 4);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = this.width * 0.8;
            
            const auraParticle = {
                angle: angle,
                distance: distance,
                originalDistance: distance,
                speed: 0.5 + Math.random() * 0.5,
                size: 2 + Math.random() * 3,
                alpha: 0.6 + Math.random() * 0.4,
                color: this.glowColor,
                pulsePhase: Math.random() * Math.PI * 2
            };
            
            this.aura.push(auraParticle);
        }
    }
    
    // 创建闪烁效果
    createSparkleEffect(count) {
        for (let i = 0; i < count; i++) {
            const sparkle = {
                x: this.x + (Math.random() - 0.5) * this.width * 2,
                y: this.y + (Math.random() - 0.5) * this.height * 2,
                size: 1 + Math.random() * 3,
                life: 1 + Math.random() * 2,
                maxLife: 1 + Math.random() * 2,
                alpha: 1,
                color: this.sparkleColor,
                twinkleSpeed: 2 + Math.random() * 3
            };
            
            this.sparkles.push(sparkle);
        }
    }
    
    // 更新道具状态
    update(deltaTime) {
        if (!this.isActive) return;
        
        // 更新生命周期
        this.lifeTime += deltaTime;
        
        // 检查是否应该消失
        if (this.lifeTime >= this.maxLifeTime) {
            this.destroy();
            return;
        }
        
        // 更新动画时间
        this.animationTime += deltaTime;
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 更新移动
        this.updateMovement(deltaTime);
        
        // 更新收集状态
        this.updateCollectionState(deltaTime);
        
        // 更新视觉效果
        this.updateVisualEffects(deltaTime);
        
        // 更新光环效果
        this.glowRadius = 20 + Math.sin(this.animationTime * 3) * 5;
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
        
        // 更新闪烁效果
        this.updateSparkles(deltaTime);
        
        // 更新光环效果
        this.updateAura(deltaTime);
    }
    
    // 更新动画
    updateAnimation(deltaTime) {
        // 浮动动画
        this.floatOffset = Math.sin(this.animationTime * 2) * this.floatIntensity;
        
        // 旋转动画
        this.rotationOffset += this.rotationSpeed * deltaTime;
        
        // 缩放动画（呼吸效果）
        this.scaleOffset = 1 + Math.sin(this.animationTime * 3) * 0.1;
        
        // 发光强度动画
        this.glowIntensity = 0.5 + Math.sin(this.animationTime * 4) * 0.3;
        
        // 临近消失时的闪烁效果
        if (this.lifeTime >= this.blinkTime) {
            const blinkSpeed = (this.lifeTime - this.blinkTime) / (this.maxLifeTime - this.blinkTime) * 10;
            this.opacity = 0.3 + Math.sin(this.animationTime * blinkSpeed) * 0.7;
        }
    }
    
    // 更新移动
    updateMovement(deltaTime) {
        // 缓慢漂移
        this.x += Math.cos(this.moveDirection) * this.driftSpeed * deltaTime;
        this.y += Math.sin(this.moveDirection) * this.driftSpeed * deltaTime;
        
        // 改变移动方向
        this.moveDirection += (Math.random() - 0.5) * deltaTime;
        
        // 保持在屏幕范围内
        this.constrainToScreen();
    }
    
    // 限制在屏幕范围内
    constrainToScreen() {
        const canvas = GameGlobal.canvas;
        const margin = this.width;
        
        if (this.x < margin) {
            this.x = margin;
            this.moveDirection = Math.PI - this.moveDirection;
        } else if (this.x > canvas.width - margin) {
            this.x = canvas.width - margin;
            this.moveDirection = Math.PI - this.moveDirection;
        }
        
        if (this.y < margin) {
            this.y = margin;
            this.moveDirection = -this.moveDirection;
        } else if (this.y > canvas.height - margin) {
            this.y = canvas.height - margin;
            this.moveDirection = -this.moveDirection;
        }
    }
    
    // 更新收集状态
    updateCollectionState(deltaTime) {
        if (this.isCollected) {
            this.collectionTimer += deltaTime;
            
            // 收集动画
            const progress = this.collectionTimer / this.maxCollectionTime;
            this.scaleOffset = 1 + progress * 2;
            this.opacity = 1 - progress;
            
            if (this.collectionTimer >= this.maxCollectionTime) {
                this.isActive = false;
            }
        }
    }
    
    // 更新视觉效果
    updateVisualEffects(deltaTime) {
        // 根据稀有度调整发光强度
        const rarityMultiplier = {
            'common': 1,
            'uncommon': 1.2,
            'rare': 1.5,
            'epic': 2
        };
        
        this.glowIntensity *= (rarityMultiplier[this.rarity] || 1);
        
        // 更新收集动画
        if (this.animationManager && this.animationManager.type === 'collect') {
            this.animationManager.elapsed += deltaTime;
            const progress = Math.min(this.animationManager.elapsed / this.animationManager.duration, 1);
            
            // 缩放动画
            this.collectAnimation = this.animationManager.startScale + 
                (this.animationManager.endScale - this.animationManager.startScale) * progress;
            
            // 透明度动画
            this.opacity = this.animationManager.startAlpha + 
                (this.animationManager.endAlpha - this.animationManager.startAlpha) * progress;
            
            // 动画完成后移除
            if (progress >= 1) {
                this.animationManager = null;
                this.isActive = false;
            }
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
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 更新闪烁效果
    updateSparkles(deltaTime) {
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const sparkle = this.sparkles[i];
            
            sparkle.life -= deltaTime;
            sparkle.alpha = Math.sin(sparkle.life * sparkle.twinkleSpeed) * (sparkle.life / sparkle.maxLife);
            
            if (sparkle.life <= 0) {
                // 重新生成闪烁
                sparkle.x = this.x + (Math.random() - 0.5) * this.width * 2;
                sparkle.y = this.y + (Math.random() - 0.5) * this.height * 2;
                sparkle.life = sparkle.maxLife;
                sparkle.alpha = 1;
            }
        }
    }
    
    // 更新光环效果
    updateAura(deltaTime) {
        this.aura.forEach(auraParticle => {
            auraParticle.angle += auraParticle.speed * deltaTime;
            auraParticle.pulsePhase += deltaTime * 3;
            
            // 脉冲效果
            const pulse = Math.sin(auraParticle.pulsePhase) * 0.2;
            auraParticle.distance = auraParticle.originalDistance + pulse * 10;
            
            // 更新位置
            auraParticle.x = this.x + this.width / 2 + Math.cos(auraParticle.angle) * auraParticle.distance;
            auraParticle.y = this.y + this.height / 2 + Math.sin(auraParticle.angle) * auraParticle.distance;
        });
    }
    
    // 处理收集
    onCollected(collector) {
        if (this.isCollected) return false;
        
        this.isCollected = true;
        
        // 播放收集动画
        this.playCollectAnimation();
        
        // 创建收集粒子效果
        this.createCollectionParticles();
        
        // 播放收集音效
        this.playCollectionSound();
        
        // 应用道具效果
        this.applyEffect(collector);
        
        console.log(`收集了${this.description}！`);
        
        return true;
    }
    
    // 应用道具效果
    applyEffect(collector) {
        switch (this.effect) {
            case 'attract_fish':
                GameGlobal.GameState.activateBait(this.duration);
                break;
            case 'speed_boost':
                GameGlobal.GameState.activateSpeedBoost(this.duration);
                break;
            case 'score_multiplier':
                GameGlobal.GameState.activateScoreMultiplier(this.value, this.duration);
                break;
            case 'time_extension':
                GameGlobal.GameState.addTime(this.value);
                break;
            case 'rare_fish_boost':
                GameGlobal.GameState.activateRareFishBoost(this.duration);
                break;
            case 'magnetic_hook':
                GameGlobal.GameState.activateMagneticHook(this.duration);
                break;
        }
    }
    
    // 创建收集粒子效果
    createCollectionParticles() {
        for (let i = 0; i < 20; i++) {
            const particle = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200 - 50,
                color: this.sparkleColor,
                size: 2 + Math.random() * 4,
                life: 1 + Math.random() * 0.5,
                maxLife: 1 + Math.random() * 0.5,
                alpha: 1
            };
            
            this.particles.push(particle);
        }
    }
    
    // 播放收集动画
    playCollectAnimation() {
        // 启动收集动画效果
        this.currentAnimation = 'collect';
        this.collectAnimation = 1;
        
        // 创建动画管理器
        this.animationManager = {
            type: 'collect',
            duration: 0.5,
            elapsed: 0,
            startScale: 1,
            endScale: 2,
            startAlpha: 1,
            endAlpha: 0
        };
    }
    
    // 播放收集音效
    playCollectionSound() {
        const soundMap = {
            bait: 'powerup_bait',
            accelerator: 'powerup_speed',
            buff_potion: 'powerup_buff',
            time_bonus: 'powerup_time',
            lucky_charm: 'powerup_lucky',
            magnet: 'powerup_magnet'
        };
        
        const soundName = soundMap[this.type] || 'powerup_collect';
        const sound = GameGlobal.ResourceManager.getSound(soundName);
        
        if (sound) {
            sound.play();
        }
    }
    
    // 摧毁道具
    destroy() {
        this.isActive = false;
        
        // 创建消失粒子效果
        this.createDisappearParticles();
        
        console.log(`${this.description}消失了`);
    }
    
    // 创建消失粒子效果
    createDisappearParticles() {
        for (let i = 0; i < 10; i++) {
            const particle = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                color: this.color,
                size: 1 + Math.random() * 2,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                alpha: 0.5
            };
            
            this.particles.push(particle);
        }
    }
    
    // 检查磁性吸引
    checkMagneticAttraction(hookX, hookY) {
        const distance = GameGlobal.Utils.getDistance(this.x + this.width / 2, this.y + this.height / 2, hookX, hookY);
        
        if (distance <= this.magneticRange) {
            const force = (this.magneticRange - distance) / this.magneticRange;
            const angle = Math.atan2(hookY - (this.y + this.height / 2), hookX - (this.x + this.width / 2));
            
            return {
                fx: Math.cos(angle) * this.magneticStrength * force,
                fy: Math.sin(angle) * this.magneticStrength * force
            };
        }
        
        return null;
    }
    
    // 渲染道具
    render(ctx) {
        if (!this.isActive) {
            // 只渲染粒子效果
            this.drawParticles(ctx);
            return;
        }
        
        // 绘制光环效果
        this.drawAura(ctx);
        
        // 绘制发光效果
        this.drawGlowEffect(ctx);
        
        // 绘制道具主体
        this.drawPowerUpBody(ctx);
        
        // 绘制闪烁效果
        this.drawSparkles(ctx);
        
        // 绘制粒子效果
        this.drawParticles(ctx);
        
        // 绘制磁性范围（调试模式）
        if (GameGlobal.GameConfig.DEBUG_MODE) {
            this.drawMagneticRange(ctx);
            this.drawDebugInfo(ctx);
        }
    }
    
    // 绘制光环效果
    drawAura(ctx) {
        this.aura.forEach(auraParticle => {
            ctx.save();
            ctx.globalAlpha = auraParticle.alpha * this.opacity;
            ctx.fillStyle = auraParticle.color;
            ctx.beginPath();
            ctx.arc(auraParticle.x, auraParticle.y, auraParticle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    // 绘制发光效果
    drawGlowEffect(ctx) {
        ctx.save();
        ctx.globalAlpha = this.glowIntensity * this.opacity;
        
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2 + this.floatOffset, 0,
            this.x + this.width / 2, this.y + this.height / 2 + this.floatOffset, this.width * 1.5
        );
        
        gradient.addColorStop(0, this.glowColor);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.x - this.width, 
            this.y - this.height + this.floatOffset, 
            this.width * 3, 
            this.height * 3
        );
        
        ctx.restore();
    }
    
    // 绘制道具主体
    drawPowerUpBody(ctx) {
        const powerUpImage = GameGlobal.ResourceManager.getImage(`powerup_${this.type}`);
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // 应用变换
        const finalX = this.x + this.width / 2;
        const finalY = this.y + this.height / 2 + this.floatOffset;
        
        ctx.translate(finalX, finalY);
        ctx.rotate(this.rotationOffset);
        
        // 应用脉冲缩放和收集动画
        const finalScale = this.scaleOffset * this.collectAnimation;
        ctx.scale(finalScale, finalScale);
        
        // 绘制光环效果
        if (this.glowRadius > 0 && !this.isCollected) {
            ctx.save();
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.glowRadius);
            gradient.addColorStop(0, `${this.color}40`);
            gradient.addColorStop(1, `${this.color}00`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.glowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        if (powerUpImage) {
            ctx.drawImage(powerUpImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // 备用绘制方案
            this.drawFallbackPowerUp(ctx);
        }
        
        ctx.restore();
    }
    
    // 备用道具绘制
    drawFallbackPowerUp(ctx) {
        switch (this.type) {
            case 'bait':
                this.drawBait(ctx);
                break;
            case 'accelerator':
                this.drawAccelerator(ctx);
                break;
            case 'buff_potion':
                this.drawBuffPotion(ctx);
                break;
            case 'time_bonus':
                this.drawTimeBonus(ctx);
                break;
            case 'lucky_charm':
                this.drawLuckyCharm(ctx);
                break;
            case 'magnet':
                this.drawMagnet(ctx);
                break;
            default:
                this.drawGeneric(ctx);
                break;
        }
    }
    
    // 绘制鱼饵
    drawBait(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加细节
        ctx.fillStyle = '#FF8A50';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制加速器
    drawAccelerator(ctx) {
        ctx.fillStyle = this.color;
        
        // 绘制箭头形状
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制增益药水
    drawBuffPotion(ctx) {
        ctx.fillStyle = this.color;
        
        // 绘制瓶子形状
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
        ctx.fill();
        
        // 绘制瓶口
        ctx.fillStyle = '#7B1FA2';
        ctx.fillRect(-5, -this.height / 2 - 5, 10, 5);
    }
    
    // 绘制时间奖励
    drawTimeBonus(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        
        // 绘制时钟
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制指针
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.height / 3);
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width / 4, 0);
        ctx.stroke();
    }
    
    // 绘制幸运符
    drawLuckyCharm(ctx) {
        ctx.fillStyle = this.color;
        
        // 绘制星形
        const spikes = 5;
        const outerRadius = this.width / 2;
        const innerRadius = outerRadius * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制磁力钩
    drawMagnet(ctx) {
        ctx.fillStyle = this.color;
        
        // 绘制U形磁铁
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width / 3, this.height, 3);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(this.width / 6, -this.height / 2, this.width / 3, this.height, 3);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, this.height / 3, this.width, this.height / 6, 3);
        ctx.fill();
    }
    
    // 绘制通用道具
    drawGeneric(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
        ctx.fill();
    }
    
    // 绘制闪烁效果
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            if (sparkle.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = sparkle.alpha * this.opacity;
                ctx.fillStyle = sparkle.color;
                ctx.beginPath();
                ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
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
    
    // 绘制磁性范围
    drawMagneticRange(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.magneticRange, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    // 绘制调试信息
    drawDebugInfo(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x, this.y - 50, 120, 45);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.description} (${this.rarity})`, this.x + 2, this.y - 40);
        ctx.fillText(`效果: ${this.effect}`, this.x + 2, this.y - 30);
        ctx.fillText(`持续: ${this.duration}s`, this.x + 2, this.y - 20);
        ctx.fillText(`生命: ${(this.maxLifeTime - this.lifeTime).toFixed(1)}s`, this.x + 2, this.y - 10);
    }
    
    // 获取碰撞矩形
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y + this.floatOffset,
            width: this.width,
            height: this.height
        };
    }
    
    // 检查是否在屏幕内
    isOnScreen() {
        const canvas = GameGlobal.canvas;
        return this.x > -this.width && 
               this.x < canvas.width + this.width && 
               this.y > -this.height && 
               this.y < canvas.height + this.height;
    }
    
    // 获取道具信息
    getInfo() {
        return {
            type: this.type,
            description: this.description,
            effect: this.effect,
            duration: this.duration,
            value: this.value,
            rarity: this.rarity,
            isActive: this.isActive,
            lifeTime: this.lifeTime,
            maxLifeTime: this.maxLifeTime
        };
    }
}

// 导出道具类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerUp;
} else {
    window.PowerUp = PowerUp;
}

console.log('道具实体加载完成');