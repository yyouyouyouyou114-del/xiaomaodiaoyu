// Cocos Creator适配器
// 为了兼容原有的Cocos Creator代码结构，提供必要的全局对象和方法

// 全局游戏对象
window.GameGlobal = {
    // 游戏配置
    config: {
        debug: true,
        version: '1.0.0',
        gameWidth: 800,
        gameHeight: 600
    },
    
    // 资源管理
    resources: new Map(),
    
    // 音频管理
    audio: null,
    
    // 场景管理
    scene: null,
    
    // Canvas对象
    canvas: null,
    
    // 初始化canvas
    initCanvas: function() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gameCanvas';
            this.canvas.width = this.config.gameWidth;
            this.canvas.height = this.config.gameHeight;
            document.body.appendChild(this.canvas);
        }
        return this.canvas;
    },
    
    // 工具方法
    utils: {
        // 随机数生成
        random: (min, max) => {
            if (max === undefined) {
                max = min;
                min = 0;
            }
            return Math.random() * (max - min) + min;
        },
        
        // 角度转弧度
        degToRad: (deg) => deg * Math.PI / 180,
        
        // 弧度转角度
        radToDeg: (rad) => rad * 180 / Math.PI,
        
        // 距离计算
        distance: (x1, y1, x2, y2) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        // 线性插值
        lerp: (a, b, t) => a + (b - a) * t,
        
        // 限制值在范围内
        clamp: (value, min, max) => Math.max(min, Math.min(max, value))
    }
};

// 资源管理器构造函数
window.ResourceManager = function ResourceManager() {
    this.resources = new Map();
    this.loadingPromises = new Map();
};

// 加载图片资源
window.ResourceManager.prototype.loadImage = async function(path, name) {
    if (this.resources.has(name)) {
        return this.resources.get(name);
    }
    
    if (this.loadingPromises.has(name)) {
        return this.loadingPromises.get(name);
    }
    
    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            this.resources.set(name, img);
            this.loadingPromises.delete(name);
            resolve(img);
        };
        img.onerror = () => {
            this.loadingPromises.delete(name);
            reject(new Error(`Failed to load image: ${path}`));
        };
        img.src = path;
    });
    
    this.loadingPromises.set(name, promise);
    return promise;
};

// 加载音频资源
window.ResourceManager.prototype.loadAudio = async function(path, name) {
    if (this.resources.has(name)) {
        return this.resources.get(name);
    }
    
    if (this.loadingPromises.has(name)) {
        return this.loadingPromises.get(name);
    }
    
    const promise = new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
            this.resources.set(name, audio);
            this.loadingPromises.delete(name);
            resolve(audio);
        };
        audio.onerror = () => {
            this.loadingPromises.delete(name);
            reject(new Error(`Failed to load audio: ${path}`));
        };
        audio.src = path;
    });
    
    this.loadingPromises.set(name, promise);
    return promise;
};

// 获取资源
window.ResourceManager.prototype.getResource = function(name) {
    return this.resources.get(name);
};

// 检查资源是否存在
window.ResourceManager.prototype.hasResource = function(name) {
    return this.resources.has(name);
};

// 批量加载资源
window.ResourceManager.prototype.loadResources = async function(resourceList) {
    const promises = resourceList.map(resource => {
        if (resource.type === 'image') {
            return this.loadImage(resource.path, resource.name);
        } else if (resource.type === 'audio') {
            return this.loadAudio(resource.path, resource.name);
        }
    });
    
    return Promise.all(promises);
};

// 清理资源
window.ResourceManager.prototype.clear = function() {
    this.resources.clear();
    this.loadingPromises.clear();
};

// 场景管理器
window.SceneManager = class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.isTransitioning = false;
    }
    
    // 注册场景
    register(name, scene) {
        this.scenes.set(name, scene);
    }
    
    // 切换场景
    switchTo(sceneName, ...args) {
        if (this.isTransitioning) {
            console.warn('Scene transition in progress');
            return;
        }
        
        const scene = this.scenes.get(sceneName);
        if (!scene) {
            console.error(`Scene not found: ${sceneName}`);
            return;
        }
        
        this.isTransitioning = true;
        
        // 退出当前场景
        if (this.currentScene && this.currentScene.onExit) {
            this.currentScene.onExit();
        }
        
        // 进入新场景
        this.currentScene = scene;
        if (scene.onEnter) {
            scene.onEnter(...args);
        }
        
        this.isTransitioning = false;
        console.log(`Switched to scene: ${sceneName}`);
    }
    
    // 获取当前场景
    getCurrentScene() {
        return this.currentScene;
    }
    
    // 更新当前场景
    update(deltaTime) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime);
        }
    }
    
    // 渲染当前场景
    render(ctx) {
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(ctx);
        }
    }
};

// 输入管理器
window.InputManager = class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Set();
        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            justPressed: false,
            justReleased: false
        };
        this.touch = {
            x: 0,
            y: 0,
            pressed: false,
            justPressed: false,
            justReleased: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => {
            this.updateMousePosition(e);
            this.mouse.pressed = true;
            this.mouse.justPressed = true;
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.updateMousePosition(e);
            this.mouse.pressed = false;
            this.mouse.justReleased = true;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
        });
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.updateTouchPosition(e.touches[0]);
            this.touch.pressed = true;
            this.touch.justPressed = true;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.pressed = false;
            this.touch.justReleased = true;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateTouchPosition(e.touches[0]);
        });
    }
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }
    
    updateTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        this.touch.x = touch.clientX - rect.left;
        this.touch.y = touch.clientY - rect.top;
    }
    
    // 检查按键是否按下
    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }
    
    // 获取鼠标位置
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    // 获取触摸位置
    getTouchPosition() {
        return { x: this.touch.x, y: this.touch.y };
    }
    
    // 更新输入状态（每帧调用）
    update() {
        this.mouse.justPressed = false;
        this.mouse.justReleased = false;
        this.touch.justPressed = false;
        this.touch.justReleased = false;
    }
};

// 导出适配器
window.Adapter = {
    GameGlobal: window.GameGlobal,
    ResourceManager: window.ResourceManager,
    SceneManager: window.SceneManager,
    InputManager: window.InputManager
};

console.log('Cocos Creator Adapter loaded successfully');