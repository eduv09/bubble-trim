/**
 * ProgressCard - Displays game progress including lives, timer, and completion percentage
 */
export class ProgressCard {
    private container: HTMLElement;
    private livesContainer: HTMLElement;
    private timerElement: HTMLElement;
    private progressElement: HTMLElement;
    private onHintCallback?: () => void;
    private maxLives: number = 3;
    private currentLives: number = 3;
    private startTime: number = 0;
    private timerInterval: number | null = null;

    constructor() {
        this.container = document.getElementById('progress-card')!;
        if (!this.container) {
            throw new Error('progress-card container not found');
        }

        this.initializeCard();
        this.livesContainer = document.getElementById('lives-container')!;
        this.timerElement = document.getElementById('timer-value')!;
        this.progressElement = document.getElementById('progress-percentage')!;
    }

    /**
     * Register a callback that will be called when the hint button is pressed.
     * The game-level logic (GameState) should handle consuming a life and recording the hint.
     */
    setOnHintCallback(callback: () => void): void {
        this.onHintCallback = callback;
    }

    /**
     * Initialize the progress card structure
     */
    private initializeCard(): void {
        this.container.innerHTML = `
            <div class="progress-card-content">
                <div class="lives-section">
                    <div id="lives-container" class="lives-container"></div>
                </div>
                <div class="progress-stats-section">
                    <div class="timer-display">
                        <span class="stat-icon">⏱️</span>
                        <span id="timer-value" class="stat-value">00:00</span>
                    </div>
                    <div class="progress-display">
                        <span class="stat-icon">📊</span>
                        <span id="progress-percentage" class="stat-value">0%</span>
                    </div>
                </div>
                <button id="hint-button" class="hint-button">💡 Hint</button>
            </div>
        `;

        // Setup hint button event listener
        const hintButton = document.getElementById('hint-button')!;
        hintButton.addEventListener('click', () => this.onHintClick());
    }

    /**
     * Handle hint button click
     */
    private onHintClick(): void {
        // Prefer delegating hint handling to the game-level via callback so the
        // board, stats collector and UI remain in sync. If no callback is set,
        // fall back to consuming a life locally for backward compatibility.
        if (this.onHintCallback) {
            this.onHintCallback();
        } else {
            if (this.currentLives > 0) {
                this.loseLife();
                // TODO: Implement hint logic
                console.log('Hint requested (local fallback)! Lives remaining:', this.currentLives);
            }
        }
    }

    /**
     * Start the game timer
     * @param offsetSeconds - Optional offset in seconds (can be negative to start ahead)
     */
    startTimer(offsetSeconds: number = 0): void {
        this.startTime = Date.now() - (offsetSeconds * 1000);

        // Clear any existing interval
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
        }

        // Update timer every 0.1 seconds
        this.timerInterval = window.setInterval(() => {
            this.updateTimer();
        }, 100);

        // Initial update
        this.updateTimer();
    }

    /**
     * Stop the timer
     */
    stopTimer(): void {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Update the timer display
     */
    private updateTimer(): void {
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
        const secondsStr = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();

        this.timerElement.textContent = `${minutesStr}:${secondsStr}`;
    }

    /**
     * Update the progress percentage
     * @param progress - Progress value as a string (e.g., "75.50")
     */
    updateProgress(progress: string): void {
        this.progressElement.textContent = `${progress}%`;
    }

    /**
     * Reset lives to maximum
     */
    resetLives(): void {
        this.currentLives = this.maxLives;
        this.renderLives();
    }

    /**
     * Lose one life
     * @returns The current number of lives remaining
     */
    loseLife(): number {
        if (this.currentLives > 0) {
            this.currentLives--;
            this.renderLives();
            this.animateLivesShake();
        }
        return this.currentLives;
    }

    /**
     * Get current number of lives
     */
    getCurrentLives(): number {
        return this.currentLives;
    }

    /**
     * Render the lives display
     */
    private renderLives(): void {
        this.livesContainer.innerHTML = '';

        for (let i = 0; i < this.maxLives; i++) {
            const life = document.createElement('div');
            life.className = 'life-icon';

            if (i < this.currentLives) {
                // Full heart
                life.classList.add('life-full');
                life.innerHTML = '❤️';
            } else {
                // Empty heart
                life.classList.add('life-empty');
                life.innerHTML = '🤍';
            }

            this.livesContainer.appendChild(life);
        }
    }

    /**
     * Animate the lives container when a life is lost
     */
    private animateLivesShake(): void {
        this.livesContainer.classList.add('shake');
        setTimeout(() => {
            this.livesContainer.classList.remove('shake');
        }, 500);
    }

    /**
     * Show the progress card
     */
    show(): void {
        this.container.style.display = 'flex';
        this.resetLives();
        this.startTimer();
    }

    /**
     * Hide the progress card
     */
    hide(): void {
        this.container.style.display = 'none';
        this.stopTimer();
    }

    /**
     * Reset the entire card
     */
    reset(): void {
        this.resetLives();
        this.startTimer();
        this.updateProgress('0');
    }
}
