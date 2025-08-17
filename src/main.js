// 小猫钓鱼游戏主逻辑文件
// 负责游戏的初始化、场景管理和全局配置

// 游戏环境适配
const isWeChatMiniGame = (typeof wx !== 'undefined') && wx && wx.getSystemInfoSync;
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// 为浏览器环境创建wx对象的占位符
if (isBrowser && typeof wx === 'undefined') {
    window.wx = {
        createInnerAudioContext: function() {
            return new Audio();
        },
        getFileSystemManager: function() {
            return {
                readFile: function() {
                    console.warn('wx.getFileSystemManager not available in browser');
                }
            };
        },
        setStorageSync: function(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        getStorageSync: function(key) {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        },
        onTouchStart: function(callback) {
            console.log('wx.onTouchStart called in browser environment');
        },
        onTouchMove: function(callback) {
            console.log('wx.onTouchMove called in browser environment');
        },
        onTouchEnd: function(callback) {
            console.log('wx.onTouchEnd called in browser environment');
        }
    };
}

// 为浏览器环境创建require占位符
if (isBrowser && typeof require === 'undefined') {
    window.require = function(module) {
        console.warn(`require('${module}') not available in browser environment`);
        return {};
    };
}

// 游戏全局配置
const GameConfig = {
    // 游戏基础设置
    GAME_WIDTH: 750,           // 游戏设计宽度
    GAME_HEIGHT: 1334,         // 游戏设计高度
    
    // 游戏玩法参数
    GAME_TIME: 90,             // 游戏时间（秒）
    FISHING_SPEED: 200,        // 鱼竿下降速度
    FISH_SPAWN_INTERVAL: 2,    // 鱼类生成间隔（秒）
    
    // 分数设置
    FISH_SCORES: {
        small: 10,             // 小鱼分数
        medium: 20,            // 中鱼分数
        large: 50,             // 大鱼分数
        rare: 100              // 稀有鱼分数
    },
    
    // 障碍物扣分
    OBSTACLE_PENALTY: -5,
    
    // 道具效果
    POWER_UPS: {
        bait: 2.0,             // 鱼饵分数倍数
        speed: 0.5,            // 加速器速度倍数
        bonus: 3.0             // 增益药水分数倍数
    }
};

// 游戏状态管理器
const GameState = {
    currentScene: 'MainMenu',
    score: 0,
    highScore: 0,
    timeLeft: GameConfig.GAME_TIME,
    gameMode: 'normal', // 只支持普通模式
    isPaused: false,
    isGameOver: false,
    
    // 道具状态
    powerUps: {
        bait: false,
        speed: false,
        bonus: false
    },
    
    // 重置游戏状态
    reset: function() {
        this.score = 0;
        this.timeLeft = GameConfig.GAME_TIME;
        this.isPaused = false;
        this.isGameOver = false;
        this.powerUps = {
            bait: false,
            speed: false,
            bonus: false
        };
    },
    
    // 添加分数
    addScore: function(points) {
        let finalPoints = points;
        
        // 应用道具效果
        if (this.powerUps.bait && points > 0) {
            finalPoints *= GameConfig.POWER_UPS.bait;
        }
        if (this.powerUps.bonus && points > 0) {
            finalPoints *= GameConfig.POWER_UPS.bonus;
        }
        
        this.score += Math.floor(finalPoints);
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            // 保存到本地存储
            wx.setStorageSync('highScore', this.highScore);
        }
    },
    
    // 加载最高分
    loadHighScore: function() {
        try {
            this.highScore = wx.getStorageSync('highScore') || 0;
        } catch (e) {
            this.highScore = 0;
        }
    }
};

// 场景管理器
const SceneManager = {
    scenes: {},
    
    // 注册场景
    register: function(name, scene) {
        this.scenes[name] = scene;
    },
    
    // 切换场景
    switchTo: function(sceneName) {
        console.log('切换到场景:', sceneName);
        
        // 隐藏当前场景
        if (GameState.currentScene && this.scenes[GameState.currentScene]) {
            this.scenes[GameState.currentScene].hide();
        }
        
        // 显示新场景
        if (this.scenes[sceneName]) {
            this.scenes[sceneName].show();
            GameState.currentScene = sceneName;
        } else {
            console.error('场景不存在:', sceneName);
        }
    }
};

