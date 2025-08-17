// 小猫钓鱼游戏主入口文件
// 这是微信小游戏的启动文件，负责初始化游戏引擎和启动游戏

// 引入适配器，确保Cocos Creator能在微信小游戏环境中正常运行
require('./adapter');

// 引入Cocos Creator引擎
require('./cocos2d-js-min.js');

// 引入游戏主逻辑
require('./src/main.js');

// 游戏启动配置
const gameConfig = {
    // 游戏名称
    gameName: '小猫钓鱼',
    
    // 游戏版本
    version: '1.0.0',
    
    // 屏幕适配模式
    fitHeight: true,
    fitWidth: true,
    
    // 调试模式
    debugMode: cc.debug.DebugMode.INFO,
    
    // 显示FPS
    showFPS: false,
    
    // 帧率
    frameRate: 60,
    
    // 渲染模式
    renderMode: 0, // 自动选择渲染模式
    
    // 场景列表
    scenes: [
        'MainMenu',    // 主菜单场景
        'GameScene',   // 游戏场景
        'GameOver'     // 游戏结束场景
    ]
};

// 启动游戏
cc.game.run(gameConfig, function() {
    console.log('小猫钓鱼游戏启动成功！');
    
    // 加载第一个场景（主菜单）
    cc.director.loadScene('MainMenu');
});