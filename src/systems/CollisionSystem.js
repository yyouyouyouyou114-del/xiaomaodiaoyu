// 碰撞检测系统
// 负责处理鱼钩与鱼类、障碍物、道具之间的碰撞检测

class CollisionSystem {
    constructor() {
        // 碰撞配置
        this.config = {
            hookRadius: 8,              // 鱼钩碰撞半径
            fishCollisionMargin: 5,     // 鱼类碰撞边距
            obstacleCollisionMargin: 3, // 障碍物碰撞边距
            powerUpCollisionMargin: 8,  // 道具碰撞边距
            magneticRange: 50,          // 磁性吸引范围
            enableDebugDraw: false      // 是否绘制调试信息
        };
        
        // 碰撞结果
        this.lastCollisionResults = {
            fish: [],
            obstacles: [],
            powerUps: []
        };
        
        // 碰撞统计
        this.stats = {
            totalCollisions: 0,
            fishCollisions: 0,
            obstacleCollisions: 0,
            powerUpCollisions: 0,
            collisionsByType: {}
        };
        
        // 碰撞事件回调
        this.callbacks = {
            onFishCaught: null,
            onObstacleHit: null,
            onPowerUpCollected: null,
            onMagneticAttraction: null
        };
        
        // 空间分割优化
        this.spatialGrid = {
            cellSize: 100,
            grid: new Map(),
            enabled: true
        };
        
        this.init();
    }
    
    // 初始化
    init() {
        this.resetStats();
        console.log('碰撞检测系统初始化完成');
    }
    
    // 重置统计
    resetStats() {
        this.stats = {
            totalCollisions: 0,
            fishCollisions: 0,
            obstacleCollisions: 0,
            powerUpCollisions: 0,
            collisionsByType: {}
        };
    }
    
    // 设置回调函数
    setCallback(eventType, callback) {
        if (this.callbacks.hasOwnProperty(eventType)) {
            this.callbacks[eventType] = callback;
        }
    }
    
    // 主要碰撞检测方法
    checkCollisions(hook, entities) {
        // 清空上次的碰撞结果
        this.lastCollisionResults = {
            fish: [],
            obstacles: [],
            powerUps: []
        };
        
        if (!hook || !hook.isActive) return this.lastCollisionResults;
        
        const hookRect = this.getHookCollisionRect(hook);
        
        // 检测与鱼类的碰撞
        this.checkFishCollisions(hookRect, entities.fish);
        
        // 检测与障碍物的碰撞
        this.checkObstacleCollisions(hookRect, entities.obstacles);
        
        // 检测与道具的碰撞
        this.checkPowerUpCollisions(hookRect, entities.powerUps);
        
        // 检测磁性吸引
        this.checkMagneticAttractions(hook, entities.powerUps);
        
        return this.lastCollisionResults;
    }
    
    // 获取鱼钩碰撞矩形
    getHookCollisionRect(hook) {
        return {
            x: hook.x - this.config.hookRadius,
            y: hook.y - this.config.hookRadius,
            width: this.config.hookRadius * 2,
            height: this.config.hookRadius * 2,
            centerX: hook.x,
            centerY: hook.y,
            radius: this.config.hookRadius
        };
    }
    
    // 检测与鱼类的碰撞
    checkFishCollisions(hookRect, fish) {
        fish.forEach(fishEntity => {
            if (!fishEntity.isActive || fishEntity.state === 'caught' || fishEntity.state === 'escaping') {
                return;
            }
            
            const fishRect = this.getFishCollisionRect(fishEntity);
            
            if (this.isColliding(hookRect, fishRect)) {
                // 检查鱼类是否可以被捕获
                if (this.canCatchFish(fishEntity, hookRect)) {
                    this.handleFishCollision(fishEntity, hookRect);
                    this.lastCollisionResults.fish.push({
                        entity: fishEntity,
                        type: 'catch',
                        position: { x: hookRect.centerX, y: hookRect.centerY }
                    });
                }
            }
        });
    }
    
    // 获取鱼类碰撞矩形
    getFishCollisionRect(fish) {
        return {
            x: fish.x - this.config.fishCollisionMargin,
            y: fish.y - this.config.fishCollisionMargin,
            width: fish.width + this.config.fishCollisionMargin * 2,
            height: fish.height + this.config.fishCollisionMargin * 2,
            centerX: fish.x + fish.width / 2,
            centerY: fish.y + fish.height / 2
        };
    }
    
