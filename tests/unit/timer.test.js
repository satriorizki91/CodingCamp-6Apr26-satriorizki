import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// FocusTimer class definition for testing
class FocusTimer {
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Container element is required');
        }
        this.container = containerElement;
        this.totalSeconds = 1500; // 25 minutes
        this.remainingSeconds = 1500;
        this.isRunning = false;
        this.intervalId = null;
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <h3>Focus Timer</h3>
            <div class="timer-display">${this.formatTime(this.remainingSeconds)}</div>
            <div class="timer-controls">
                <button class="start-btn">Start</button>
                <button class="stop-btn">Stop</button>
                <button class="reset-btn">Reset</button>
            </div>
        `;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const minutesStr = String(minutes).padStart(2, '0');
        const secondsStr = String(secs).padStart(2, '0');
        return `${minutesStr}:${secondsStr}`;
    }

    tick() {
        if (this.remainingSeconds > 0) {
            this.remainingSeconds--;
            this.updateDisplay();
            
            // Stop at zero
            if (this.remainingSeconds === 0) {
                this.stop();
            }
        }
    }

    updateDisplay() {
        const timeDisplay = this.container.querySelector('.timer-display');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(this.remainingSeconds);
        }
    }

    start() {
        // Prevent multiple intervals
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.stop();
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
    }

    attachEventListeners() {
        const startBtn = this.container.querySelector('.start-btn');
        const stopBtn = this.container.querySelector('.stop-btn');
        const resetBtn = this.container.querySelector('.reset-btn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    destroy() {
        this.stop();
    }
}

describe('FocusTimer Edge Cases', () => {
    let container;
    let timer;

    beforeEach(() => {
        // Create a mock container element
        container = document.createElement('div');
    });

    afterEach(() => {
        if (timer) {
            timer.destroy();
        }
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    describe('Requirement 2.2: Multiple start clicks prevention', () => {
        it('should prevent multiple intervals when start clicked repeatedly', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            // Start the timer
            timer.start();
            expect(timer.isRunning).toBe(true);
            const firstIntervalId = timer.intervalId;
            
            // Try to start again
            timer.start();
            expect(timer.isRunning).toBe(true);
            expect(timer.intervalId).toBe(firstIntervalId); // Same interval ID
            
            // Try to start multiple times
            timer.start();
            timer.start();
            timer.start();
            expect(timer.intervalId).toBe(firstIntervalId); // Still same interval ID
        });

        it('should only decrement once per second even with multiple start attempts', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            const initialSeconds = timer.remainingSeconds;
            
            // Start the timer
            timer.start();
            
            // Try to start multiple times
            timer.start();
            timer.start();
            
            // Advance time by 1 second
            vi.advanceTimersByTime(1000);
            
            // Should only decrement once
            expect(timer.remainingSeconds).toBe(initialSeconds - 1);
        });
    });

    describe('Requirement 2.5: Timer stops at zero', () => {
        it('should stop the timer when countdown reaches zero', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            // Set timer to 2 seconds for testing
            timer.remainingSeconds = 2;
            timer.updateDisplay();
            
            timer.start();
            expect(timer.isRunning).toBe(true);
            
            // Advance 1 second
            vi.advanceTimersByTime(1000);
            expect(timer.remainingSeconds).toBe(1);
            expect(timer.isRunning).toBe(true);
            
            // Advance 1 more second (reaches zero)
            vi.advanceTimersByTime(1000);
            expect(timer.remainingSeconds).toBe(0);
            expect(timer.isRunning).toBe(false);
            expect(timer.intervalId).toBe(null);
        });

        it('should display "00:00" when timer reaches zero', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            // Set timer to 1 second
            timer.remainingSeconds = 1;
            timer.updateDisplay();
            
            timer.start();
            
            // Advance to zero
            vi.advanceTimersByTime(1000);
            
            const display = container.querySelector('.timer-display');
            expect(display.textContent).toBe('00:00');
        });

        it('should not decrement below zero', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            // Set timer to 1 second
            timer.remainingSeconds = 1;
            timer.start();
            
            // Advance past zero
            vi.advanceTimersByTime(5000);
            
            // Should stop at zero
            expect(timer.remainingSeconds).toBe(0);
        });

        it('should not restart automatically after reaching zero', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            timer.remainingSeconds = 1;
            timer.start();
            
            // Reach zero
            vi.advanceTimersByTime(1000);
            expect(timer.remainingSeconds).toBe(0);
            expect(timer.isRunning).toBe(false);
            
            // Advance more time
            vi.advanceTimersByTime(5000);
            
            // Should still be at zero and not running
            expect(timer.remainingSeconds).toBe(0);
            expect(timer.isRunning).toBe(false);
        });
    });

    describe('Combined edge cases', () => {
        it('should handle start clicks after timer reaches zero', () => {
            vi.useFakeTimers();
            
            timer = new FocusTimer(container);
            timer.init();
            
            timer.remainingSeconds = 1;
            timer.start();
            
            // Reach zero
            vi.advanceTimersByTime(1000);
            expect(timer.isRunning).toBe(false);
            
            // Try to start again (should do nothing since remainingSeconds is 0)
            timer.start();
            expect(timer.isRunning).toBe(true); // Will start but won't tick
            
            // Advance time
            vi.advanceTimersByTime(1000);
            
            // Should still be at zero (tick() checks remainingSeconds > 0)
            expect(timer.remainingSeconds).toBe(0);
        });
    });
});
