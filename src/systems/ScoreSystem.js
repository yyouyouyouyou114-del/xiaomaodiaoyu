// 得分系统
// 负责管理游戏得分、计时、奖励计算和高分记录

class ScoreSystem {
    constructor() {
        // 得分配置
        this.config = {
            // 基础得分
            baseScores: {
                small: 10,
                medium: 25,
                large: 50,
                rare: 100,
                legendary: 250
            },
            
            // 连击奖励
            comboMultipliers: {
                2: 1.2,
                3: 1.5,
                5: 2.0,
                10: 3.0,
                20: 5.0
            },
            
            // 时间奖励
            timeBonus: {
                fast: 50,      // 快速捕获奖励
                perfect: 100   // 完美时机奖励
            },
            
            // 障碍物惩罚
            obstaclePenalties: {
                weed: -5,
                trash: -10,
                rock: -15,
                coral: -20,
                seaweed: -8
            },
            
            // 道具奖励
            powerUpBonuses: {
                bait: 20,
                accelerator: 15,
                buffPotion: 30,
                timeBonus: 25,
                luckyCharm: 40,
                magnet: 35
            },
            
            // 特殊成就奖励
            achievementBonuses: {
                firstCatch: 50,
                perfectGame: 500,
                comboMaster: 200,
                speedDemon: 300,
                collector: 150
            }
        };
        
        // 当前游戏状态
        this.gameState = {
            score: 0,
            highScore: 0,
            combo: 0,
            maxCombo: 0,
            timeRemaining: 0,
            gameTime: 0,
            totalCatches: 0,
            perfectCatches: 0,
            fastCatches: 0,
            obstacleHits: 0,
            powerUpsCollected: 0
        };
        
        // 得分历史
        this.scoreHistory = [];
        
        // 成就系统
        this.achievements = {
            unlocked: new Set(),
            progress: {}
        };
        
        // 得分粒子效果
        this.scoreParticles = [];
        
        // 得分事件回调
        this.callbacks = {
            onScoreChange: null,
            onComboChange: null,
            onAchievementUnlocked: null,
            onHighScoreBeaten: null
        };
        
        // 计时器
        this.timers = {
            gameTimer: null,
            comboTimer: null,
            bonusTimer: null
        };
        
        this.init();
    }
    
    // 初始化
    init() {
        this.loadHighScore();
        this.resetGame();
        console.log('得分系统初始化完成');
    }
    
    // 重置游戏
    resetGame() {
        this.gameState = {
            score: 0,
            highScore: this.gameState.highScore,
            combo: 0,
            maxCombo: 0,
            timeRemaining: 0,
            gameTime: 0,
            totalCatches: 0,
            perfectCatches: 0,
            fastCatches: 0,
            obstacleHits: 0,
            powerUpsCollected: 0
        };
        
        this.scoreParticles = [];
        this.clearTimers();
        
        console.log('得分系统已重置');
    }
    
    // 设置回调函数
    setCallback(eventType, callback) {
        if (this.callbacks.hasOwnProperty(eventType)) {
            this.callbacks[eventType] = callback;
        }
    }
    
