// 微信小游戏适配器
// 用于适配微信小游戏环境，提供必要的全局对象和方法

// 创建canvas对象
GameGlobal.canvas = wx.createCanvas();

// 获取设备信息
const systemInfo = wx.getSystemInfoSync();

// 设置canvas尺寸
GameGlobal.canvas.width = systemInfo.screenWidth;
GameGlobal.canvas.height = systemInfo.screenHeight;

// 适配全局对象
GameGlobal.document = {
    createElement: function(tagName) {
        if (tagName === 'canvas') {
            return wx.createCanvas();
        }
        return {};
    },
    
    getElementById: function() {
        return GameGlobal.canvas;
    },
    
    body: {
        appendChild: function() {}
    }
};

// 适配window对象
GameGlobal.window = GameGlobal;
GameGlobal.self = GameGlobal;

// 适配navigator对象
GameGlobal.navigator = {
    userAgent: 'WeChat MiniGame',
    language: 'zh-CN'
};

// 适配location对象
GameGlobal.location = {
    href: '',
    search: ''
};

// 适配XMLHttpRequest
GameGlobal.XMLHttpRequest = function() {
    return wx.request;
};

// 适配Image对象
GameGlobal.Image = function() {
    return wx.createImage();
};

// 适配Audio对象
GameGlobal.Audio = function() {
    return wx.createInnerAudioContext();
};

// 适配localStorage
GameGlobal.localStorage = {
    getItem: function(key) {
        return wx.getStorageSync(key);
    },
    
    setItem: function(key, value) {
        wx.setStorageSync(key, value);
    },
    
    removeItem: function(key) {
        wx.removeStorageSync(key);
    },
    
    clear: function() {
        wx.clearStorageSync();
    }
};

// 适配setTimeout和setInterval
GameGlobal.setTimeout = setTimeout;
GameGlobal.setInterval = setInterval;
GameGlobal.clearTimeout = clearTimeout;
GameGlobal.clearInterval = clearInterval;

// 适配requestAnimationFrame
GameGlobal.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 1000 / 60);
};

GameGlobal.cancelAnimationFrame = function(id) {
    clearTimeout(id);
};

// 触摸事件适配
GameGlobal.canvas.addEventListener = function(type, listener) {
    if (type === 'touchstart') {
        wx.onTouchStart(listener);
    } else if (type === 'touchmove') {
        wx.onTouchMove(listener);
    } else if (type === 'touchend') {
        wx.onTouchEnd(listener);
    } else if (type === 'touchcancel') {
        wx.onTouchCancel(listener);
    }
};

// 控制台输出适配
GameGlobal.console = console;

console.log('微信小游戏适配器加载完成');