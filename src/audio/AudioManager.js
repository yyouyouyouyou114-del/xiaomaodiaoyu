/**
 * 音效管理器
 * 负责管理游戏中的所有音效和背景音乐
 */
class AudioManager {
    constructor() {
        // 音频上下文
        this.audioContext = null;
        this.masterGain = null;
        
        // 音效设置
        this.settings = {
            masterVolume: 0.7,
            musicVolume: 0.5,
            sfxVolume: 0.8,
            muted: false
        };
        
        // 音频缓存
        this.audioBuffers = new Map();
        this.audioSources = new Map();
        
        // 当前播放的音乐
        this.currentMusic = null;
        this.musicSource = null;
        this.musicGain = null;
        
        // 音效队列
        this.sfxQueue = [];
        this.maxConcurrentSfx = 8;
        
        // 音频文件定义
        this.audioFiles = {
            // 背景音乐
            music: {
                mainMenu: { frequency: 440, duration: 2, type: 'melody' },
                gamePlay: { frequency: 330, duration: 3, type: 'melody' },
                gameOver: { frequency: 220, duration: 1.5, type: 'melody' }
            },
            
            // 音效
            sfx: {
                cast: { frequency: 800, duration: 0.3, type: 'whoosh' },
                reel: { frequency: 600, duration: 0.2, type: 'mechanical' },
                fishCaught: { frequency: 1000, duration: 0.5, type: 'success' },
                fishMissed: { frequency: 200, duration: 0.3, type: 'fail' },
                obstacleHit: { frequency: 150, duration: 0.4, type: 'impact' },
                powerUpCollected: { frequency: 1200, duration: 0.6, type: 'magical' },
                buttonClick: { frequency: 500, duration: 0.1, type: 'click' },
                comboBonus: { frequency: 1500, duration: 0.4, type: 'bonus' },
                newRecord: { frequency: 2000, duration: 1, type: 'celebration' },
                bubbles: { frequency: 400, duration: 0.2, type: 'water' },
                splash: { frequency: 300, duration: 0.3, type: 'water' },
                countdown: { frequency: 700, duration: 0.2, type: 'beep' },
                pause: { frequency: 350, duration: 0.15, type: 'interface' },
                resume: { frequency: 450, duration: 0.15, type: 'interface' }
            }
        };
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化音频系统
     */
    async init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主音量控制
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.settings.masterVolume;
            
            // 创建音乐音量控制
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.settings.musicVolume;
            
            // 预生成音频缓冲区
            await this.preloadAudio();
            
            // 加载设置
            this.loadSettings();
            
            console.log('音频管理器初始化完成');
            
        } catch (error) {
            console.warn('音频初始化失败，将使用静音模式:', error);
            this.settings.muted = true;
        }
    }
    
    /**
     * 预加载音频
     */
    async preloadAudio() {
        const promises = [];
        
        // 预生成背景音乐
        for (const [name, config] of Object.entries(this.audioFiles.music)) {
            promises.push(this.generateAudioBuffer(name, config, 'music'));
        }
        
        // 预生成音效
        for (const [name, config] of Object.entries(this.audioFiles.sfx)) {
            promises.push(this.generateAudioBuffer(name, config, 'sfx'));
        }
        
        await Promise.all(promises);
    }
    
    /**
     * 生成音频缓冲区
     */
    async generateAudioBuffer(name, config, category) {
        try {
            const buffer = this.createSynthesizedAudio(config);
            this.audioBuffers.set(`${category}_${name}`, buffer);
        } catch (error) {
            console.warn(`生成音频失败: ${category}_${name}`, error);
        }
    }
    
    /**
     * 创建合成音频
     */
    createSynthesizedAudio(config) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * config.duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (config.type) {
            case 'melody':
                this.generateMelody(data, config, sampleRate);
                break;
            case 'whoosh':
                this.generateWhoosh(data, config, sampleRate);
                break;
            case 'mechanical':
                this.generateMechanical(data, config, sampleRate);
                break;
            case 'success':
                this.generateSuccess(data, config, sampleRate);
                break;
            case 'fail':
                this.generateFail(data, config, sampleRate);
                break;
            case 'impact':
                this.generateImpact(data, config, sampleRate);
                break;
            case 'magical':
                this.generateMagical(data, config, sampleRate);
                break;
            case 'click':
                this.generateClick(data, config, sampleRate);
                break;
            case 'bonus':
                this.generateBonus(data, config, sampleRate);
                break;
            case 'celebration':
                this.generateCelebration(data, config, sampleRate);
                break;
            case 'water':
                this.generateWater(data, config, sampleRate);
                break;
            case 'beep':
                this.generateBeep(data, config, sampleRate);
                break;
            case 'interface':
                this.generateInterface(data, config, sampleRate);
                break;
            default:
                this.generateTone(data, config, sampleRate);
        }
        
        return buffer;
    }
    
    /**
     * 生成旋律
     */
    generateMelody(data, config, sampleRate) {
        const baseFreq = config.frequency;
        const notes = [1, 1.25, 1.5, 1.25, 1, 0.75, 1]; // 简单的音阶
        const noteLength = data.length / notes.length;
        
        for (let i = 0; i < data.length; i++) {
            const noteIndex = Math.floor(i / noteLength);
            const freq = baseFreq * notes[noteIndex % notes.length];
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 2) * (1 - time / config.duration);
            
            data[i] = Math.sin(2 * Math.PI * freq * time) * envelope * 0.3;
        }
    }
    
    /**
     * 生成呼啸声
     */
    generateWhoosh(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const progress = time / config.duration;
            const freq = config.frequency * (1 + progress * 2);
            const envelope = Math.sin(Math.PI * progress) * 0.5;
            const noise = (Math.random() - 0.5) * 0.3;
            
            data[i] = (Math.sin(2 * Math.PI * freq * time) + noise) * envelope;
        }
    }
    
    /**
     * 生成机械声
     */
    generateMechanical(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 5);
            const clickRate = 20;
            const click = Math.sin(2 * Math.PI * clickRate * time) > 0 ? 1 : -1;
            
            data[i] = Math.sin(2 * Math.PI * config.frequency * time) * click * envelope * 0.4;
        }
    }
    
    /**
     * 生成成功音效
     */
    generateSuccess(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const progress = time / config.duration;
            const freq1 = config.frequency;
            const freq2 = config.frequency * 1.5;
            const envelope = Math.exp(-time * 3) * (1 - progress * 0.5);
            
            data[i] = (Math.sin(2 * Math.PI * freq1 * time) + 
                      Math.sin(2 * Math.PI * freq2 * time) * 0.5) * envelope * 0.4;
        }
    }
    
    /**
     * 生成失败音效
     */
    generateFail(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const progress = time / config.duration;
            const freq = config.frequency * (1 - progress * 0.5);
            const envelope = Math.exp(-time * 2);
            
            data[i] = Math.sin(2 * Math.PI * freq * time) * envelope * 0.5;
        }
    }
    
    /**
     * 生成撞击音效
     */
    generateImpact(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 8);
            const noise = (Math.random() - 0.5) * 2;
            const lowFreq = Math.sin(2 * Math.PI * config.frequency * time);
            
            data[i] = (lowFreq + noise * 0.7) * envelope * 0.6;
        }
    }
    
    /**
     * 生成魔法音效
     */
    generateMagical(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const progress = time / config.duration;
            const freq = config.frequency * (1 + Math.sin(time * 10) * 0.3);
            const envelope = Math.sin(Math.PI * progress) * 0.8;
            const sparkle = Math.sin(2 * Math.PI * freq * 3 * time) * 0.3;
            
            data[i] = (Math.sin(2 * Math.PI * freq * time) + sparkle) * envelope * 0.5;
        }
    }
    
    /**
     * 生成点击音效
     */
    generateClick(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 20);
            
            data[i] = Math.sin(2 * Math.PI * config.frequency * time) * envelope * 0.6;
        }
    }
    
    /**
     * 生成奖励音效
     */
    generateBonus(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const progress = time / config.duration;
            const freq = config.frequency * (1 + progress);
            const envelope = Math.sin(Math.PI * progress);
            const harmony = Math.sin(2 * Math.PI * freq * 1.5 * time) * 0.3;
            
            data[i] = (Math.sin(2 * Math.PI * freq * time) + harmony) * envelope * 0.5;
        }
    }
    
    /**
     * 生成庆祝音效
     */
    generateCelebration(data, config, sampleRate) {
        const notes = [1, 1.25, 1.5, 2]; // 上升音阶
        const noteLength = data.length / notes.length;
        
        for (let i = 0; i < data.length; i++) {
            const noteIndex = Math.floor(i / noteLength);
            const freq = config.frequency * notes[noteIndex % notes.length];
            const time = i / sampleRate;
            const noteTime = (i % noteLength) / sampleRate;
            const envelope = Math.exp(-noteTime * 3) * 0.8;
            
            data[i] = Math.sin(2 * Math.PI * freq * time) * envelope * 0.6;
        }
    }
    
    /**
     * 生成水声音效
     */
    generateWater(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 4);
            const noise = (Math.random() - 0.5) * 2;
            const bubble = Math.sin(2 * Math.PI * config.frequency * time * (1 + Math.random() * 0.5));
            
            data[i] = (bubble * 0.3 + noise * 0.7) * envelope * 0.4;
        }
    }
    
    /**
     * 生成蜂鸣音效
     */
    generateBeep(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 5);
            
            data[i] = Math.sin(2 * Math.PI * config.frequency * time) * envelope * 0.7;
        }
    }
    
    /**
     * 生成界面音效
     */
    generateInterface(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 10);
            
            data[i] = Math.sin(2 * Math.PI * config.frequency * time) * envelope * 0.5;
        }
    }
    
    /**
     * 生成基础音调
     */
    generateTone(data, config, sampleRate) {
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const envelope = Math.exp(-time * 3);
            
            data[i] = Math.sin(2 * Math.PI * config.frequency * time) * envelope * 0.5;
        }
    }
    
    /**
     * 播放背景音乐
     */
    playMusic(name, loop = true) {
        if (this.settings.muted || !this.audioContext) return;
        
        // 停止当前音乐
        this.stopMusic();
        
        const bufferKey = `music_${name}`;
        const buffer = this.audioBuffers.get(bufferKey);
        
        if (!buffer) {
            console.warn(`音乐文件不存在: ${name}`);
            return;
        }
        
        try {
            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = buffer;
            this.musicSource.loop = loop;
            this.musicSource.connect(this.musicGain);
            
            this.musicSource.start();
            this.currentMusic = name;
            
            console.log(`播放背景音乐: ${name}`);
            
        } catch (error) {
            console.warn(`播放音乐失败: ${name}`, error);
        }
    }
    
    /**
     * 停止背景音乐
     */
    stopMusic() {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (error) {
                // 忽略已停止的音源错误
            }
            this.musicSource = null;
        }
        this.currentMusic = null;
    }
    
    /**
     * 播放音效
     */
    playSfx(name, volume = 1) {
        if (this.settings.muted || !this.audioContext) return;
        
        const bufferKey = `sfx_${name}`;
        const buffer = this.audioBuffers.get(bufferKey);
        
        if (!buffer) {
            console.warn(`音效文件不存在: ${name}`);
            return;
        }
        
        // 限制同时播放的音效数量
        if (this.sfxQueue.length >= this.maxConcurrentSfx) {
            const oldestSfx = this.sfxQueue.shift();
            try {
                oldestSfx.stop();
            } catch (error) {
                // 忽略已停止的音源错误
            }
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            gainNode.gain.value = this.settings.sfxVolume * volume;
            
            source.start();
            this.sfxQueue.push(source);
            
            // 音效结束后从队列中移除
            source.onended = () => {
                const index = this.sfxQueue.indexOf(source);
                if (index > -1) {
                    this.sfxQueue.splice(index, 1);
                }
            };
            
        } catch (error) {
            console.warn(`播放音效失败: ${name}`, error);
        }
    }
    
    /**
     * 设置主音量
     */
    setMasterVolume(volume) {
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.settings.masterVolume;
        }
        this.saveSettings();
    }
    
    /**
     * 设置音乐音量
     */
    setMusicVolume(volume) {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.settings.musicVolume;
        }
        this.saveSettings();
    }
    
    /**
     * 设置音效音量
     */
    setSfxVolume(volume) {
        this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    /**
     * 切换静音状态
     */
    toggleMute() {
        this.settings.muted = !this.settings.muted;
        
        if (this.settings.muted) {
            this.stopMusic();
            this.stopAllSfx();
        }
        
        this.saveSettings();
        return this.settings.muted;
    }
    
    /**
     * 停止所有音效
     */
    stopAllSfx() {
        this.sfxQueue.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                // 忽略已停止的音源错误
            }
        });
        this.sfxQueue = [];
    }
    
    /**
     * 暂停音频
     */
    pause() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
    
    /**
     * 恢复音频
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('catFishing_audioSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('保存音频设置失败:', error);
        }
    }
    
    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('catFishing_audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.settings, settings);
                
                // 应用设置
                if (this.masterGain) {
                    this.masterGain.gain.value = this.settings.masterVolume;
                }
                if (this.musicGain) {
                    this.musicGain.gain.value = this.settings.musicVolume;
                }
            }
        } catch (error) {
            console.warn('加载音频设置失败:', error);
        }
    }
    
    /**
     * 获取音频设置
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * 获取音频状态
     */
    getStatus() {
        return {
            initialized: !!this.audioContext,
            contextState: this.audioContext ? this.audioContext.state : 'closed',
            currentMusic: this.currentMusic,
            activeSfx: this.sfxQueue.length,
            muted: this.settings.muted
        };
    }
    
    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopMusic();
        this.stopAllSfx();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.audioBuffers.clear();
        this.audioSources.clear();
        
        console.log('音频管理器已销毁');
    }
}

// 导出音频管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
} else {
    window.AudioManager = AudioManager;
}