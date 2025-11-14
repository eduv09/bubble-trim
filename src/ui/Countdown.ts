/**
 * Countdown - Displays a countdown (3, 2, 1) before game starts
 */
export class Countdown {
    private container: HTMLElement;
    private onComplete?: () => void;
    private countdownInterval: number | null = null;

    constructor() {
        this.container = document.getElementById('countdown-overlay')!;
        if (!this.container) {
            throw new Error('countdown-overlay container not found');
        }
    }

    /**
     * Start the countdown sequence
     * @param onComplete - Callback to execute when countdown finishes
     */
    start(onComplete: () => void): void {
        this.onComplete = onComplete;

        // Show the overlay
        this.container.style.display = 'flex';

        // Start countdown from 3
        let count = 3;
        this.updateDisplay(count);

        // Clear any existing interval
        if (this.countdownInterval !== null) {
            clearInterval(this.countdownInterval);
        }

        // Update every second
        this.countdownInterval = window.setInterval(() => {
            count--;

            if (count > 0) {
                this.updateDisplay(count);
            } else {
                // Countdown complete
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }, 1000);
    }

    /**
     * Update the countdown display
     */
    private updateDisplay(count: number): void {
        const numberElement = document.getElementById('countdown-number');
        if (numberElement) {
            numberElement.textContent = count.toString();

            // Trigger animation by removing and re-adding class
            numberElement.classList.remove('countdown-animate');
            // Force reflow to restart animation
            void numberElement.offsetWidth;
            numberElement.classList.add('countdown-animate');
        }
    }

    /**
     * Stop and hide the countdown
     */
    stop(): void {
        if (this.countdownInterval !== null) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        this.container.style.display = 'none';
    }

    /**
     * Check if countdown is currently active
     */
    isActive(): boolean {
        return this.container.style.display !== 'none';
    }
}
