class PomodoroTimer {
    constructor() {
        this.workTime = 25 * 60; // 25分を秒に変換
        this.breakTime = 5 * 60; // 5分を秒に変換
        this.longBreakTime = 15 * 60; // 15分を秒に変換
        this.currentTime = this.workTime;
        this.isRunning = false;
        this.isWorkPhase = true;
        this.completedPomodoros = 0;
        this.todayWorkTime = 0;
        this.interval = null;
        this.audioContext = null;
        this.oscillator = null;
        
        this.initializeElements();
        this.loadStats();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('time');
        this.phaseDisplay = document.getElementById('phase');
        this.progressFill = document.getElementById('progress-fill');
        this.startBtn = document.getElementById('start');
        this.pauseBtn = document.getElementById('pause');
        this.resetBtn = document.getElementById('reset');
        this.workTimeInput = document.getElementById('work-time');
        this.breakTimeInput = document.getElementById('break-time');
        this.longBreakTimeInput = document.getElementById('long-break-time');
        this.completedPomodorosDisplay = document.getElementById('completed-pomodoros');
        this.todayWorkTimeDisplay = document.getElementById('today-work-time');
        this.notification = document.getElementById('notification');
        this.notificationMessage = document.getElementById('notification-message');
        this.notificationClose = document.getElementById('notification-close');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.workTimeInput.addEventListener('change', () => {
            this.workTime = parseInt(this.workTimeInput.value) * 60;
            if (!this.isRunning) {
                this.currentTime = this.workTime;
                this.updateDisplay();
            }
        });
        
        this.breakTimeInput.addEventListener('change', () => {
            this.breakTime = parseInt(this.breakTimeInput.value) * 60;
        });
        
        this.longBreakTimeInput.addEventListener('change', () => {
            this.longBreakTime = parseInt(this.longBreakTimeInput.value) * 60;
        });
        
        this.notificationClose.addEventListener('click', () => {
            this.hideNotification();
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            
            // 作業フェーズの場合はアニメーションを追加
            if (this.isWorkPhase) {
                document.querySelector('.timer-display').classList.add('working');
            }
            
            this.interval = setInterval(() => {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.completePhase();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            
            document.querySelector('.timer-display').classList.remove('working');
            
            clearInterval(this.interval);
        }
    }

    reset() {
        this.pause();
        this.currentTime = this.isWorkPhase ? this.workTime : this.breakTime;
        this.updateDisplay();
    }

    completePhase() {
        this.pause();
        this.playNotificationSound();
        
        if (this.isWorkPhase) {
            // 作業フェーズ完了
            this.completedPomodoros++;
            this.todayWorkTime += this.workTime;
            this.saveStats();
            this.showNotification('作業時間が終了しました！休憩時間を取ってください。');
            
            // 4ポモドーロごとに長い休憩
            if (this.completedPomodoros % 4 === 0) {
                this.currentTime = this.longBreakTime;
                this.phaseDisplay.textContent = '長い休憩時間';
            } else {
                this.currentTime = this.breakTime;
                this.phaseDisplay.textContent = '休憩時間';
            }
            this.isWorkPhase = false;
        } else {
            // 休憩フェーズ完了
            this.showNotification('休憩時間が終了しました！次の作業を始めましょう。');
            this.currentTime = this.workTime;
            this.phaseDisplay.textContent = '作業時間';
            this.isWorkPhase = true;
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // プログレスバーの更新
        const totalTime = this.isWorkPhase ? this.workTime : (this.completedPomodoros % 4 === 0 ? this.longBreakTime : this.breakTime);
        const progress = ((totalTime - this.currentTime) / totalTime) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // 統計の更新
        this.completedPomodorosDisplay.textContent = this.completedPomodoros;
        this.todayWorkTimeDisplay.textContent = `${Math.floor(this.todayWorkTime / 60)}分`;
    }

    showNotification(message) {
        this.notificationMessage.textContent = message;
        this.notification.classList.add('show');
        
        // 5秒後に自動で非表示
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        this.notification.classList.remove('show');
    }

    playNotificationSound() {
        try {
            // Web Audio APIを使用して通知音を生成
            this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            this.oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            this.oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            this.oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
            this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            this.oscillator.start(this.audioContext.currentTime);
            this.oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('通知音の再生に失敗しました:', error);
        }
    }

    saveStats() {
        const today = new Date().toDateString();
        const stats = {
            completedPomodoros: this.completedPomodoros,
            todayWorkTime: this.todayWorkTime,
            lastUpdated: today
        };
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    }

    loadStats() {
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            const today = new Date().toDateString();
            
            // 今日のデータかチェック
            if (stats.lastUpdated === today) {
                this.completedPomodoros = stats.completedPomodoros;
                this.todayWorkTime = stats.todayWorkTime;
            } else {
                // 新しい日なのでリセット
                this.completedPomodoros = 0;
                this.todayWorkTime = 0;
            }
        }
    }
}

// ページ読み込み時にタイマーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

// ページが非表示になった時にタイマーを一時停止
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ページが非表示になった時の処理（必要に応じて）
    }
}); 