    // 开始游戏计时
    startGameTimer(duration) {
        this.gameState.timeRemaining = duration;
        this.gameState.gameTime = 0;
        
        this.timers.gameTimer = setInterval(() => {
            this.gameState.timeRemaining--;
            this.gameState.gameTime++;
            
            if (this.gameState.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    // 结束游戏
    endGame() {
        this.clearTimers();
        
        // 检查是否创造新纪录
        if (this.gameState.score > this.gameState.highScore) {
            this.gameState.highScore = this.gameState.score;
            this.saveHighScore();
            
            if (this.callbacks.onHighScoreBeaten) {
                this.callbacks.onHighScoreBeaten(this.gameState.score);
            }
        }
        
        // 记录得分历史
        this.recordScoreHistory();
        
        // 检查成就
        this.checkAchievements();
        
        console.log(`游戏结束！最终得分: ${this.gameState.score}`);
    }
    
    // 添加得分（捕获鱼类）
    addFishScore(fish, catchTime = 0, isPerfect = false) {
        const baseScore = this.config.baseScores[fish.type] || 10;
        let totalScore = baseScore;
        let bonusText = [];
        
        // 连击奖励
        this.gameState.combo++;
        const comboMultiplier = this.getComboMultiplier(this.gameState.combo);
        if (comboMultiplier > 1) {
            totalScore *= comboMultiplier;
            bonusText.push(`连击x${comboMultiplier.toFixed(1)}`);
        }
        
        // 时间奖励
        if (isPerfect) {
            totalScore += this.config.timeBonus.perfect;
            bonusText.push('完美时机!');
            this.gameState.perfectCatches++;
        } else if (catchTime < 2000) { // 2秒内捕获
            totalScore += this.config.timeBonus.fast;
            bonusText.push('快速捕获!');
            this.gameState.fastCatches++;
        }
        
        // 稀有鱼类额外奖励
        if (fish.type === 'rare' || fish.type === 'legendary') {
            const rarityBonus = Math.floor(totalScore * 0.5);
            totalScore += rarityBonus;
            bonusText.push('稀有奖励!');
        }
        
        // 应用道具加成
        totalScore = this.applyPowerUpBonuses(totalScore);
        
        // 更新得分
        this.gameState.score += Math.floor(totalScore);
        this.gameState.totalCatches++;
        this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);
        
        // 创建得分粒子效果
        this.createScoreParticle(fish.x, fish.y, Math.floor(totalScore), bonusText);
        
        // 重置连击计时器
        this.resetComboTimer();
        
        // 触发回调
        if (this.callbacks.onScoreChange) {
            this.callbacks.onScoreChange(this.gameState.score, Math.floor(totalScore));
        }
        
        if (this.callbacks.onComboChange) {
            this.callbacks.onComboChange(this.gameState.combo);
        }
        
        console.log(`+${Math.floor(totalScore)}分！${bonusText.join(' ')}`);
        
        return Math.floor(totalScore);
    }
    
    // 扣除得分（撞到障碍物）
    subtractObstacleScore(obstacle) {
        const penalty = this.config.obstaclePenalties[obstacle.type] || -10;
        
        // 重置连击
        this.gameState.combo = 0;
        this.gameState.obstacleHits++;
        
        // 扣分
        this.gameState.score = Math.max(0, this.gameState.score + penalty);
        
        // 创建扣分粒子效果
        this.createScoreParticle(obstacle.x, obstacle.y, penalty, ['撞到障碍物!'], '#FF4444');
        
        // 触发回调
        if (this.callbacks.onScoreChange) {
            this.callbacks.onScoreChange(this.gameState.score, penalty);
        }
        
        if (this.callbacks.onComboChange) {
            this.callbacks.onComboChange(0);
        }
        
        console.log(`${penalty}分！撞到了${obstacle.description}`);
        
        return penalty;
    }
    
    // 添加道具得分
    addPowerUpScore(powerUp) {
        const bonus = this.config.powerUpBonuses[powerUp.type] || 20;
        
        this.gameState.score += bonus;
        this.gameState.powerUpsCollected++;
        
        // 创建得分粒子效果
        this.createScoreParticle(powerUp.x, powerUp.y, bonus, ['道具奖励!'], '#44FF44');
        
        // 触发回调
        if (this.callbacks.onScoreChange) {
            this.callbacks.onScoreChange(this.gameState.score, bonus);
        }
        
        console.log(`+${bonus}分！收集了${powerUp.description}`);
        
        return bonus;
    }
    
    // 获取连击倍数
    getComboMultiplier(combo) {
        const multipliers = this.config.comboMultipliers;
        const comboLevels = Object.keys(multipliers).map(Number).sort((a, b) => b - a);
        
        for (const level of comboLevels) {
            if (combo >= level) {
                return multipliers[level];
            }
        }
        
        return 1.0;
    }
    
    // 应用道具加成
    applyPowerUpBonuses(score) {
        let multiplier = 1.0;
        
        // 检查增益药水
        if (GameGlobal.GameState.powerUps.buffPotion.active) {
            multiplier *= GameGlobal.GameState.powerUps.buffPotion.multiplier || 2.0;
        }
        
        // 检查幸运符
        if (GameGlobal.GameState.powerUps.luckyCharm.active) {
            multiplier *= 1.5;
        }
        
        return score * multiplier;
    }
    
    // 重置连击计时器
    resetComboTimer() {
        if (this.timers.comboTimer) {
            clearTimeout(this.timers.comboTimer);
        }
        
        // 5秒内没有捕获就重置连击
        this.timers.comboTimer = setTimeout(() => {
            this.gameState.combo = 0;
            
            if (this.callbacks.onComboChange) {
                this.callbacks.onComboChange(0);
            }
        }, 5000);
    }
    
    // 创建得分粒子效果
    createScoreParticle(x, y, score, bonusText = [], color = '#FFD700') {
        const particle = {
            x: x,
            y: y,
            score: score,
            bonusText: bonusText,
            color: color,
            life: 2000, // 2秒生命周期
            maxLife: 2000,
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: -2 - Math.random() * 2
            },
            scale: 1.0,
            alpha: 1.0,
            rotation: 0
        };
        
        this.scoreParticles.push(particle);
    }
    
    // 更新得分粒子
    updateScoreParticles(deltaTime) {
        for (let i = this.scoreParticles.length - 1; i >= 0; i--) {
            const particle = this.scoreParticles[i];
            
            // 更新位置
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            
            // 更新生命周期
            particle.life -= deltaTime;
            
            // 更新视觉效果
            const lifeRatio = particle.life / particle.maxLife;
            particle.alpha = lifeRatio;
            particle.scale = 1.0 + (1.0 - lifeRatio) * 0.5;
            particle.rotation += 0.02;
            
            // 移除过期粒子
            if (particle.life <= 0) {
                this.scoreParticles.splice(i, 1);
            }
        }
    }
    
    // 渲染得分粒子
    renderScoreParticles(ctx) {
        this.scoreParticles.forEach(particle => {
            ctx.save();
            
            ctx.globalAlpha = particle.alpha;
            ctx.translate(particle.x, particle.y);
            ctx.scale(particle.scale, particle.scale);
            ctx.rotate(particle.rotation);
            
            // 绘制得分文字
            ctx.fillStyle = particle.color;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            
            const scoreText = particle.score > 0 ? `+${particle.score}` : `${particle.score}`;
            ctx.strokeText(scoreText, 0, 0);
            ctx.fillText(scoreText, 0, 0);
            
            // 绘制奖励文字
            if (particle.bonusText.length > 0) {
                ctx.font = '12px Arial';
                ctx.fillStyle = '#FFF';
                
                particle.bonusText.forEach((text, index) => {
                    ctx.strokeText(text, 0, 20 + index * 15);
                    ctx.fillText(text, 0, 20 + index * 15);
                });
            }
            
            ctx.restore();
        });
    }
    
    // 检查成就
    checkAchievements() {
        const achievements = [
            {
                id: 'firstCatch',
                name: '初次捕获',
                description: '捕获第一条鱼',
                condition: () => this.gameState.totalCatches >= 1,
                bonus: this.config.achievementBonuses.firstCatch
            },
            {
                id: 'comboMaster',
                name: '连击大师',
                description: '达到10连击',
                condition: () => this.gameState.maxCombo >= 10,
                bonus: this.config.achievementBonuses.comboMaster
            },
            {
                id: 'speedDemon',
                name: '速度恶魔',
                description: '快速捕获10条鱼',
                condition: () => this.gameState.fastCatches >= 10,
                bonus: this.config.achievementBonuses.speedDemon
            },
            {
                id: 'perfectGame',
                name: '完美游戏',
                description: '零障碍物碰撞完成游戏',
                condition: () => this.gameState.obstacleHits === 0 && this.gameState.totalCatches >= 5,
                bonus: this.config.achievementBonuses.perfectGame
            },
            {
                id: 'collector',
                name: '收集家',
                description: '收集5个道具',
                condition: () => this.gameState.powerUpsCollected >= 5,
                bonus: this.config.achievementBonuses.collector
            }
        ];
        
        achievements.forEach(achievement => {
            if (!this.achievements.unlocked.has(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }
    
    // 解锁成就
    unlockAchievement(achievement) {
        this.achievements.unlocked.add(achievement.id);
        this.gameState.score += achievement.bonus;
        
        // 创建成就粒子效果
        this.createScoreParticle(
            GameGlobal.canvas.width / 2,
            GameGlobal.canvas.height / 2,
            achievement.bonus,
            [`成就解锁: ${achievement.name}!`],
            '#FFD700'
        );
        
        // 触发回调
        if (this.callbacks.onAchievementUnlocked) {
            this.callbacks.onAchievementUnlocked(achievement);
        }
        
        console.log(`成就解锁: ${achievement.name} - ${achievement.description}`);
    }
    
    // 记录得分历史
    recordScoreHistory() {
        const record = {
            score: this.gameState.score,
            date: new Date().toISOString(),
            gameTime: this.gameState.gameTime,
            totalCatches: this.gameState.totalCatches,
            maxCombo: this.gameState.maxCombo,
            perfectCatches: this.gameState.perfectCatches,
            fastCatches: this.gameState.fastCatches,
            obstacleHits: this.gameState.obstacleHits,
            powerUpsCollected: this.gameState.powerUpsCollected
        };
        
        this.scoreHistory.push(record);
        
        // 只保留最近50条记录
        if (this.scoreHistory.length > 50) {
            this.scoreHistory = this.scoreHistory.slice(-50);
        }
        
        this.saveScoreHistory();
    }
    
    // 加载高分
    loadHighScore() {
        try {
            const saved = localStorage.getItem('catFishing_highScore');
            if (saved) {
                this.gameState.highScore = parseInt(saved) || 0;
            }
        } catch (e) {
            console.warn('无法加载高分记录:', e);
        }
    }
    
    // 保存高分
    saveHighScore() {
        try {
            localStorage.setItem('catFishing_highScore', this.gameState.highScore.toString());
        } catch (e) {
            console.warn('无法保存高分记录:', e);
        }
    }
    
    // 加载得分历史
    loadScoreHistory() {
        try {
            const saved = localStorage.getItem('catFishing_scoreHistory');
            if (saved) {
                this.scoreHistory = JSON.parse(saved) || [];
            }
        } catch (e) {
            console.warn('无法加载得分历史:', e);
        }
    }
    
    // 保存得分历史
    saveScoreHistory() {
        try {
            localStorage.setItem('catFishing_scoreHistory', JSON.stringify(this.scoreHistory));
        } catch (e) {
            console.warn('无法保存得分历史:', e);
        }
    }
    
    // 清除计时器
    clearTimers() {
        Object.values(this.timers).forEach(timer => {
            if (timer) {
                clearInterval(timer);
                clearTimeout(timer);
            }
        });
        
        this.timers = {
            gameTimer: null,
            comboTimer: null,
            bonusTimer: null
        };
    }
    
    // 获取游戏统计
    getGameStats() {
        return {
            ...this.gameState,
            averageScorePerCatch: this.gameState.totalCatches > 0 ? 
                Math.floor(this.gameState.score / this.gameState.totalCatches) : 0,
            perfectCatchRate: this.gameState.totalCatches > 0 ? 
                (this.gameState.perfectCatches / this.gameState.totalCatches * 100).toFixed(1) : '0.0',
            fastCatchRate: this.gameState.totalCatches > 0 ? 
                (this.gameState.fastCatches / this.gameState.totalCatches * 100).toFixed(1) : '0.0'
        };
    }
    
    // 获取得分历史
    getScoreHistory() {
        return [...this.scoreHistory];
    }
    
    // 获取成就列表
    getAchievements() {
        return {
            unlocked: Array.from(this.achievements.unlocked),
            progress: { ...this.achievements.progress }
        };
    }
    
    // 更新系统
    update(deltaTime) {
        this.updateScoreParticles(deltaTime);
    }
    
    // 渲染系统
    render(ctx) {
        this.renderScoreParticles(ctx);
    }
    
    // 添加时间奖励
    addTimeBonus(seconds) {
        this.gameState.timeRemaining += seconds;
        
        // 创建时间奖励粒子效果
        this.createScoreParticle(
            GameGlobal.canvas.width / 2,
            100,
            0,
            [`+${seconds}秒!`],
            '#44AAFF'
        );
        
        console.log(`时间奖励: +${seconds}秒`);
    }
    
    // 获取当前得分
    getScore() {
        return this.gameState.score;
    }
    
    // 获取高分
    getHighScore() {
        return this.gameState.highScore;
    }
    
    // 获取连击数
    getCombo() {
        return this.gameState.combo;
    }
    
    // 获取剩余时间
    getTimeRemaining() {
        return this.gameState.timeRemaining;
    }
    
    // 获取游戏时间
    getGameTime() {
        return this.gameState.gameTime;
    }
}

// 导出得分系统类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreSystem;
} else {
    window.ScoreSystem = ScoreSystem;
}

console.log('得分系统加载完成');