import { PlayerIdentity } from './PlayerIdentity.js';

export interface GameStats {
    playerName: string;
    startTime: number;
    endTime: number | undefined;
    duration: number | undefined; // in milliseconds
    hintsUsed: number;
    successfulIntersections: number;
    boardName?: string;
}

/**
 * StatsCollector - Collects and manages game statistics
 */
export abstract class StatsCollector {
    protected stats: GameStats;

    constructor(boardName?: string) {
        this.stats = {
            playerName: PlayerIdentity.getPlayerName(),
            startTime: Date.now(),
            endTime: undefined,
            duration: undefined,
            hintsUsed: 0,
            successfulIntersections: 0,
            boardName,
        };
    }

    /**
     * Records the start of a new game
     * @param boardName - Optional name of the board/level
     */
    startGame(boardName?: string): void {
        this.stats = {
            playerName: PlayerIdentity.getPlayerName(),
            startTime: Date.now(),
            endTime: undefined,
            duration: undefined,
            hintsUsed: 0,
            successfulIntersections: 0,
            boardName,
        };
    }

    /**
     * Records the end of a game and calculates duration
     */
    endGame(): void {
        if (this.stats.endTime) {
            return; // Prevent multiple endings
        }
        this.stats.endTime = Date.now();
        this.stats.duration = this.stats.endTime - this.stats.startTime;
    }

    /**
     * Increments the hint counter
     */
    recordHintUsed(): void {
        this.stats.hintsUsed++;
    }

    /**
     * Increments the successful intersections counter
     */
    recordSuccessfulIntersection(): void {
        this.stats.successfulIntersections++;
    }

    /**
     * Gets the current statistics
     * @returns A copy of the current stats
     */
    getStats(): GameStats {
        return { ...this.stats };
    }

    /**
     * Gets the current game duration in milliseconds
     * @returns Duration in milliseconds, or undefined if game hasn't ended
     */
    getDuration(): number | undefined {
        if (this.stats.endTime) {
            return this.stats.duration;
        }
        // Return current duration if game is still in progress
        return Date.now() - this.stats.startTime;
    }

    /**
     * Gets the formatted duration string (MM:SS)
     * @returns Formatted duration string
     */
    getFormattedDuration(): string {
        const duration = this.getDuration();
        if (duration === undefined) return '00:00';

        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
        const secondsStr = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();

        return `${minutesStr}:${secondsStr}`;
    }

    /**
     * Abstract method to upload stats to a server/database
     * Must be implemented by concrete classes
     */
    abstract uploadStats(): Promise<void>;

    /**
     * Resets all statistics
     */
    reset(): void {
        this.stats = {
            playerName: PlayerIdentity.getPlayerName(),
            startTime: Date.now(),
            endTime: undefined,
            duration: undefined,
            hintsUsed: 0,
            successfulIntersections: 0,
            boardName: this.stats.boardName,
        };
    }
}

/**
 * Default implementation of StatsCollector for local storage
 */
export class LocalStatsCollector extends StatsCollector {
    /**
     * Uploads stats to local storage (or console for now)
     */
    async uploadStats(): Promise<void> {
        // For now, just log to console
        // In the future, this could save to localStorage or send to a server
        console.log('Game Stats:', this.getStats());

        // Example: Save to localStorage
        try {
            const allStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
            allStats.push(this.getStats());
            localStorage.setItem('gameStats', JSON.stringify(allStats));
        } catch (error) {
            console.error('Failed to save stats to localStorage:', error);
        }
    }
}
