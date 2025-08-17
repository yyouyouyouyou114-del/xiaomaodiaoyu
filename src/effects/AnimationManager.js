// 动画管理器
// 负责管理游戏中的各种动画效果

class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = [];
        this.lastTime = 0;
        
        console.log('AnimationManager 初始化完成');
    }
    
    // 注册动画类型
    registerAnimation(name, animationConfig) {
        this.animations.set(name, animationConfig);
    }
    
    // 创建动画实例
    createAnimation(name, target, options = {}) {
        const config = this.animations.get(name);
        if (!config) {
            console.warn(`动画类型 '${name}' 未找到`);
            return null;
        }
        
        const animation = {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            target: target,
            startTime: Date.now(),
            duration: options.duration || config.duration || 1000,
            easing: options.easing || config.easing || 'linear',
            loop: options.loop || config.loop || false,
            onComplete: options.onComplete || null,
            onUpdate: options.onUpdate || null,
            properties: { ...config.properties, ...options.properties },
            initialValues: {},
            isActive: true
        };
        
        // 保存初始值
        for (let prop in animation.properties) {
            if (target.hasOwnProperty(prop)) {
                animation.initialValues[prop] = target[prop];
            }
        }
        
        this.activeAnimations.push(animation);
        return animation;
    }
    
    // 停止动画
    stopAnimation(animationId) {
        const index = this.activeAnimations.findIndex(anim => anim.id === animationId);
        if (index !== -1) {
            this.activeAnimations.splice(index, 1);
        }
    }
    
    // 停止目标对象的所有动画
    stopAnimationsForTarget(target) {
        this.activeAnimations = this.activeAnimations.filter(anim => anim.target !== target);
    }
    
    // 更新所有动画
    update(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
            const animation = this.activeAnimations[i];
            
            if (!animation.isActive) {
                this.activeAnimations.splice(i, 1);
                continue;
            }
            
            const elapsed = currentTime - animation.startTime;
            let progress = Math.min(elapsed / animation.duration, 1);
            
            // 应用缓动函数
            progress = this.applyEasing(progress, animation.easing);
            
            // 更新属性
            for (let prop in animation.properties) {
                const startValue = animation.initialValues[prop] || 0;
                const endValue = animation.properties[prop];
                const currentValue = startValue + (endValue - startValue) * progress;
                
                if (animation.target.hasOwnProperty(prop)) {
                    animation.target[prop] = currentValue;
                }
            }
            
            // 调用更新回调
            if (animation.onUpdate) {
                animation.onUpdate(animation.target, progress);
            }
            
            // 检查动画是否完成
            if (progress >= 1) {
                if (animation.loop) {
                    // 重新开始动画
                    animation.startTime = currentTime;
                } else {
                    // 动画完成
                    if (animation.onComplete) {
                        animation.onComplete(animation.target);
                    }
                    this.activeAnimations.splice(i, 1);
                }
            }
        }
    }
    
    // 缓动函数
    applyEasing(t, easingType) {
        switch (easingType) {
            case 'linear':
                return t;
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return 1 - (1 - t) * (1 - t);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            case 'bounce':
                if (t < 1 / 2.75) {
                    return 7.5625 * t * t;
                } else if (t < 2 / 2.75) {
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                } else if (t < 2.5 / 2.75) {
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                }
            default:
                return t;
        }
    }
    
    // 预定义动画
    initDefaultAnimations() {
        // 淡入动画
        this.registerAnimation('fadeIn', {
            duration: 500,
            properties: { alpha: 1 },
            easing: 'easeOut'
        });
        
        // 淡出动画
        this.registerAnimation('fadeOut', {
            duration: 500,
            properties: { alpha: 0 },
            easing: 'easeIn'
        });
        
        // 缩放动画
        this.registerAnimation('scale', {
            duration: 300,
            properties: { scaleX: 1.2, scaleY: 1.2 },
            easing: 'easeInOut'
        });
        
        // 弹跳动画
        this.registerAnimation('bounce', {
            duration: 600,
            properties: { y: -50 },
            easing: 'bounce'
        });
        
        // 旋转动画
        this.registerAnimation('rotate', {
            duration: 1000,
            properties: { rotation: 360 },
            easing: 'linear',
            loop: true
        });
        
        // 摇摆动画
        this.registerAnimation('shake', {
            duration: 200,
            properties: { x: 10 },
            easing: 'easeInOut'
        });
    }
    
    // 便捷方法
    fadeIn(target, duration = 500, onComplete = null) {
        target.alpha = 0;
        return this.createAnimation('fadeIn', target, {
            duration: duration,
            onComplete: onComplete
        });
    }
    
    fadeOut(target, duration = 500, onComplete = null) {
        return this.createAnimation('fadeOut', target, {
            duration: duration,
            onComplete: onComplete
        });
    }
    
    scaleTo(target, scaleX, scaleY, duration = 300, onComplete = null) {
        return this.createAnimation('scale', target, {
            duration: duration,
            properties: { scaleX: scaleX, scaleY: scaleY },
            onComplete: onComplete
        });
    }
    
    moveTo(target, x, y, duration = 500, onComplete = null) {
        return this.createAnimation('move', target, {
            duration: duration,
            properties: { x: x, y: y },
            onComplete: onComplete
        });
    }
    
    // 获取活动动画数量
    getActiveAnimationCount() {
        return this.activeAnimations.length;
    }
    
    // 清除所有动画
    clear() {
        this.activeAnimations = [];
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.AnimationManager = AnimationManager;
} else if (typeof global !== 'undefined') {
    global.AnimationManager = AnimationManager;
}

console.log('AnimationManager 类已加载');