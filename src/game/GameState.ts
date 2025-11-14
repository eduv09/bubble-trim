import type p5 from 'p5';
import { Board } from './Board.js';
import { SoundManager } from '../sound/SoundManager.js';
import { CameraController } from '../camera/CameraController.js';
import { UIManager } from '../ui/UIManager.js';
import { StatsCollector } from './StatsCollector.js';
import { ProgressCard } from '../ui/ProgressCard.js';
import { Countdown } from '../ui/Countdown.js';

/**
 * GameState - Manages the game state including board, playing status, and hunting mode
 */
export class GameState {
    private p: p5;
    public activeBoard: Board;
    public isHunting: boolean = false;
    public isPlaying: boolean = true;
    public lastBoard: any = null;
    public soundManager: SoundManager;
    private camera: CameraController;
    public statsCollector: StatsCollector;
    private onNextLevelCallback?: () => boolean;
    public progressCard: ProgressCard;
    public countdown: Countdown;
    public isCountingDown: boolean = false;

    constructor(p: p5, initialBoard: any, soundManager: SoundManager, camera: CameraController, progressCard: ProgressCard, countdown: Countdown) {
        this.p = p;
        this.soundManager = soundManager;
        this.camera = camera;
        this.progressCard = progressCard;
        this.countdown = countdown;
        this.activeBoard = new Board(p, initialBoard, soundManager);
        this.lastBoard = initialBoard;
        this.statsCollector = new StatsCollector();
    }

    /**
     * Loads a new map/level
     * @param circles - The circle data for the new level
     */
    loadMap(circles: any): void {
        this.activeBoard = new Board(this.p, circles, this.soundManager);
        this.camera.reset();
        this.camera.zoomLevel = this.camera.calculateZoomScale(circles);
        this.lastBoard = circles;
        this.isPlaying = false; // Don't allow playing until countdown finishes
        this.isCountingDown = true;
        UIManager.hidePanel('result-panel');

        // Show progress card but don't start timer yet
        this.progressCard.show();
        this.progressCard.resetLives();
        this.progressCard.updateProgress(this.activeBoard.getProgress());

        // Start countdown
        this.countdown.start(() => {
            // Countdown complete - start the game
            this.isPlaying = true;
            this.isCountingDown = false;

            this.progressCard.startTimer(0);

            // Start tracking stats for this board
            const boardName = circles.name || 'Unknown Board';
            this.statsCollector.startGame(boardName);
        });
    }

    /**
     * Restarts the current level
     */
    restart(): void {
        if (this.lastBoard) {
            UIManager.hidePanel('result-panel');
            this.loadMap(this.lastBoard);
        }
    }

    /**
     * Updates the game state
     */
    update(): void {
        this.progressCard.updateProgress(this.activeBoard.getProgress());
        this.activeBoard.update();
    }

    /**
     * Checks if the player has won
     * @returns true if victory condition is met
     */
    checkVictory(): boolean {
        if (this.activeBoard.checkVictory() && this.isPlaying) {
            this.isPlaying = false;
            this.soundManager.playSuccessSound();
            this.progressCard.stopTimer();
            this.progressCard.hide();

            // End stats tracking and upload
            this.statsCollector.endGame(this.activeBoard);
            // TODO: Enable stats upload
            //this.statsCollector.uploadStats();

            // Show victory panel with stats
            UIManager.showResultPanel(true, this.statsCollector.getStats());
            return true;
        }
        return false;
    }

    /**
     * Checks if the player has lost
     * @param line - The line to check for collision
     * @returns true if loss condition is met
     */
    checkLoss(line: any): boolean {
        if (this.activeBoard.checkLoss(line, this.progressCard) && this.isPlaying) {

            // Game over - all lives lost
            this.isPlaying = false;
            this.soundManager.playLoseSound();
            this.progressCard.stopTimer();
            this.progressCard.hide();

            // End stats tracking (but don't upload for losses)
            this.statsCollector.endGame(this.activeBoard);

            // Show loss panel with progress
            const progress = this.activeBoard.getProgress();
            UIManager.showResultPanel(false, `You popped a circle!<br>Progress: ${progress}%`);
            return true;
        }
        return false;
    }

    /**
     * Handles line intersection check
     * @param line - The line in world coordinates
     */
    handleIntersection(line: any): void {
        const numIntersections = this.activeBoard.checkIntersection(line);
        for (let index = 0; index < numIntersections; index++) {
            this.statsCollector.recordSuccessfulIntersection();
        }
    }

    /**
     * Records that the player used a hint
     */
    recordHintUsed(): void {
        this.statsCollector.recordHintUsed();
    }

    /**
     * Set callback for loading next level
     */
    setNextLevelCallback(callback: () => boolean): void {
        this.onNextLevelCallback = callback;
    }

    /**
     * Load the next level using the callback
     * @returns true if next level was loaded, false otherwise
     */
    loadNextLevel(): boolean {
        if (this.onNextLevelCallback) {
            return this.onNextLevelCallback();
        }
        return false;
    }
}
