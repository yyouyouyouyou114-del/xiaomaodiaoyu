# 小猫钓鱼游戏

一个基于HTML5 Canvas和JavaScript开发的休闲钓鱼游戏。

## 游戏特色

- 🐱 可爱的小猫角色
- 🎣 简单易上手的钓鱼玩法
- 🎵 背景音乐和音效
- 📱 支持移动端和桌面端
- 🎮 流畅的游戏体验

## 技术栈

- HTML5 Canvas
- JavaScript (ES6+)
- CSS3
- Web Audio API

## 项目结构

```
小猫钓鱼/
├── index.html          # 主游戏页面
├── src/                # 源代码目录
│   ├── entities/       # 游戏实体类
│   │   ├── Cat.js      # 小猫角色
│   │   ├── Fish.js     # 鱼类
│   │   └── ...
│   ├── scenes/         # 游戏场景
│   │   ├── GameScene.js
│   │   └── ...
│   ├── systems/        # 游戏系统
│   └── ...
├── images/             # 游戏图片资源
├── audio/              # 音频文件
└── README.md           # 项目说明
```

## 如何运行

1. 克隆或下载项目到本地
2. 使用本地服务器运行项目（推荐使用Python的http.server）
   ```bash
   python -m http.server 8000
   ```
3. 在浏览器中访问 `http://localhost:8000/index.html`

## 游戏玩法

1. 点击"开始游戏"按钮开始游戏
2. 点击屏幕投掷鱼竿
3. 尝试钓到更多的鱼获得高分
4. 避开障碍物

## 开发日志

- v3.0: 优化小猫位置，改善移动端体验
- v2.0: 完善游戏功能，添加音效
- v1.0: 基础游戏框架和核心玩法

## 许可证

MIT License