    // 检查是否可以捕获鱼类
    canCatchFish(fish, hookRect) {
        // 检查鱼类状态
        if (fish.state !== 'swimming' && fish.state !== 'resting') {
            return false;
        }
        
        // 检查鱼类是否在逃跑
        if (fish.isEscaping) {
            return false;
        }
        
        // 检查鱼钩是否有足够的力量捕获这种鱼
        const hookPower = this.getHookPower();
        const fishResistance = this.getFishResistance(fish);
        
        return hookPower >= fishResistance;
    }
    
    // 获取鱼钩力量
    getHookPower() {
        let power = 1.0;
        
        // 检查是否有磁力钩道具
        if (GameGlobal.GameState.powerUps.magneticHook.active) {
            power *= 1.5;
        }
        
        // 检查是否有其他增强道具
        if (GameGlobal.GameState.powerUps.speedBoost.active) {
            power *= 1.2;
        }
        
        return power;
    }
    
    // 获取鱼类抗性
    getFishResistance(fish) {
        const resistanceMap = {
            small: 0.5,
            medium: 0.8,
            large: 1.2,
            rare: 1.5,
            legendary: 2.0
        };
        
        return resistanceMap[fish.type] || 1.0;
    }
    
    // 处理鱼类碰撞
    handleFishCollision(fish, hookRect) {
        // 设置鱼类为被捕获状态
        fish.onCaught();
        
        // 更新统计
        this.stats.totalCollisions++;
        this.stats.fishCollisions++;
        this.stats.collisionsByType[fish.type] = (this.stats.collisionsByType[fish.type] || 0) + 1;
        
        // 触发回调
        if (this.callbacks.onFishCaught) {
            this.callbacks.onFishCaught(fish, hookRect);
        }
        
        console.log(`捕获了${fish.description}！`);
    }
    
    // 检测与障碍物的碰撞
    checkObstacleCollisions(hookRect, obstacles) {
        obstacles.forEach(obstacle => {
            if (!obstacle.isActive || obstacle.isColliding) {
                return;
            }
            
            const obstacleRect = this.getObstacleCollisionRect(obstacle);
            
            if (this.isColliding(hookRect, obstacleRect)) {
                this.handleObstacleCollision(obstacle, hookRect);
                this.lastCollisionResults.obstacles.push({
                    entity: obstacle,
                    type: 'hit',
                    position: { x: hookRect.centerX, y: hookRect.centerY }
                });
            }
        });
    }
    
    // 获取障碍物碰撞矩形
    getObstacleCollisionRect(obstacle) {
        return {
            x: obstacle.x + obstacle.swayOffset - this.config.obstacleCollisionMargin,
            y: obstacle.y + obstacle.bobOffset - this.config.obstacleCollisionMargin,
            width: obstacle.width + this.config.obstacleCollisionMargin * 2,
            height: obstacle.height + this.config.obstacleCollisionMargin * 2,
            centerX: obstacle.x + obstacle.swayOffset + obstacle.width / 2,
            centerY: obstacle.y + obstacle.bobOffset + obstacle.height / 2
        };
    }
    
    // 处理障碍物碰撞
    handleObstacleCollision(obstacle, hookRect) {
        // 处理障碍物碰撞
        const wasDestroyed = obstacle.onCollision(hookRect);
        
        // 更新统计
        this.stats.totalCollisions++;
        this.stats.obstacleCollisions++;
        this.stats.collisionsByType[obstacle.type] = (this.stats.collisionsByType[obstacle.type] || 0) + 1;
        
        // 触发回调
        if (this.callbacks.onObstacleHit) {
            this.callbacks.onObstacleHit(obstacle, hookRect, wasDestroyed);
        }
        
        console.log(`撞到了${obstacle.description}！${wasDestroyed ? '已摧毁' : ''}`);
    }
    
