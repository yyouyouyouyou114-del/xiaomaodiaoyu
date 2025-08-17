// 生成器系统
// 负责鱼群、障碍物和道具的生成与管理

class Spawner {
    constructor() {
        // 生成配置
        this.fishSpawnConfig = {
            baseInterval: 2.0,      // 基础生成间隔（秒）
            minInterval: 0.5,       // 最小生成间隔
            maxInterval: 4.0,       // 最大生成间隔
            spawnRate: 1.0,         // 生成速率倍数
            maxFish: 15,            // 最大鱼数量
            schoolChance: 0.3,      // 鱼群生成概率
            schoolSize: { min: 3, max: 6 }, // 鱼群大小
            rareFishChance: 0.1     // 稀有鱼概率
        };
        
        this.obstacleSpawnConfig = {
            baseInterval: 3.0,      // 基础生成间隔
            minInterval: 1.0,       // 最小生成间隔
            maxInterval: 6.0,       // 最大生成间隔
            spawnRate: 1.0,         // 生成速率倍数
            maxObstacles: 8,        // 最大障碍物数量
            typeWeights: {          // 类型权重
                weed: 0.4,
                trash: 0.2,
                rock: 0.15,
                coral: 0.15,
                seaweed: 0.1
            }
        };
        
        this.powerUpSpawnConfig = {
            baseInterval: 15.0,     // 基础生成间隔
            minInterval: 8.0,       // 最小生成间隔
            maxInterval: 25.0,      // 最大生成间隔
            spawnRate: 1.0,         // 生成速率倍数
            maxPowerUps: 3,         // 最大道具数量
            typeWeights: {          // 类型权重
                bait: 0.3,
                accelerator: 0.25,
                buff_potion: 0.15,
                time_bonus: 0.15,
                lucky_charm: 0.1,
                magnet: 0.05
            }
        };
        
        // 生成计时器
        this.fishSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // 生成间隔
        this.fishSpawnInterval = this.fishSpawnConfig.baseInterval;
        this.obstacleSpawnInterval = this.obstacleSpawnConfig.baseInterval;
        this.powerUpSpawnInterval = this.powerUpSpawnConfig.baseInterval;
        
        // 实体数组
        this.fish = [];
        this.obstacles = [];
        this.powerUps = [];
        
        // 生成区域
        this.spawnAreas = this.setupSpawnAreas();
        
        // 难度相关
        this.difficultyLevel = 1;
        this.gameTime = 0;
        
        // 特殊事件
        this.events = {
            fishFrenzy: { active: false, timer: 0, duration: 10 },
            obstacleStorm: { active: false, timer: 0, duration: 8 },
            powerUpRain: { active: false, timer: 0, duration: 12 }
        };
        
        // 统计信息
        this.stats = {
            totalFishSpawned: 0,
            totalObstaclesSpawned: 0,
            totalPowerUpsSpawned: 0,
            fishByType: {},
            obstaclesByType: {},
            powerUpsByType: {}
        };
        
        this.init();
    }
    
    // 设置生成区域
    setupSpawnAreas() {
        const canvas = GameGlobal.canvas;
        
        return {
            fish: {
                left: { x: -100, y: canvas.height * 0.3, width: 50, height: canvas.height * 0.4 },
                right: { x: canvas.width + 50, y: canvas.height * 0.3, width: 50, height: canvas.height * 0.4 },
                bottom: { x: canvas.width * 0.2, y: canvas.height + 50, width: canvas.width * 0.6, height: 50 },
                deep: { x: canvas.width * 0.1, y: canvas.height * 0.7, width: canvas.width * 0.8, height: canvas.height * 0.2 }
            },
            obstacles: {
                shallow: { x: canvas.width * 0.1, y: canvas.height * 0.2, width: canvas.width * 0.8, height: canvas.height * 0.3 },
                medium: { x: canvas.width * 0.15, y: canvas.height * 0.4, width: canvas.width * 0.7, height: canvas.height * 0.3 },
                deep: { x: canvas.width * 0.2, y: canvas.height * 0.6, width: canvas.width * 0.6, height: canvas.height * 0.3 }
            },
            powerUps: {
                surface: { x: canvas.width * 0.1, y: canvas.height * 0.1, width: canvas.width * 0.8, height: canvas.height * 0.2 },
                middle: { x: canvas.width * 0.15, y: canvas.height * 0.3, width: canvas.width * 0.7, height: canvas.height * 0.4 },
                deep: { x: canvas.width * 0.2, y: canvas.height * 0.6, width: canvas.width * 0.6, height: canvas.height * 0.2 }
            }
        };
    }
    
