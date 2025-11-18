import type p5 from 'p5';
import { GameState } from '../game/GameState.js';
import { CameraController } from '../camera/CameraController.js';

/**
 * InputHandler - Handles mouse and touch input for drawing and game interaction
 */
export class InputHandler {
    private p: p5;
    private gameState: GameState;
    private camera: CameraController;
    private lastWorldPos: { x: number; y: number } | null = null;

    constructor(p: p5, gameState: GameState, camera: CameraController) {
        this.p = p;
        this.gameState = gameState;
        this.camera = camera;
    }

    /**
     * Draws the cutting line on screen
     */
    drawCuttingLine(): void {
        // Don't draw during countdown
        if (this.gameState.isCountingDown) return;

        if (this.p.mouseIsPressed && this.p.mouseButton === this.p.LEFT && this.gameState.isHunting) {
            this.p.push();
            this.p.stroke(255, 204, 0);
            this.p.strokeWeight(4);
            this.p.line(this.p.pmouseX, this.p.pmouseY, this.p.mouseX, this.p.mouseY);
            this.p.pop();
        }
    }

    /**
     * Handles mouse dragging for cutting
     * Should be called in the draw loop BEFORE camera panning
     */
    handleCutting(): void {
        // Don't allow cutting during countdown
        if (this.gameState.isCountingDown) return;

        if (this.p.mouseIsPressed && this.p.mouseButton === this.p.LEFT && this.gameState.isHunting) {
            // Get current world position
            const worldCurr = this.camera.screenToWorld(this.p.mouseX, this.p.mouseY);

            // Use cached previous world position if available, otherwise use current
            const worldPrev = this.lastWorldPos || worldCurr;

            const line = {
                start: { x: worldPrev.x, y: worldPrev.y },
                end: { x: worldCurr.x, y: worldCurr.y },
            };

            this.gameState.handleIntersection(line);
            this.gameState.checkLoss(line);

            // Store current world position for next frame
            this.lastWorldPos = { x: worldCurr.x, y: worldCurr.y };
        } else {
            // Reset when not cutting
            this.lastWorldPos = null;
        }
    }

    /**
     * Handles mouse press event
     */
    onMousePressed(): void {
        // Don't allow hunting during countdown
        if (this.gameState.isCountingDown) return;

        if (!this.gameState.isHunting) {
            this.gameState.isHunting = true;
        }
    }

    /**
     * Handles mouse release event
     */
    onMouseReleased(): void {
        this.gameState.isHunting = false;
        this.lastWorldPos = null; // Clear cached position
        this.camera.stopPanning();
    }
}