    // 检测与道具的碰撞
    checkPowerUpCollisions(hookRect, powerUps) {
        powerUps.forEach(powerUp => {
            if (!powerUp.isActive || powerUp.isCollected) {
                return;
            }
            
            const powerUpRect = this.getPowerUpCollisionRect(powerUp);
            
            if (this.isColliding(hookRect, powerUpRect)) {
                this.handlePowerUpCollision(powerUp, hookRect);
                this.lastCollisionResults.powerUps.push({
                    entity: powerUp,
                    type: 'collect',
                    position: { x: hookRect.centerX, y: hookRect.centerY }
                });
            }
        });
    }
    
    // 获取道具碰撞矩形
    getPowerUpCollisionRect(powerUp) {
        return {
            x: powerUp.x - this.config.powerUpCollisionMargin,
            y: powerUp.y + powerUp.floatOffset - this.config.powerUpCollisionMargin,
            width: powerUp.width + this.config.powerUpCollisionMargin * 2,
            height: powerUp.height + this.config.powerUpCollisionMargin * 2,
            centerX: powerUp.x + powerUp.width / 2,
            centerY: powerUp.y + powerUp.floatOffset + powerUp.height / 2
        };
    }
    
    // 处理道具碰撞
    handlePowerUpCollision(powerUp, hookRect) {
        // 收集道具
        powerUp.onCollected(hookRect);
        
        // 更新统计
        this.stats.totalCollisions++;
        this.stats.powerUpCollisions++;
        this.stats.collisionsByType[powerUp.type] = (this.stats.collisionsByType[powerUp.type] || 0) + 1;
        
        // 触发回调
        if (this.callbacks.onPowerUpCollected) {
            this.callbacks.onPowerUpCollected(powerUp, hookRect);
        }
        
        console.log(`收集了${powerUp.description}！`);
    }
    
    // 检测磁性吸引
    checkMagneticAttractions(hook, powerUps) {
        powerUps.forEach(powerUp => {
            if (!powerUp.isActive || powerUp.isCollected) {
                return;
            }
            
            const attraction = powerUp.checkMagneticAttraction(hook.x, hook.y);
            
            if (attraction && this.callbacks.onMagneticAttraction) {
                this.callbacks.onMagneticAttraction(powerUp, attraction);
            }
        });
    }
    
    // 基础碰撞检测（矩形与矩形）
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 圆形碰撞检测
    isCircleColliding(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (circle1.radius + circle2.radius);
    }
    
    // 点与矩形碰撞检测
    isPointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
    