// 资源管理器
const ResourceManager = {
    images: {},
    sounds: {},
    
    // 加载图片资源
    loadImage: function(name, src) {
        return new Promise((resolve, reject) => {
            const img = wx.createImage();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    },
    
    // 加载音频资源
    loadSound: function(name, src) {
        return new Promise((resolve, reject) => {
            if (isWeChatMiniGame && wx && wx.createInnerAudioContext) {
                // 微信小游戏环境
                const audio = wx.createInnerAudioContext();
                audio.src = src;
                audio.onCanplay(() => {
                    this.sounds[name] = audio;
                    resolve(audio);
                });
                audio.onError((err) => {
                    console.warn(`音频加载失败: ${src}`, err);
                    // 创建占位符音频对象
                    const placeholder = {
                        play: () => console.log(`Playing sound: ${name}`),
                        pause: () => console.log(`Pausing sound: ${name}`),
                        stop: () => console.log(`Stopping sound: ${name}`),
                        volume: 1,
                        loop: false
                    };
                    this.sounds[name] = placeholder;
                    resolve(placeholder);
                });
            } else {
                // 浏览器环境
                try {
                    const audio = new Audio();
                    audio.oncanplaythrough = () => {
                        this.sounds[name] = audio;
                        resolve(audio);
                    };
                    audio.onerror = (err) => {
                        console.warn(`音频加载失败: ${src}`, err);
                        // 创建占位符音频对象
                        const placeholder = {
                            play: () => console.log(`Playing sound: ${name}`),
                            pause: () => console.log(`Pausing sound: ${name}`),
                            stop: () => console.log(`Stopping sound: ${name}`),
                            volume: 1,
                            loop: false
                        };
                        this.sounds[name] = placeholder;
                        resolve(placeholder);
                    };
                    audio.src = src;
                } catch (err) {
                    console.warn('音频加载失败:', err);
                    // 创建占位符音频对象
                    const placeholder = {
                        play: () => console.log(`Playing sound: ${name}`),
                        pause: () => console.log(`Pausing sound: ${name}`),
                        stop: () => console.log(`Stopping sound: ${name}`),
                        volume: 1,
                        loop: false
                    };
                    this.sounds[name] = placeholder;
                    resolve(placeholder);
                }
            }
        });
    },
    
    // 获取图片
    getImage: function(name) {
        return this.images[name];
    },
    
    // 获取音频
    getSound: function(name) {
        return this.sounds[name];
    }
};

// 工具函数
const Utils = {
    // 生成随机数
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // 生成随机整数
    randomInt: function(min, max) {
        return Math.floor(this.random(min, max + 1));
    },
    
    // 碰撞检测
    checkCollision: function(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },
    
    // 距离计算
    distance: function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // 角度转弧度
    toRadians: function(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // 弧度转角度
    toDegrees: function(radians) {
        return radians * 180 / Math.PI;
    }
};

// 导出全局对象
if (typeof window !== 'undefined') {
    // 浏览器环境
    window.GameGlobal = window.GameGlobal || {};
    window.GameGlobal.GameConfig = GameConfig;
    window.GameGlobal.GameState = GameState;
    window.GameGlobal.SceneManager = SceneManager;
    window.GameGlobal.ResourceManager = ResourceManager;
    window.GameGlobal.Utils = Utils;
} else if (typeof global !== 'undefined') {
    // Node.js环境
    global.GameGlobal = global.GameGlobal || {};
    global.GameGlobal.GameConfig = GameConfig;
    global.GameGlobal.GameState = GameState;
    global.GameGlobal.SceneManager = SceneManager;
    global.GameGlobal.ResourceManager = ResourceManager;
    global.GameGlobal.Utils = Utils;
} else {
    // 微信小游戏环境
    GameGlobal = GameGlobal || {};
    GameGlobal.GameConfig = GameConfig;
    GameGlobal.GameState = GameState;
    GameGlobal.SceneManager = SceneManager;
    GameGlobal.ResourceManager = ResourceManager;
    GameGlobal.Utils = Utils;
}

// 游戏初始化
function initGame() {
    console.log('初始化小猫钓鱼游戏...');
    
    // 加载最高分
    GameState.loadHighScore();
    
    // 预加载资源
    loadResources().then(() => {
        console.log('资源加载完成，启动游戏');
        
        // 场景文件已通过HTML加载，直接启动主菜单
        console.log('启动主菜单场景');
    }).catch(error => {
        console.error('资源加载失败:', error);
    });
}

// 预加载游戏资源
function loadResources() {
    const promises = [];
    
    // 加载图片资源（使用SVG或简单图形代替）
    const imageResources = {
        'cat': 'images/cat.png',
        'fish_small': 'images/fish_small.png',
        'fish_medium': 'images/fish_medium.png',
        'fish_large': 'images/fish_large.png',
        'fish_rare': 'images/fish_rare.png',
        'obstacle_weed': 'images/obstacle_weed.png',
        'obstacle_trash': 'images/obstacle_trash.png',
        'hook': 'images/hook.png',
        'background': 'images/background.png',
        'ui_button': 'images/ui_button.png'
    };
    
    // 由于是演示，我们先创建简单的占位图片
    for (let name in imageResources) {
        promises.push(createPlaceholderImage(name));
    }
    
    // 暂时禁用音频加载以避免阻塞游戏启动
    // promises.push(ResourceManager.loadSound('bgm', 'audio/bgm.mp3'));
    // promises.push(ResourceManager.loadSound('catch', 'audio/catch.mp3'));
    // promises.push(ResourceManager.loadSound('splash', 'audio/splash.mp3'));
    // promises.push(ResourceManager.loadSound('click', 'audio/click.mp3'));
    
    // 创建占位符音频对象
    ResourceManager.sounds['bgm'] = { play: () => {}, pause: () => {}, stop: () => {} };
    ResourceManager.sounds['catch'] = { play: () => {}, pause: () => {}, stop: () => {} };
    ResourceManager.sounds['splash'] = { play: () => {}, pause: () => {}, stop: () => {} };
    ResourceManager.sounds['click'] = { play: () => {}, pause: () => {}, stop: () => {} };
    
    return Promise.all(promises);
}

// 创建占位图片（用于演示）
function createPlaceholderImage(name) {
    return new Promise((resolve) => {
        try {
            let canvas, ctx;
            
            if (isWeChatMiniGame && wx && wx.createCanvas) {
                // 微信小游戏环境
                canvas = wx.createCanvas();
                ctx = canvas.getContext('2d');
            } else if (isBrowser && document) {
                // 浏览器环境
                canvas = document.createElement('canvas');
                ctx = canvas.getContext('2d');
            } else {
                // 其他环境，创建简单占位对象
                const placeholder = {
                    width: 50,
                    height: 50,
                    placeholder: true
                };
                ResourceManager.images[name] = placeholder;
                resolve(placeholder);
                return;
            }
            
            // 根据不同类型创建不同的占位图
            switch(name) {
                case 'cat':
                    canvas.width = 80;
                    canvas.height = 80;
                    ctx.fillStyle = '#FF6B6B';
                    ctx.fillRect(0, 0, 80, 80);
                    ctx.fillStyle = '#FFF';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('CAT', 40, 45);
                    break;
                    
                case 'fish_small':
                    canvas.width = 40;
                    canvas.height = 30;
                    ctx.fillStyle = '#4ECDC4';
                    ctx.fillRect(0, 0, 40, 30);
                    ctx.fillStyle = '#FFF';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('FISH', 20, 20);
                    break;
                    
                case 'hook':
                    canvas.width = 20;
                    canvas.height = 20;
                    ctx.fillStyle = '#FFD93D';
                    ctx.fillRect(0, 0, 20, 20);
                    ctx.fillStyle = '#000';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('H', 10, 12);
                    break;
                    
                default:
                    canvas.width = 50;
                    canvas.height = 50;
                    ctx.fillStyle = '#95E1D3';
                    ctx.fillRect(0, 0, 50, 50);
                    break;
            }
            
            ResourceManager.images[name] = canvas;
            resolve(canvas);
        } catch (error) {
            console.warn('创建占位图片失败:', error);
            // 返回一个简单的占位对象
            const placeholder = {
                width: 50,
                height: 50,
                placeholder: true
            };
            ResourceManager.images[name] = placeholder;
            resolve(placeholder);
        }
    });
}

// 启动游戏
initGame();

console.log('小猫钓鱼游戏主逻辑加载完成');