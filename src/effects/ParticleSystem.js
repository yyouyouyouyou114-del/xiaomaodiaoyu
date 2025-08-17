/**
 * 粒子系统
 * 负责管理游戏中的各种粒子效果
 */
class ParticleSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // 粒子池
        this.particles = [];
        this.maxParticles = 1000;
        this.particlePool = [];
        
        // 发射器列表
        this.emitters = new Map();
        this.emitterId = 0;
        
        // 预设效果配置
        this.presets = {
            // 气泡效果
            bubbles: {
                count: 5,
                life: 2000,
                size: { min: 2, max: 8 },
                speed: { min: 20, max: 50 },
                direction: { min: 260, max: 280 },
                gravity: -30,
                alpha: { start: 0.8, end: 0 },
                color: ['#87CEEB', '#ADD8E6', '#B0E0E6'],
                shape: 'circle',
                wobble: 2
            },
            
            // 水花效果
            splash: {
                count: 15,
                life: 800,
                size: { min: 1, max: 4 },
                speed: { min: 50, max: 150 },
                direction: { min: 0, max: 360 },
                gravity: 200,
                alpha: { start: 1, end: 0 },
                color: ['#4682B4', '#5F9EA0', '#6495ED'],
                shape: 'circle'
            },
            
            // 得分粒子
            scoreParticle: {
                count: 8,
                life: 1500,
                size: { min: 3, max: 6 },
                speed: { min: 30, max: 80 },
                direction: { min: 60, max: 120 },
                gravity: -50,
                alpha: { start: 1, end: 0 },
                color: ['#FFD700', '#FFA500', '#FF6347'],
                shape: 'star',
                text: '+'
            },
            
            // 庆祝效果
            celebration: {
                count: 30,
                life: 3000,
                size: { min: 2, max: 8 },
                speed: { min: 100, max: 200 },
                direction: { min: 0, max: 360 },
                gravity: 100,
                alpha: { start: 1, end: 0 },
                color: ['#FFD700', '#FF69B4', '#00FF7F', '#FF1493', '#00BFFF'],
                shape: 'confetti'
            },
            
            // 魔法光芒
            magical: {
                count: 12,
                life: 2000,
                size: { min: 1, max: 5 },
                speed: { min: 20, max: 60 },
                direction: { min: 0, max: 360 },
                gravity: 0,
                alpha: { start: 1, end: 0 },
                color: ['#FF69B4', '#9370DB', '#00CED1'],
                shape: 'sparkle',
                glow: true
            },
            
            // 烟雾效果
            smoke: {
                count: 8,
                life: 2500,
                size: { min: 5, max: 15 },
                speed: { min: 10, max: 30 },
                direction: { min: 260, max: 280 },
                gravity: -20,
                alpha: { start: 0.6, end: 0 },
                color: ['#696969', '#778899', '#A9A9A9'],
                shape: 'circle',
                blur: true
            },
            
            // 火花效果
            sparks: {
                count: 20,
                life: 1000,
                size: { min: 1, max: 3 },
                speed: { min: 80, max: 150 },
                direction: { min: 0, max: 360 },
                gravity: 150,
                alpha: { start: 1, end: 0 },
                color: ['#FFA500', '#FF4500', '#FFD700'],
                shape: 'line',
                trail: true
            },
            
            // 治愈光芒
            healing: {
                count: 10,
                life: 1800,
                size: { min: 2, max: 6 },
                speed: { min: 15, max: 40 },
                direction: { min: 0, max: 360 },
                gravity: -30,
                alpha: { start: 0.8, end: 0 },
                color: ['#98FB98', '#90EE90', '#00FF7F'],
                shape: 'plus',
                glow: true
            },
            
            // 雪花效果
            snow: {
                count: 1,
                life: 5000,
                size: { min: 2, max: 6 },
                speed: { min: 20, max: 50 },
                direction: { min: 170, max: 190 },
                gravity: 20,
                alpha: { start: 0.8, end: 0.3 },
                color: ['#FFFFFF', '#F0F8FF'],
                shape: 'snowflake',
                wobble: 1
            }
        };
        
        console.log('粒子系统初始化完成');
    }
    
    /**
     * 创建粒子
     */
    createParticle(config) {
        let particle;
        
        // 从对象池获取粒子
        if (this.particlePool.length > 0) {
            particle = this.particlePool.pop();
        } else {
            particle = {};
        }
        
        // 初始化粒子属性
        particle.x = config.x || 0;
        particle.y = config.y || 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.life = config.life || 1000;
        particle.maxLife = particle.life;
        particle.size = this.randomBetween(config.size.min, config.size.max);
        particle.alpha = config.alpha ? config.alpha.start : 1;
        particle.color = this.randomChoice(config.color);
        particle.shape = config.shape || 'circle';
        particle.rotation = 0;
        particle.rotationSpeed = this.randomBetween(-5, 5);
        
        // 设置速度和方向
        const speed = this.randomBetween(config.speed.min, config.speed.max);
        const direction = this.randomBetween(config.direction.min, config.direction.max);
        const radians = (direction * Math.PI) / 180;
        
        particle.vx = Math.cos(radians) * speed;
        particle.vy = Math.sin(radians) * speed;
        
        // 特殊属性
        particle.gravity = config.gravity || 0;
        particle.wobble = config.wobble || 0;
        particle.wobbleOffset = Math.random() * Math.PI * 2;
        particle.glow = config.glow || false;
        particle.blur = config.blur || false;
        particle.trail = config.trail || false;
        particle.text = config.text || null;
        
        // 透明度变化
        if (config.alpha) {
            particle.alphaStart = config.alpha.start;
            particle.alphaEnd = config.alpha.end;
        } else {
            particle.alphaStart = 1;
            particle.alphaEnd = 0;
        }
        
        // 轨迹记录
        if (particle.trail) {
            particle.trailPoints = [];
        }
        
        return particle;
    }
    
    /**
     * 发射粒子
     */
    emit(x, y, presetName, overrides = {}) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`粒子预设不存在: ${presetName}`);
            return;
        }
        
        const config = { ...preset, ...overrides, x, y };
        
        for (let i = 0; i < config.count; i++) {
            if (this.particles.length >= this.maxParticles) {
                // 移除最老的粒子
                this.removeParticle(0);
            }
            
            const particle = this.createParticle(config);
            this.particles.push(particle);
        }
    }
    
    /**
     * 创建持续发射器
     */
    createEmitter(x, y, presetName, config = {}) {
        const id = ++this.emitterId;
        
        const emitter = {
            id,
            x,
            y,
            presetName,
            config,
            rate: config.rate || 10, // 每秒发射数量
            duration: config.duration || -1, // 持续时间，-1为无限
            lastEmitTime: 0,
            startTime: performance.now(),
            active: true
        };
        
        this.emitters.set(id, emitter);
        return id;
    }
    
    /**
     * 停止发射器
     */
    stopEmitter(id) {
        const emitter = this.emitters.get(id);
        if (emitter) {
            emitter.active = false;
        }
    }
    
    /**
     * 移除发射器
     */
    removeEmitter(id) {
        this.emitters.delete(id);
    }
    
    /**
     * 更新粒子系统
     */
    update(deltaTime) {
        const currentTime = performance.now();
        
        // 更新发射器
        this.updateEmitters(currentTime, deltaTime);
        
        // 更新粒子
        this.updateParticles(deltaTime);
        
        // 清理死亡粒子
        this.cleanupParticles();
    }
    
    /**
     * 更新发射器
     */
    updateEmitters(currentTime, deltaTime) {
        const toRemove = [];
        
        this.emitters.forEach((emitter, id) => {
            if (!emitter.active) {
                toRemove.push(id);
                return;
            }
            
            // 检查持续时间
            if (emitter.duration > 0 && currentTime - emitter.startTime > emitter.duration) {
                toRemove.push(id);
                return;
            }
            
            // 检查发射频率
            const emitInterval = 1000 / emitter.rate;
            if (currentTime - emitter.lastEmitTime > emitInterval) {
                this.emit(emitter.x, emitter.y, emitter.presetName, emitter.config);
                emitter.lastEmitTime = currentTime;
            }
        });
        
        // 移除过期发射器
        toRemove.forEach(id => this.emitters.delete(id));
    }
    
    /**
     * 更新粒子
     */
    updateParticles(deltaTime) {
        const dt = deltaTime / 1000; // 转换为秒
        
        this.particles.forEach(particle => {
            // 更新生命周期
            particle.life -= deltaTime;
            
            // 计算生命周期进度
            const lifeProgress = 1 - (particle.life / particle.maxLife);
            
            // 更新透明度
            particle.alpha = this.lerp(particle.alphaStart, particle.alphaEnd, lifeProgress);
            
            // 应用重力
            if (particle.gravity) {
                particle.vy += particle.gravity * dt;
            }
            
            // 应用摆动效果
            if (particle.wobble) {
                const wobbleX = Math.sin(performance.now() * 0.005 + particle.wobbleOffset) * particle.wobble;
                particle.x += wobbleX * dt;
            }
            
            // 更新位置
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // 更新旋转
            particle.rotation += particle.rotationSpeed * dt;
            
            // 更新轨迹
            if (particle.trail) {
                particle.trailPoints.push({ x: particle.x, y: particle.y, alpha: particle.alpha });
                
                // 限制轨迹点数量
                if (particle.trailPoints.length > 10) {
                    particle.trailPoints.shift();
                }
            }
        });
    }
    
    /**
     * 清理死亡粒子
     */
    cleanupParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].life <= 0) {
                this.removeParticle(i);
            }
        }
    }
    
    /**
     * 移除粒子
     */
    removeParticle(index) {
        const particle = this.particles[index];
        if (particle) {
            // 重置粒子属性并放回对象池
            this.resetParticle(particle);
            this.particlePool.push(particle);
            
            // 从活跃列表中移除
            this.particles.splice(index, 1);
        }
    }
    
    /**
     * 重置粒子
     */
    resetParticle(particle) {
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.life = 0;
        particle.alpha = 1;
        particle.rotation = 0;
        particle.trailPoints = null;
    }
    
    /**
     * 渲染粒子系统
     */
    render() {
        this.particles.forEach(particle => {
            this.renderParticle(particle);
        });
    }
    
    /**
     * 渲染单个粒子
     */
    renderParticle(particle) {
        if (particle.alpha <= 0) return;
        
        this.ctx.save();
        
        // 设置透明度
        this.ctx.globalAlpha = particle.alpha;
        
        // 设置发光效果
        if (particle.glow) {
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = particle.size * 2;
        }
        
        // 设置模糊效果
        if (particle.blur) {
            this.ctx.filter = 'blur(1px)';
        }
        
        // 移动到粒子位置
        this.ctx.translate(particle.x, particle.y);
        
        // 旋转
        if (particle.rotation) {
            this.ctx.rotate(particle.rotation);
        }
        
        // 渲染轨迹
        if (particle.trail && particle.trailPoints) {
            this.renderTrail(particle);
        }
        
        // 设置颜色
        this.ctx.fillStyle = particle.color;
        this.ctx.strokeStyle = particle.color;
        
        // 根据形状渲染
        switch (particle.shape) {
            case 'circle':
                this.renderCircle(particle);
                break;
            case 'star':
                this.renderStar(particle);
                break;
            case 'confetti':
                this.renderConfetti(particle);
                break;
            case 'sparkle':
                this.renderSparkle(particle);
                break;
            case 'line':
                this.renderLine(particle);
                break;
            case 'plus':
                this.renderPlus(particle);
                break;
            case 'snowflake':
                this.renderSnowflake(particle);
                break;
            default:
                this.renderCircle(particle);
        }
        
        // 渲染文字
        if (particle.text) {
            this.renderText(particle);
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染轨迹
     */
    renderTrail(particle) {
        if (particle.trailPoints.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(
            particle.trailPoints[0].x - particle.x,
            particle.trailPoints[0].y - particle.y
        );
        
        for (let i = 1; i < particle.trailPoints.length; i++) {
            const point = particle.trailPoints[i];
            this.ctx.lineTo(point.x - particle.x, point.y - particle.y);
        }
        
        this.ctx.lineWidth = particle.size * 0.5;
        this.ctx.stroke();
    }
    
    /**
     * 渲染圆形
     */
    renderCircle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 渲染星形
     */
    renderStar(particle) {
        const spikes = 5;
        const outerRadius = particle.size;
        const innerRadius = particle.size * 0.5;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * 渲染彩纸
     */
    renderConfetti(particle) {
        const width = particle.size;
        const height = particle.size * 0.6;
        
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
    }
    
    /**
     * 渲染闪光
     */
    renderSparkle(particle) {
        const size = particle.size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-size, 0);
        this.ctx.lineTo(size, 0);
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(0, size);
        this.ctx.moveTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(size * 0.7, size * 0.7);
        this.ctx.moveTo(-size * 0.7, size * 0.7);
        this.ctx.lineTo(size * 0.7, -size * 0.7);
        
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    /**
     * 渲染线条
     */
    renderLine(particle) {
        const length = particle.size * 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-length / 2, 0);
        this.ctx.lineTo(length / 2, 0);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * 渲染加号
     */
    renderPlus(particle) {
        const size = particle.size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-size, 0);
        this.ctx.lineTo(size, 0);
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(0, size);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * 渲染雪花
     */
    renderSnowflake(particle) {
        const size = particle.size;
        const branches = 6;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < branches; i++) {
            const angle = (i * Math.PI * 2) / branches;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(x, y);
            
            // 添加分支
            const branchSize = size * 0.3;
            const branchAngle1 = angle + Math.PI / 6;
            const branchAngle2 = angle - Math.PI / 6;
            
            this.ctx.moveTo(x * 0.7, y * 0.7);
            this.ctx.lineTo(
                x * 0.7 + Math.cos(branchAngle1) * branchSize,
                y * 0.7 + Math.sin(branchAngle1) * branchSize
            );
            
            this.ctx.moveTo(x * 0.7, y * 0.7);
            this.ctx.lineTo(
                x * 0.7 + Math.cos(branchAngle2) * branchSize,
                y * 0.7 + Math.sin(branchAngle2) * branchSize
            );
        }
        
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    /**
     * 渲染文字
     */
    renderText(particle) {
        this.ctx.font = `${particle.size * 2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(particle.text, 0, 0);
    }
    
    /**
     * 工具函数：随机数
     */
    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * 工具函数：随机选择
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * 工具函数：线性插值
     */
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }
    
    /**
     * 清除所有粒子
     */
    clear() {
        // 将所有粒子放回对象池
        this.particles.forEach(particle => {
            this.resetParticle(particle);
            this.particlePool.push(particle);
        });
        
        this.particles = [];
        this.emitters.clear();
    }
    
    /**
     * 获取粒子统计信息
     */
    getStats() {
        return {
            activeParticles: this.particles.length,
            pooledParticles: this.particlePool.length,
            activeEmitters: this.emitters.size,
            maxParticles: this.maxParticles
        };
    }
    
    /**
     * 设置最大粒子数
     */
    setMaxParticles(max) {
        this.maxParticles = max;
        
        // 如果当前粒子数超过限制，移除多余的
        while (this.particles.length > this.maxParticles) {
            this.removeParticle(0);
        }
    }
}

// 导出粒子系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
} else {
    window.ParticleSystem = ParticleSystem;
}