    // 点与圆形碰撞检测
    isPointInCircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= circle.radius;
    }
    
    // 线段与矩形碰撞检测（用于鱼线碰撞）
    isLineIntersectingRect(line, rect) {
        // 检查线段端点是否在矩形内
        if (this.isPointInRect(line.start, rect) || this.isPointInRect(line.end, rect)) {
            return true;
        }
        
        // 检查线段是否与矩形边相交
        const rectLines = [
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } },
            { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } },
            { start: { x: rect.x + rect.width, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y + rect.height } },
            { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y } }
        ];
        
        return rectLines.some(rectLine => this.isLineIntersecting(line, rectLine));
    }
    
    // 线段与线段相交检测
    isLineIntersecting(line1, line2) {
        const x1 = line1.start.x, y1 = line1.start.y;
        const x2 = line1.end.x, y2 = line1.end.y;
        const x3 = line2.start.x, y3 = line2.start.y;
        const x4 = line2.end.x, y4 = line2.end.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 1e-10) {
            return false; // 平行线
        }
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    // 检测鱼线与障碍物的碰撞
    checkFishingLineCollisions(fishingLine, obstacles) {
        const collisions = [];
        
        obstacles.forEach(obstacle => {
            if (!obstacle.isActive) return;
            
            const obstacleRect = this.getObstacleCollisionRect(obstacle);
            
            // 检查每个线段
            for (let i = 0; i < fishingLine.segments.length - 1; i++) {
                const line = {
                    start: fishingLine.segments[i],
                    end: fishingLine.segments[i + 1]
                };
                
                if (this.isLineIntersectingRect(line, obstacleRect)) {
                    collisions.push({
                        obstacle: obstacle,
                        segment: i,
                        line: line
                    });
                }
            }
        });
        
        return collisions;
    }
    
    // 空间分割优化
    updateSpatialGrid(entities) {
        if (!this.spatialGrid.enabled) return;
        
        this.spatialGrid.grid.clear();
        
        // 将所有实体添加到空间网格中
        Object.values(entities).flat().forEach(entity => {
            if (!entity.isActive) return;
            
            const cellX = Math.floor(entity.x / this.spatialGrid.cellSize);
            const cellY = Math.floor(entity.y / this.spatialGrid.cellSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!this.spatialGrid.grid.has(cellKey)) {
                this.spatialGrid.grid.set(cellKey, []);
            }
            
            this.spatialGrid.grid.get(cellKey).push(entity);
        });
    }
    
    // 获取附近的实体（空间分割优化）
    getNearbyEntities(x, y, radius = 100) {
        if (!this.spatialGrid.enabled) return [];
        
        const nearbyEntities = [];
        const cellRadius = Math.ceil(radius / this.spatialGrid.cellSize);
        const centerCellX = Math.floor(x / this.spatialGrid.cellSize);
        const centerCellY = Math.floor(y / this.spatialGrid.cellSize);
        
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const cellKey = `${centerCellX + dx},${centerCellY + dy}`;
                const cellEntities = this.spatialGrid.grid.get(cellKey);
                
                if (cellEntities) {
                    nearbyEntities.push(...cellEntities);
                }
            }
        }
        
        return nearbyEntities;
    }
    
    // 渲染碰撞调试信息
    renderDebugInfo(ctx, hook, entities) {
        if (!this.config.enableDebugDraw) return;
        
        ctx.save();
        
        // 绘制鱼钩碰撞区域
        if (hook && hook.isActive) {
            const hookRect = this.getHookCollisionRect(hook);
            
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hookRect.centerX, hookRect.centerY, hookRect.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制实体碰撞区域
        entities.fish.forEach(fish => {
            if (!fish.isActive) return;
            
            const fishRect = this.getFishCollisionRect(fish);
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 1;
            ctx.strokeRect(fishRect.x, fishRect.y, fishRect.width, fishRect.height);
        });
        
        entities.obstacles.forEach(obstacle => {
            if (!obstacle.isActive) return;
            
            const obstacleRect = this.getObstacleCollisionRect(obstacle);
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 1;
            ctx.strokeRect(obstacleRect.x, obstacleRect.y, obstacleRect.width, obstacleRect.height);
        });
        
        entities.powerUps.forEach(powerUp => {
            if (!powerUp.isActive) return;
            
            const powerUpRect = this.getPowerUpCollisionRect(powerUp);
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(powerUpRect.x, powerUpRect.y, powerUpRect.width, powerUpRect.height);
        });
        
        // 绘制统计信息
        this.renderCollisionStats(ctx);
        
        ctx.restore();
    }
    
    // 渲染碰撞统计信息
    renderCollisionStats(ctx) {
        const statsY = 150;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, statsY, 200, 100);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        ctx.fillText('碰撞统计:', 15, statsY + 15);
        ctx.fillText(`总碰撞: ${this.stats.totalCollisions}`, 15, statsY + 30);
        ctx.fillText(`鱼类: ${this.stats.fishCollisions}`, 15, statsY + 45);
        ctx.fillText(`障碍物: ${this.stats.obstacleCollisions}`, 15, statsY + 60);
        ctx.fillText(`道具: ${this.stats.powerUpCollisions}`, 15, statsY + 75);
    }
    
    // 获取碰撞统计
    getStats() {
        return { ...this.stats };
    }
    
    // 重置碰撞系统
    reset() {
        this.resetStats();
        this.lastCollisionResults = {
            fish: [],
            obstacles: [],
            powerUps: []
        };
        
        if (this.spatialGrid.enabled) {
            this.spatialGrid.grid.clear();
        }
        
        console.log('碰撞检测系统已重置');
    }
    
    // 启用/禁用调试绘制
    setDebugDraw(enabled) {
        this.config.enableDebugDraw = enabled;
    }
    
    // 启用/禁用空间分割优化
    setSpatialGridEnabled(enabled) {
        this.spatialGrid.enabled = enabled;
        if (!enabled) {
            this.spatialGrid.grid.clear();
        }
    }
}

// 导出碰撞检测系统类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionSystem;
} else {
    window.CollisionSystem = CollisionSystem;
}

console.log('碰撞检测系统加载完成');