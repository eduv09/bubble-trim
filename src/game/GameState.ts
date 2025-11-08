import type p5 from 'p5';
import { Board } from './Board.js';
import { SoundManager } from '../sound/SoundManager.js';
import { CameraController } from '../camera/CameraController.js';
import { UIManager } from '../ui/UIManager.js';
import { StatsCollector, LocalStatsCollector } from './StatsCollector.js';

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

    constructor(p: p5, initialBoard: any, soundManager: SoundManager, camera: CameraController) {
        this.p = p;
        this.soundManager = soundManager;
        this.camera = camera;
        this.activeBoard = new Board(p, initialBoard, soundManager);
        this.lastBoard = initialBoard;
        this.statsCollector = new LocalStatsCollector();
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
        this.isPlaying = true;
        UIManager.hidePanel('result-panel');
        UIManager.updateProgress(this.activeBoard.getProgress());

        // Start tracking stats for this board
        const boardName = circles.name || 'Unknown Board';
        this.statsCollector.startGame(boardName);
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
        UIManager.updateProgress(this.activeBoard.getProgress());
        this.activeBoard.update();
    }

    /**
     * Checks if the player has won
     * @returns true if victory condition is met
     */
    checkVictory(): boolean {
        if (this.activeBoard.checkVictory()) {
            this.isPlaying = false;
            this.soundManager.playSuccessSound();

            // End stats tracking and upload
            this.statsCollector.endGame();
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
        if (this.activeBoard.checkLoss(line)) {
            this.isPlaying = false;

            // End stats tracking (but don't upload for losses)
            this.statsCollector.endGame();

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
}
