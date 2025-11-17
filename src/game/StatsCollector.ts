import { Board } from './Board.js';
import { GameDataManager } from './game-data/GameData.js';
import { PlayerIdentity } from './PlayerIdentity.js';
import { FirestoreService } from '../data/FirestoreService.js';

export interface IGameStats {
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
export class StatsCollector {
    protected stats: IGameStats;
    protected gameDataManager: GameDataManager;

    constructor(boardName?: string, firestoreService?: FirestoreService) {
        this.stats = {
            playerName: PlayerIdentity.getPlayerName(),
            startTime: Date.now(),
            endTime: undefined,
            duration: undefined,
            hintsUsed: 0,
            successfulIntersections: 0,
            boardName,
        };

        // Create GameDataManager with FirestoreService if provided
        if (firestoreService) {
            this.gameDataManager = new GameDataManager(this.stats.playerName, firestoreService);
        } else {
            // Fallback for cases where FirestoreService is not available (shouldn't happen in normal flow)
            throw new Error('FirestoreService is required for StatsCollector');
        }
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
    endGame(board: Board): void {
        if (this.stats.endTime) {
            return; // Prevent multiple endings
        }
        this.stats.endTime = Date.now();
        this.stats.duration = this.stats.endTime - this.stats.startTime;

        this.gameDataManager.addGameData(this.stats, board);
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
    getStats(): IGameStats {
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

    /**
     * Gets the GameDataManager instance
     * @returns The GameDataManager instance
     */
    getGameDataManager(): GameDataManager {
        return this.gameDataManager;
    }
}
