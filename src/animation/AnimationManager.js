/**
 * 动画管理器
 * 负责管理游戏中的所有动画效果
 */
class AnimationManager {
    constructor() {
        // 动画队列
        this.animations = new Map();
        this.animationId = 0;
        
        // 缓动函数
        this.easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
            easeOutSine: t => Math.sin(t * Math.PI / 2),
            easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeInOutExpo: t => {
                if (t === 0) return 0;
                if (t === 1) return 1;
                if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
                return (2 - Math.pow(2, -20 * t + 10)) / 2;
            },
            easeInCirc: t => 1 - Math.sqrt(1 - t * t),
            easeOutCirc: t => Math.sqrt(1 - (t - 1) * (t - 1)),
            easeInOutCirc: t => {
                if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
                return (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
            },
            easeInBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return c3 * t * t * t - c1 * t * t;
            },
            easeOutBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeInOutBack: t => {
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                if (t < 0.5) {
                    return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
                }
                return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
            },
            easeInElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                if (t === 0) return 0;
                if (t === 1) return 1;
                return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            easeOutElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                if (t === 0) return 0;
                if (t === 1) return 1;
                return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeInOutElastic: t => {
                const c5 = (2 * Math.PI) / 4.5;
                if (t === 0) return 0;
                if (t === 1) return 1;
                if (t < 0.5) {
                    return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
                }
                return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
            },
            easeInBounce: t => 1 - this.easingFunctions.easeOutBounce(1 - t),
            easeOutBounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            },
            easeInOutBounce: t => {
                if (t < 0.5) {
                    return (1 - this.easingFunctions.easeOutBounce(1 - 2 * t)) / 2;
                }
                return (1 + this.easingFunctions.easeOutBounce(2 * t - 1)) / 2;
            }
        };
        
        // 预定义动画模板
        this.animationTemplates = {
            // 淡入淡出
            fadeIn: {
                duration: 500,
                easing: 'easeOutQuad',
                from: { alpha: 0 },
                to: { alpha: 1 }
            },
            fadeOut: {
                duration: 500,
                easing: 'easeInQuad',
                from: { alpha: 1 },
                to: { alpha: 0 }
            },
            
            // 缩放动画
            scaleIn: {
                duration: 300,
                easing: 'easeOutBack',
                from: { scaleX: 0, scaleY: 0 },
                to: { scaleX: 1, scaleY: 1 }
            },
            scaleOut: {
                duration: 200,
                easing: 'easeInBack',
                from: { scaleX: 1, scaleY: 1 },
                to: { scaleX: 0, scaleY: 0 }
            },
            
            // 弹跳动画
            bounce: {
                duration: 600,
                easing: 'easeOutBounce',
                from: { y: 0 },
                to: { y: -50 },
                yoyo: true
            },
            
            // 摇摆动画
            shake: {
                duration: 500,
                easing: 'easeInOutQuad',
                keyframes: [
                    { time: 0, x: 0 },
                    { time: 0.1, x: -10 },
                    { time: 0.2, x: 10 },
                    { time: 0.3, x: -8 },
                    { time: 0.4, x: 8 },
                    { time: 0.5, x: -6 },
                    { time: 0.6, x: 6 },
                    { time: 0.7, x: -4 },
                    { time: 0.8, x: 4 },
                    { time: 0.9, x: -2 },
                    { time: 1, x: 0 }
                ]
            },
            
            // 脉冲动画
            pulse: {
                duration: 1000,
                easing: 'easeInOutSine',
                from: { scaleX: 1, scaleY: 1 },
                to: { scaleX: 1.1, scaleY: 1.1 },
                yoyo: true,
                repeat: -1
            },
            
            // 旋转动画
            rotate: {
                duration: 1000,
                easing: 'linear',
                from: { rotation: 0 },
                to: { rotation: 360 },
                repeat: -1
            },
            
            // 滑入动画
            slideInLeft: {
                duration: 400,
                easing: 'easeOutQuart',
                from: { x: -100, alpha: 0 },
                to: { x: 0, alpha: 1 }
            },
            slideInRight: {
                duration: 400,
                easing: 'easeOutQuart',
                from: { x: 100, alpha: 0 },
                to: { x: 0, alpha: 1 }
            },
            slideInUp: {
                duration: 400,
                easing: 'easeOutQuart',
                from: { y: 100, alpha: 0 },
                to: { y: 0, alpha: 1 }
            },
            slideInDown: {
                duration: 400,
                easing: 'easeOutQuart',
                from: { y: -100, alpha: 0 },
                to: { y: 0, alpha: 1 }
            }
        };
        
        console.log('动画管理器初始化完成');
    }
    
    /**
     * 创建动画
     */
    createAnimation(target, config) {
        const id = ++this.animationId;
        
        // 合并配置
        const animation = {
            id,
            target,
            startTime: performance.now(),
            duration: config.duration || 1000,
            easing: config.easing || 'linear',
            delay: config.delay || 0,
            repeat: config.repeat || 0,
            yoyo: config.yoyo || false,
            autoStart: config.autoStart !== false,
            
            // 动画属性
            from: config.from || {},
            to: config.to || {},
            keyframes: config.keyframes || null,
            
            // 回调函数
            onStart: config.onStart || null,
            onUpdate: config.onUpdate || null,
            onComplete: config.onComplete || null,
            onRepeat: config.onRepeat || null,
            
            // 内部状态
            isPlaying: false,
            isPaused: false,
            currentTime: 0,
            repeatCount: 0,
            isYoyoReverse: false,
            initialValues: {},
            
            // 保存目标对象的初始值
            saveInitialValues: () => {
                const props = Object.keys({ ...animation.from, ...animation.to });
                props.forEach(prop => {
                    if (target.hasOwnProperty(prop)) {
                        animation.initialValues[prop] = target[prop];
                    }
                });
            }
        };
        
        // 保存初始值
        animation.saveInitialValues();
        
        // 设置起始值
        Object.keys(animation.from).forEach(prop => {
            if (target.hasOwnProperty(prop)) {
                target[prop] = animation.from[prop];
            }
        });
        
        // 添加到动画队列
        this.animations.set(id, animation);
        
        // 自动开始
        if (animation.autoStart) {
            this.startAnimation(id);
        }
        
        return id;
    }
    
    /**
     * 使用模板创建动画
     */
    createAnimationFromTemplate(target, templateName, overrides = {}) {
        const template = this.animationTemplates[templateName];
        if (!template) {
            console.warn(`动画模板不存在: ${templateName}`);
            return null;
        }
        
        const config = { ...template, ...overrides };
        return this.createAnimation(target, config);
    }
    
    /**
     * 开始动画
     */
    startAnimation(id) {
        const animation = this.animations.get(id);
        if (!animation) return false;
        
        animation.isPlaying = true;
        animation.isPaused = false;
        animation.startTime = performance.now() + animation.delay;
        
        if (animation.onStart) {
            animation.onStart(animation.target);
        }
        
        return true;
    }
    
    /**
     * 暂停动画
     */
    pauseAnimation(id) {
        const animation = this.animations.get(id);
        if (!animation) return false;
        
        animation.isPaused = true;
        return true;
    }
    
    /**
     * 恢复动画
     */
    resumeAnimation(id) {
        const animation = this.animations.get(id);
        if (!animation) return false;
        
        animation.isPaused = false;
        return true;
    }
    
    /**
     * 停止动画
     */
    stopAnimation(id) {
        const animation = this.animations.get(id);
        if (!animation) return false;
        
        animation.isPlaying = false;
        
        if (animation.onComplete) {
            animation.onComplete(animation.target);
        }
        
        this.animations.delete(id);
        return true;
    }
    
    /**
     * 停止目标对象的所有动画
     */
    stopAnimationsForTarget(target) {
        const toRemove = [];
        
        this.animations.forEach((animation, id) => {
            if (animation.target === target) {
                toRemove.push(id);
            }
        });
        
        toRemove.forEach(id => this.stopAnimation(id));
        return toRemove.length;
    }
    
    /**
     * 更新所有动画
     */
    update(deltaTime) {
        const currentTime = performance.now();
        const toRemove = [];
        
        this.animations.forEach((animation, id) => {
            if (!animation.isPlaying || animation.isPaused) return;
            
            // 检查延迟
            if (currentTime < animation.startTime) return;
            
            // 计算动画进度
            const elapsed = currentTime - animation.startTime;
            let progress = Math.min(elapsed / animation.duration, 1);
            
            // 应用缓动函数
            const easingFunc = this.easingFunctions[animation.easing] || this.easingFunctions.linear;
            let easedProgress = easingFunc(progress);
            
            // 处理yoyo效果
            if (animation.yoyo && animation.isYoyoReverse) {
                easedProgress = 1 - easedProgress;
            }
            
            // 更新动画属性
            this.updateAnimationProperties(animation, easedProgress);
            
            // 调用更新回调
            if (animation.onUpdate) {
                animation.onUpdate(animation.target, easedProgress);
            }
            
            // 检查动画是否完成
            if (progress >= 1) {
                this.handleAnimationComplete(animation, id, toRemove);
            }
        });
        
        // 移除已完成的动画
        toRemove.forEach(id => this.animations.delete(id));
    }
    
    /**
     * 更新动画属性
     */
    updateAnimationProperties(animation, progress) {
        if (animation.keyframes) {
            // 关键帧动画
            this.updateKeyframeAnimation(animation, progress);
        } else {
            // 普通补间动画
            this.updateTweenAnimation(animation, progress);
        }
    }
    
    /**
     * 更新关键帧动画
     */
    updateKeyframeAnimation(animation, progress) {
        const keyframes = animation.keyframes;
        const target = animation.target;
        
        // 找到当前进度对应的关键帧
        let currentFrame = null;
        let nextFrame = null;
        
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
                currentFrame = keyframes[i];
                nextFrame = keyframes[i + 1];
                break;
            }
        }
        
        if (!currentFrame || !nextFrame) {
            // 使用最后一帧
            currentFrame = keyframes[keyframes.length - 1];
            Object.keys(currentFrame).forEach(prop => {
                if (prop !== 'time' && target.hasOwnProperty(prop)) {
                    target[prop] = currentFrame[prop];
                }
            });
            return;
        }
        
        // 计算帧间进度
        const frameProgress = (progress - currentFrame.time) / (nextFrame.time - currentFrame.time);
        
        // 插值计算
        Object.keys(currentFrame).forEach(prop => {
            if (prop === 'time') return;
            
            if (target.hasOwnProperty(prop) && nextFrame.hasOwnProperty(prop)) {
                const startValue = currentFrame[prop];
                const endValue = nextFrame[prop];
                target[prop] = this.interpolate(startValue, endValue, frameProgress);
            }
        });
    }
    
    /**
     * 更新补间动画
     */
    updateTweenAnimation(animation, progress) {
        const target = animation.target;
        const from = animation.from;
        const to = animation.to;
        
        // 更新所有动画属性
        Object.keys(to).forEach(prop => {
            if (target.hasOwnProperty(prop)) {
                const startValue = from[prop] !== undefined ? from[prop] : animation.initialValues[prop] || 0;
                const endValue = to[prop];
                target[prop] = this.interpolate(startValue, endValue, progress);
            }
        });
    }
    
    /**
     * 插值计算
     */
    interpolate(start, end, progress) {
        if (typeof start === 'number' && typeof end === 'number') {
            return start + (end - start) * progress;
        }
        
        // 处理颜色插值
        if (typeof start === 'string' && typeof end === 'string') {
            if (start.startsWith('#') && end.startsWith('#')) {
                return this.interpolateColor(start, end, progress);
            }
        }
        
        // 其他类型直接返回结束值
        return progress >= 1 ? end : start;
    }
    
    /**
     * 颜色插值
     */
    interpolateColor(startColor, endColor, progress) {
        const start = this.hexToRgb(startColor);
        const end = this.hexToRgb(endColor);
        
        if (!start || !end) return endColor;
        
        const r = Math.round(start.r + (end.r - start.r) * progress);
        const g = Math.round(start.g + (end.g - start.g) * progress);
        const b = Math.round(start.b + (end.b - start.b) * progress);
        
        return this.rgbToHex(r, g, b);
    }
    
    /**
     * 十六进制颜色转RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * RGB转十六进制颜色
     */
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * 处理动画完成
     */
    handleAnimationComplete(animation, id, toRemove) {
        // 处理重复
        if (animation.repeat !== 0) {
            animation.repeatCount++;
            
            // 检查是否还需要重复
            if (animation.repeat === -1 || animation.repeatCount < animation.repeat) {
                // 重置动画
                animation.startTime = performance.now();
                
                // 处理yoyo效果
                if (animation.yoyo) {
                    animation.isYoyoReverse = !animation.isYoyoReverse;
                }
                
                // 调用重复回调
                if (animation.onRepeat) {
                    animation.onRepeat(animation.target, animation.repeatCount);
                }
                
                return; // 不移除动画
            }
        }
        
        // 动画完成
        animation.isPlaying = false;
        
        if (animation.onComplete) {
            animation.onComplete(animation.target);
        }
        
        toRemove.push(id);
    }
    
    /**
     * 创建动画序列
     */
    createSequence(target, animations) {
        const sequence = {
            target,
            animations: [...animations],
            currentIndex: 0,
            isPlaying: false,
            onComplete: null
        };
        
        const playNext = () => {
            if (sequence.currentIndex >= sequence.animations.length) {
                // 序列完成
                if (sequence.onComplete) {
                    sequence.onComplete(target);
                }
                return;
            }
            
            const animConfig = sequence.animations[sequence.currentIndex];
            animConfig.onComplete = (target) => {
                sequence.currentIndex++;
                playNext();
            };
            
            this.createAnimation(target, animConfig);
        };
        
        return {
            play: () => {
                sequence.isPlaying = true;
                sequence.currentIndex = 0;
                playNext();
            },
            onComplete: (callback) => {
                sequence.onComplete = callback;
            }
        };
    }
    
    /**
     * 创建并行动画组
     */
    createGroup(animations) {
        const group = {
            animations: [...animations],
            completedCount: 0,
            onComplete: null
        };
        
        return {
            play: () => {
                group.completedCount = 0;
                
                group.animations.forEach(({ target, config }) => {
                    const originalOnComplete = config.onComplete;
                    config.onComplete = (target) => {
                        if (originalOnComplete) {
                            originalOnComplete(target);
                        }
                        
                        group.completedCount++;
                        if (group.completedCount >= group.animations.length) {
                            if (group.onComplete) {
                                group.onComplete();
                            }
                        }
                    };
                    
                    this.createAnimation(target, config);
                });
            },
            onComplete: (callback) => {
                group.onComplete = callback;
            }
        };
    }
    
    /**
     * 获取动画状态
     */
    getAnimationStatus(id) {
        const animation = this.animations.get(id);
        if (!animation) return null;
        
        return {
            id: animation.id,
            isPlaying: animation.isPlaying,
            isPaused: animation.isPaused,
            progress: animation.currentTime / animation.duration,
            repeatCount: animation.repeatCount
        };
    }
    
    /**
     * 获取所有动画状态
     */
    getAllAnimations() {
        const result = [];
        this.animations.forEach((animation, id) => {
            result.push(this.getAnimationStatus(id));
        });
        return result;
    }
    
    /**
     * 清除所有动画
     */
    clear() {
        this.animations.forEach((animation, id) => {
            if (animation.onComplete) {
                animation.onComplete(animation.target);
            }
        });
        
        this.animations.clear();
        this.animationId = 0;
    }
    
    /**
     * 暂停所有动画
     */
    pauseAll() {
        this.animations.forEach(animation => {
            animation.isPaused = true;
        });
    }
    
    /**
     * 恢复所有动画
     */
    resumeAll() {
        this.animations.forEach(animation => {
            animation.isPaused = false;
        });
    }
    
    /**
     * 获取动画统计信息
     */
    getStats() {
        let playing = 0;
        let paused = 0;
        let total = this.animations.size;
        
        this.animations.forEach(animation => {
            if (animation.isPlaying) {
                if (animation.isPaused) {
                    paused++;
                } else {
                    playing++;
                }
            }
        });
        
        return {
            total,
            playing,
            paused,
            stopped: total - playing - paused
        };
    }
}

// 导出动画管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
} else {
    window.AnimationManager = AnimationManager;
}