    // 初始化
    init() {
        // 重置计时器
        this.resetTimers();
        
        // 初始化统计
        this.resetStats();
        
        console.log('生成器系统初始化完成');
    }
    
    // 重置计时器
    resetTimers() {
        this.fishSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        this.updateSpawnIntervals();
    }
    
    // 重置统计
    resetStats() {
        this.stats = {
            totalFishSpawned: 0,
            totalObstaclesSpawned: 0,
            totalPowerUpsSpawned: 0,
            fishByType: {},
            obstaclesByType: {},
            powerUpsByType: {}
        };
    }
    
    // 更新生成间隔
    updateSpawnIntervals() {
        // 根据难度调整生成间隔
        const difficultyMultiplier = Math.max(0.3, 1 - (this.difficultyLevel - 1) * 0.1);
        
        this.fishSpawnInterval = Math.max(
            this.fishSpawnConfig.minInterval,
            this.fishSpawnConfig.baseInterval * difficultyMultiplier
        );
        
        this.obstacleSpawnInterval = Math.max(
            this.obstacleSpawnConfig.minInterval,
            this.obstacleSpawnConfig.baseInterval * difficultyMultiplier
        );
        
        this.powerUpSpawnInterval = Math.max(
            this.powerUpSpawnConfig.minInterval,
            this.powerUpSpawnConfig.baseInterval * difficultyMultiplier
        );
    }
    
    // 更新生成器
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // 更新难度
        this.updateDifficulty();
        
        // 更新特殊事件
        this.updateEvents(deltaTime);
        
        // 更新生成计时器
        this.updateSpawnTimers(deltaTime);
        
        // 更新实体
        this.updateEntities(deltaTime);
        
