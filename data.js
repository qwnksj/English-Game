// data.js - 英语单词记忆游戏数据管理

class DataManager {
    constructor() {
        this.config = this.loadConfig();
        this.wordStats = this.loadWordStats();
        this.gameRecords = this.loadGameRecords();
        this.currentBank = this.config.currentBank || 'words.txt';
        this.progress = this.loadProgress();
    }

    // 初始化
    init() {
        console.log('数据管理器初始化完成');
        return this;
    }

    // 配置管理
    loadConfig() {
        const defaultConfig = {
            currentBank: 'words.txt',
            autoDelay: 1.5,
            soundEffects: true,
            showHints: true,
            difficultyAdjust: true,
            randomSelection: true
        };
        
        try {
            const saved = localStorage.getItem('wordGameConfig');
            return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
        } catch (e) {
            console.error('加载配置失败:', e);
            return defaultConfig;
        }
    }

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        try {
            localStorage.setItem('wordGameConfig', JSON.stringify(this.config));
            return true;
        } catch (e) {
            console.error('保存配置失败:', e);
            return false;
        }
    }

    getConfig() {
        return { ...this.config };
    }

    // 单词统计管理
    loadWordStats() {
        try {
            const stats = localStorage.getItem('wordGameStats');
            return stats ? JSON.parse(stats) : {};
        } catch (e) {
            console.error('加载单词统计失败:', e);
            return {};
        }
    }

    saveWordStats() {
        try {
            localStorage.setItem('wordGameStats', JSON.stringify(this.wordStats));
            return true;
        } catch (e) {
            console.error('保存单词统计失败:', e);
            return false;
        }
    }

    updateWordStat(word, result) {
        if (!this.wordStats[word]) {
            this.wordStats[word] = {
                studied: false,
                difficulty: 1,
                wrongTimes: 0,
                correctTimes: 0,
                accuracy: 0,
                lastStudied: Date.now(),
                masterLevel: 0
            };
        }

        const stat = this.wordStats[word];
        stat.studied = true;
        stat.lastStudied = Date.now();

        if (result === 'correct') {
            stat.correctTimes++;
        } else if (result === 'wrong') {
            stat.wrongTimes++;
        }

        const total = stat.correctTimes + stat.wrongTimes;
        if (total > 0) {
            stat.accuracy = (stat.correctTimes / total * 100).toFixed(1);
        }

        // 动态调整难度
        if (this.config.difficultyAdjust && total >= 5) {
            if (stat.accuracy > 80 && stat.difficulty > 1) {
                stat.difficulty--;
            } else if (stat.accuracy < 40 && stat.difficulty < 3) {
                stat.difficulty++;
            }
        }

        // 更新掌握程度
        if (total >= 10) {
            if (stat.accuracy >= 90) stat.masterLevel = 5;
            else if (stat.accuracy >= 80) stat.masterLevel = 4;
            else if (stat.accuracy >= 70) stat.masterLevel = 3;
            else if (stat.accuracy >= 60) stat.masterLevel = 2;
            else stat.masterLevel = 1;
        }

        this.saveWordStats();
        return stat;
    }

    getWordStat(word) {
        return this.wordStats[word] || {
            studied: false,
            difficulty: 1,
            wrongTimes: 0,
            correctTimes: 0,
            accuracy: 0,
            lastStudied: 0,
            masterLevel: 0
        };
    }

    // 游戏记录管理
    loadGameRecords() {
        try {
            const records = localStorage.getItem('wordGameRecords');
            return records ? JSON.parse(records) : [];
        } catch (e) {
            console.error('加载游戏记录失败:', e);
            return [];
        }
    }

    saveGameRecord(record) {
        const fullRecord = {
            ...record,
            timestamp: Date.now(),
            date: new Date().toLocaleString('zh-CN')
        };
        
        this.gameRecords.push(fullRecord);
        
        try {
            localStorage.setItem('wordGameRecords', JSON.stringify(this.gameRecords));
            return true;
        } catch (e) {
            console.error('保存游戏记录失败:', e);
            return false;
        }
    }

    getGameRecords(limit = 50) {
        return this.gameRecords.slice(-limit).reverse();
    }

    // 词库管理
    setCurrentBank(bankFile) {
        this.currentBank = bankFile;
        this.config.currentBank = bankFile;
        this.saveConfig(this.config);
    }

    getCurrentBank() {
        const bankNames = {
            'words.txt': { name: '我的词库 (3500词)', count: 3500 },
            'words_basic.txt': { name: '基础词汇', count: 100 },
            'words_intermediate.txt': { name: '中级词汇', count: 200 },
            'words_advanced.txt': { name: '高级词汇', count: 300 },
            'words_exam.txt': { name: '考试重点', count: 500 },
            'words_custom.txt': { name: '自定义库', count: 0 },
            'all': { name: '全部词汇', count: 4100 }
        };
        
        return bankNames[this.currentBank] || { name: '未知词库', count: 0 };
    }

    // 学习进度
    loadProgress() {
        try {
            const progress = localStorage.getItem('wordGameProgress');
            return progress ? JSON.parse(progress) : {
                studied: 0,
                total: 3500,
                accuracy: 0,
                streak: 0,
                lastStudyDate: null
            };
        } catch (e) {
            console.error('加载学习进度失败:', e);
            return {
                studied: 0,
                total: 3500,
                accuracy: 0,
                streak: 0,
                lastStudyDate: null
            };
        }
    }

    updateProgress() {
        // 计算已学习单词数
        const studiedWords = Object.values(this.wordStats).filter(stat => stat.studied).length;
        
        // 计算平均正确率
        const stats = Object.values(this.wordStats);
        const totalAttempts = stats.reduce((sum, stat) => sum + stat.correctTimes + stat.wrongTimes, 0);
        const totalCorrect = stats.reduce((sum, stat) => sum + stat.correctTimes, 0);
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts * 100).toFixed(1) : 0;
        
        // 更新连击天数
        const today = new Date().toDateString();
        let streak = this.progress.streak || 0;
        
        if (this.progress.lastStudyDate) {
            const lastDate = new Date(this.progress.lastStudyDate);
            const daysDiff = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                streak++;
            } else if (daysDiff > 1) {
                streak = 1;
            }
        } else {
            streak = 1;
        }
        
        this.progress = {
            studied: studiedWords,
            total: this.getCurrentBank().count,
            accuracy: accuracy,
            streak: streak,
            lastStudyDate: today
        };
        
        this.saveProgress();
        return this.progress;
    }

    getProgress() {
        return this.updateProgress();
    }

    saveProgress() {
        try {
            localStorage.setItem('wordGameProgress', JSON.stringify(this.progress));
            return true;
        } catch (e) {
            console.error('保存学习进度失败:', e);
            return false;
        }
    }

    // 导出导入数据
    exportData() {
        const data = {
            config: this.config,
            wordStats: this.wordStats,
            gameRecords: this.gameRecords,
            progress: this.progress,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        return {
            blob: blob,
            url: url,
            filename: `word_game_backup_${Date.now()}.json`
        };
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.config) {
                this.config = data.config;
                localStorage.setItem('wordGameConfig', JSON.stringify(this.config));
            }
            
            if (data.wordStats) {
                this.wordStats = data.wordStats;
                localStorage.setItem('wordGameStats', JSON.stringify(this.wordStats));
            }
            
            if (data.gameRecords) {
                this.gameRecords = data.gameRecords;
                localStorage.setItem('wordGameRecords', JSON.stringify(this.gameRecords));
            }
            
            if (data.progress) {
                this.progress = data.progress;
                localStorage.setItem('wordGameProgress', JSON.stringify(this.progress));
            }
            
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    // 重置数据
    resetData() {
        if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
            localStorage.removeItem('wordGameConfig');
            localStorage.removeItem('wordGameStats');
            localStorage.removeItem('wordGameRecords');
            localStorage.removeItem('wordGameProgress');
            
            this.config = this.loadConfig();
            this.wordStats = {};
            this.gameRecords = [];
            this.progress = this.loadProgress();
            
            return true;
        }
        return false;
    }

    // 保存所有数据
    saveAll() {
        this.saveConfig(this.config);
        this.saveWordStats();
        this.saveProgress();
        return true;
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 导出到全局
window.dataManager = dataManager;