        // 清理无效实体
        this.cleanupEntities();
    }
    
    // 更新难度
    updateDifficulty() {
        const newDifficultyLevel = Math.floor(this.gameTime / 30) + 1; // 每30秒提升一级难度
        
        if (newDifficultyLevel !== this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;
            this.updateSpawnIntervals();
            
            console.log(`难度提升到等级 ${this.difficultyLevel}`);
            
            // 触发难度提升事件
            this.triggerDifficultyEvent();
        }
    }
    
    // 触发难度提升事件
    triggerDifficultyEvent() {
        const eventChance = Math.random();
        
        if (eventChance < 0.3) {
            this.startFishFrenzy();
        } else if (eventChance < 0.5) {
            this.startObstacleStorm();
        } else if (eventChance < 0.7) {
            this.startPowerUpRain();
        }
    }
    
    // 更新特殊事件
    updateEvents(deltaTime) {
        Object.keys(this.events).forEach(eventName => {
            const event = this.events[eventName];
            
            if (event.active) {
                event.timer += deltaTime;
                
                if (event.timer >= event.duration) {
                    this.endEvent(eventName);
                }
            }
        });
    }
    
    // 更新生成计时器
    updateSpawnTimers(deltaTime) {
        // 鱼类生成
        this.fishSpawnTimer += deltaTime;
        if (this.fishSpawnTimer >= this.fishSpawnInterval) {
            this.spawnFish();
            this.fishSpawnTimer = 0;
            this.fishSpawnInterval = this.getRandomInterval('fish');
        }
        
        // 障碍物生成
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
            this.obstacleSpawnInterval = this.getRandomInterval('obstacle');
        }
        
        // 道具生成
        this.powerUpSpawnTimer += deltaTime;
        if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
            this.powerUpSpawnInterval = this.getRandomInterval('powerUp');
        }
    }
    
    // 获取随机生成间隔
    getRandomInterval(type) {
        const config = {
            fish: this.fishSpawnConfig,
            obstacle: this.obstacleSpawnConfig,
            powerUp: this.powerUpSpawnConfig
        }[type];
        
        const baseInterval = config.baseInterval;
        const variation = baseInterval * 0.5;
        
        return baseInterval + (Math.random() - 0.5) * variation;
    }
    
    // 生成鱼类
    spawnFish() {
        if (this.fish.length >= this.fishSpawnConfig.maxFish) return;
        
        // 决定是否生成鱼群
        const shouldSpawnSchool = Math.random() < this.fishSpawnConfig.schoolChance;
        
        if (shouldSpawnSchool) {
            this.spawnFishSchool();
        } else {
            this.spawnSingleFish();
        }
    }
    
    // 生成单条鱼
    spawnSingleFish() {
        const fishType = this.selectFishType();
        const spawnPosition = this.getRandomSpawnPosition('fish');
        
        const fish = new Fish(fishType, spawnPosition.x, spawnPosition.y);
        this.fish.push(fish);
        
        // 更新统计
        this.stats.totalFishSpawned++;
        this.stats.fishByType[fishType] = (this.stats.fishByType[fishType] || 0) + 1;
    }
    
    // 生成鱼群
    spawnFishSchool() {
        const schoolSize = GameGlobal.Utils.randomInt(
            this.fishSpawnConfig.schoolSize.min,
            this.fishSpawnConfig.schoolSize.max
        );
        
        const fishType = this.selectFishType();
        const leaderPosition = this.getRandomSpawnPosition('fish');
        
        for (let i = 0; i < schoolSize; i++) {
            if (this.fish.length >= this.fishSpawnConfig.maxFish) break;
            
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 60;
            
            const fish = new Fish(
                fishType,
                leaderPosition.x + offsetX,
                leaderPosition.y + offsetY
            );
            
            // 设置鱼群行为
            fish.setSchoolBehavior(true, leaderPosition);
            
            this.fish.push(fish);
            
            // 更新统计
            this.stats.totalFishSpawned++;
            this.stats.fishByType[fishType] = (this.stats.fishByType[fishType] || 0) + 1;
        }
    }
    
    // 选择鱼类类型
    selectFishType() {
        const isRareFish = Math.random() < this.fishSpawnConfig.rareFishChance;
        
        if (isRareFish) {
            const rareTypes = ['rare', 'legendary'];
            return rareTypes[Math.floor(Math.random() * rareTypes.length)];
        }
        
        const commonTypes = ['small', 'medium', 'large'];
        const weights = [0.5, 0.3, 0.2]; // 小鱼更常见
        
        return this.selectWeightedRandom(commonTypes, weights);
    }
    
    // 生成障碍物
    spawnObstacle() {
        if (this.obstacles.length >= this.obstacleSpawnConfig.maxObstacles) return;
        
        const obstacleType = this.selectObstacleType();
        const spawnPosition = this.getRandomSpawnPosition('obstacles');
        
        const obstacle = new Obstacle(obstacleType, spawnPosition.x, spawnPosition.y);
        this.obstacles.push(obstacle);
        
        // 更新统计
        this.stats.totalObstaclesSpawned++;
        this.stats.obstaclesByType[obstacleType] = (this.stats.obstaclesByType[obstacleType] || 0) + 1;
    }
    
    // 选择障碍物类型
    selectObstacleType() {
        const types = Object.keys(this.obstacleSpawnConfig.typeWeights);
        const weights = Object.values(this.obstacleSpawnConfig.typeWeights);
        
        return this.selectWeightedRandom(types, weights);
    }
    
    // 生成道具
    spawnPowerUp() {
        if (this.powerUps.length >= this.powerUpSpawnConfig.maxPowerUps) return;
        
        const powerUpType = this.selectPowerUpType();
        const spawnPosition = this.getRandomSpawnPosition('powerUps');
        
        const powerUp = new PowerUp(powerUpType, spawnPosition.x, spawnPosition.y);
        this.powerUps.push(powerUp);
        
        // 更新统计
        this.stats.totalPowerUpsSpawned++;
        this.stats.powerUpsByType[powerUpType] = (this.stats.powerUpsByType[powerUpType] || 0) + 1;
    }
    
    // 选择道具类型
    selectPowerUpType() {
        const types = Object.keys(this.powerUpSpawnConfig.typeWeights);
        const weights = Object.values(this.powerUpSpawnConfig.typeWeights);
        
        return this.selectWeightedRandom(types, weights);
    }
    
    // 权重随机选择
    selectWeightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }
    
    // 获取随机生成位置
    getRandomSpawnPosition(category) {
        const areas = this.spawnAreas[category];
        const areaNames = Object.keys(areas);
        const selectedArea = areas[areaNames[Math.floor(Math.random() * areaNames.length)]];
        
        return {
            x: selectedArea.x + Math.random() * selectedArea.width,
            y: selectedArea.y + Math.random() * selectedArea.height
        };
    }
    
    // 更新实体
    updateEntities(deltaTime) {
        // 更新鱼类
        this.fish.forEach(fish => {
            fish.update(deltaTime);
        });
        
        // 更新障碍物
        this.obstacles.forEach(obstacle => {
            obstacle.update(deltaTime);
        });
        
        // 更新道具
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });
    }
    
    // 清理无效实体
    cleanupEntities() {
        // 清理鱼类
        this.fish = this.fish.filter(fish => {
            return fish.isActive && fish.isOnScreen();
        });
        
        // 清理障碍物
        this.obstacles = this.obstacles.filter(obstacle => {
            return obstacle.isActive;
        });
        
        // 清理道具
        this.powerUps = this.powerUps.filter(powerUp => {
            return powerUp.isActive;
        });
    }
    
    // 开始鱼群狂欢事件
    startFishFrenzy() {
        this.events.fishFrenzy.active = true;
        this.events.fishFrenzy.timer = 0;
        
        // 临时增加鱼类生成速率
        this.fishSpawnConfig.spawnRate = 3.0;
        
        console.log('鱼群狂欢开始！');
    }
    
    // 开始障碍物风暴事件
    startObstacleStorm() {
        this.events.obstacleStorm.active = true;
        this.events.obstacleStorm.timer = 0;
        
        // 临时增加障碍物生成速率
        this.obstacleSpawnConfig.spawnRate = 2.5;
        
        console.log('障碍物风暴开始！');
    }
    
    // 开始道具雨事件
    startPowerUpRain() {
        this.events.powerUpRain.active = true;
        this.events.powerUpRain.timer = 0;
        
        // 临时增加道具生成速率
        this.powerUpSpawnConfig.spawnRate = 4.0;
        
        console.log('道具雨开始！');
    }
    
    // 结束事件
    endEvent(eventName) {
        this.events[eventName].active = false;
        this.events[eventName].timer = 0;
        
        // 恢复正常生成速率
        switch (eventName) {
            case 'fishFrenzy':
                this.fishSpawnConfig.spawnRate = 1.0;
                console.log('鱼群狂欢结束');
                break;
            case 'obstacleStorm':
                this.obstacleSpawnConfig.spawnRate = 1.0;
                console.log('障碍物风暴结束');
                break;
            case 'powerUpRain':
                this.powerUpSpawnConfig.spawnRate = 1.0;
                console.log('道具雨结束');
                break;
        }
    }
    
    // 强制生成特定类型的鱼
    forceFishSpawn(type, x, y) {
        if (this.fish.length >= this.fishSpawnConfig.maxFish) return null;
        
        const fish = new Fish(type, x, y);
        this.fish.push(fish);
        
        this.stats.totalFishSpawned++;
        this.stats.fishByType[type] = (this.stats.fishByType[type] || 0) + 1;
        
        return fish;
    }
    
    // 强制生成特定类型的障碍物
    forceObstacleSpawn(type, x, y) {
        if (this.obstacles.length >= this.obstacleSpawnConfig.maxObstacles) return null;
        
        const obstacle = new Obstacle(type, x, y);
        this.obstacles.push(obstacle);
        
        this.stats.totalObstaclesSpawned++;
        this.stats.obstaclesByType[type] = (this.stats.obstaclesByType[type] || 0) + 1;
        
        return obstacle;
    }
    
    // 强制生成特定类型的道具
    forcePowerUpSpawn(type, x, y) {
        if (this.powerUps.length >= this.powerUpSpawnConfig.maxPowerUps) return null;
        
        const powerUp = new PowerUp(type, x, y);
        this.powerUps.push(powerUp);
        
        this.stats.totalPowerUpsSpawned++;
        this.stats.powerUpsByType[type] = (this.stats.powerUpsByType[type] || 0) + 1;
        
        return powerUp;
    }
    
    // 清除所有实体
    clearAllEntities() {
        this.fish = [];
        this.obstacles = [];
        this.powerUps = [];
    }
    
    // 清除特定类型的实体
    clearEntitiesByType(category, type) {
        switch (category) {
            case 'fish':
                this.fish = this.fish.filter(fish => fish.type !== type);
                break;
            case 'obstacles':
                this.obstacles = this.obstacles.filter(obstacle => obstacle.type !== type);
                break;
            case 'powerUps':
                this.powerUps = this.powerUps.filter(powerUp => powerUp.type !== type);
                break;
        }
    }
    
    // 渲染所有实体
    render(ctx) {
        // 渲染鱼类（按深度排序）
        const sortedFish = [...this.fish].sort((a, b) => a.y - b.y);
        sortedFish.forEach(fish => {
            fish.render(ctx);
        });
        
        // 渲染障碍物
        this.obstacles.forEach(obstacle => {
            obstacle.render(ctx);
        });
        
        // 渲染道具
        this.powerUps.forEach(powerUp => {
            powerUp.render(ctx);
        });
        
        // 渲染调试信息
        if (GameGlobal.GameConfig.DEBUG_MODE) {
            this.renderDebugInfo(ctx);
        }
    }
    
    // 渲染调试信息
    renderDebugInfo(ctx) {
        const debugY = 10;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, debugY, 200, 120);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        ctx.fillText(`难度等级: ${this.difficultyLevel}`, 15, debugY + 15);
        ctx.fillText(`鱼类: ${this.fish.length}/${this.fishSpawnConfig.maxFish}`, 15, debugY + 30);
        ctx.fillText(`障碍物: ${this.obstacles.length}/${this.obstacleSpawnConfig.maxObstacles}`, 15, debugY + 45);
        ctx.fillText(`道具: ${this.powerUps.length}/${this.powerUpSpawnConfig.maxPowerUps}`, 15, debugY + 60);
        
        // 显示活跃事件
        let eventY = debugY + 75;
        Object.keys(this.events).forEach(eventName => {
            if (this.events[eventName].active) {
                const timeLeft = this.events[eventName].duration - this.events[eventName].timer;
                ctx.fillText(`${eventName}: ${timeLeft.toFixed(1)}s`, 15, eventY);
                eventY += 15;
            }
        });
    }
    
    // 获取所有实体
    getAllEntities() {
        return {
            fish: this.fish,
            obstacles: this.obstacles,
            powerUps: this.powerUps
        };
    }
    
    // 获取统计信息
    getStats() {
        return {
            ...this.stats,
            currentCounts: {
                fish: this.fish.length,
                obstacles: this.obstacles.length,
                powerUps: this.powerUps.length
            },
            difficultyLevel: this.difficultyLevel,
            activeEvents: Object.keys(this.events).filter(name => this.events[name].active)
        };
    }
    
    // 重置生成器
    reset() {
        this.clearAllEntities();
        this.resetTimers();
        this.resetStats();
        this.difficultyLevel = 1;
        this.gameTime = 0;
        
        // 重置所有事件
        Object.keys(this.events).forEach(eventName => {
            this.events[eventName].active = false;
            this.events[eventName].timer = 0;
        });
        
        // 重置生成速率
        this.fishSpawnConfig.spawnRate = 1.0;
        this.obstacleSpawnConfig.spawnRate = 1.0;
        this.powerUpSpawnConfig.spawnRate = 1.0;
        
        console.log('生成器系统已重置');
    }
}

// 导出生成器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Spawner;
} else {
    window.Spawner = Spawner;
}

console.log('生成器系统加载完成');