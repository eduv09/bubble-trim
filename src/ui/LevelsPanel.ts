import type p5 from 'p5';
import { ICircle } from '../game/types.js';
import { GameDataManager } from '../game/game-data/GameData.js';

/**
 * Represents a level with metadata
 */
export interface Level {
    id: string;
    name: string;
    difficulty: number; // 1-5 scale
    boardData: ICircle[];
    description?: string;
    boardName?: string; // Name used for tracking completion in GameDataManager
}

/**
 * LevelsPanel - Manages the level selection UI with a grid layout
 */
export class LevelsPanel {
    private container: HTMLElement;
    private levels: Level[] = [];
    private onLevelSelect: (level: Level) => void;
    private currentLevelIndex: number = 0;
    private gameDataManager?: GameDataManager;
    private hasActiveGame: boolean = false;
    private onCloseCallback?: () => void;

    constructor(onLevelSelect: (level: Level) => void, gameDataManager?: GameDataManager) {
        this.onLevelSelect = onLevelSelect;
        this.gameDataManager = gameDataManager;
        this.container = document.getElementById('levels-panel')!;

        if (!this.container) {
            throw new Error('levels-panel container not found');
        }

        this.initializePanel();
    }

    /**
     * Initialize the panel structure
     */
    private initializePanel(): void {
        this.container.innerHTML = `
            <div class="levels-panel-header">
                <h2>Select a Level</h2>
                <button class="close-btn" id="levels-close-btn">×</button>
            </div>
            <div class="levels-grid" id="levels-grid"></div>
        `;

        // Setup close button
        const closeBtn = document.getElementById('levels-close-btn');
        closeBtn?.addEventListener('click', () => this.handleClose());
    }

    /**
     * Handle closing the panel - triggers callback if there's an active game
     */
    private handleClose(): void {
        this.hide();

        // If there's an active game and a close callback, call it to reload the board
        if (this.hasActiveGame && this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    /**
     * Add a level to the panel
     */
    addLevel(level: Level): void {
        this.levels.push(level);
        this.renderLevels();
    }

    /**
     * Add multiple levels at once
     */
    addLevels(levels: Level[]): void {
        this.levels.push(...levels);
        this.renderLevels();
    }

    /**
     * Render all levels in the grid
     */
    private renderLevels(): void {
        const grid = document.getElementById('levels-grid');
        if (!grid) return;

        grid.innerHTML = '';

        this.levels.forEach((level, index) => {
            const levelCard = this.createLevelCard(level, index);
            grid.appendChild(levelCard);
        });
    }

    /**
     * Check if a level has been completed
     */
    private isLevelCompleted(level: Level): boolean {
        if (!this.gameDataManager || !level.boardName) {
            return false;
        }
        const wonGames = this.gameDataManager.getWonGamesForBoard(level.boardName);
        return wonGames.length > 0;
    }

    /**
     * Create a level card element
     */
    private createLevelCard(level: Level, index: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.dataset.levelId = level.id;

        // Add difficulty class
        card.classList.add(`difficulty-${level.difficulty}`);

        // Check if level is completed and add class
        if (this.isLevelCompleted(level)) {
            card.classList.add('completed');
        }

        // Build difficulty stars
        const stars = '★'.repeat(level.difficulty) + '☆'.repeat(5 - level.difficulty);

        card.innerHTML = `
            <div class="level-card-header">
                <span class="level-number">#${index + 1}</span>
                <span class="level-difficulty">${stars}</span>
            </div>
            <div class="level-card-body">
                <h3 class="level-name">${level.name}</h3>
                ${level.description ? `<p class="level-description">${level.description}</p>` : ''}
                <div class="level-circles-count">Circles: ${level.boardData.length}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            this.currentLevelIndex = index;
            this.hasActiveGame = true;
            this.onLevelSelect(level);
            this.hide();
        });

        return card;
    }

    /**
     * Set callback to be called when panel closes with an active game
     */
    setOnCloseCallback(callback: () => void): void {
        this.onCloseCallback = callback;
    }

    /**
     * Set whether there's an active game
     */
    setHasActiveGame(hasActiveGame: boolean): void {
        this.hasActiveGame = hasActiveGame;
    }

    /**
     * Get the current level
     */
    getCurrentLevel(): Level | null {
        return this.levels[this.currentLevelIndex] || null;
    }

    /**
     * Get the next level in sequence
     */
    getNextLevel(): Level | null {
        if (this.currentLevelIndex + 1 < this.levels.length) {
            return this.levels[this.currentLevelIndex + 1];
        }
        return null;
    }

    /**
     * Load the next level
     */
    loadNextLevel(): boolean {
        const nextLevel = this.getNextLevel();
        if (nextLevel) {
            this.currentLevelIndex++;
            this.onLevelSelect(nextLevel);
            return true;
        }
        return false;
    }

    /**
     * Set current level by ID
     */
    setCurrentLevelById(levelId: string): void {
        const index = this.levels.findIndex(l => l.id === levelId);
        if (index !== -1) {
            this.currentLevelIndex = index;
        }
    }

    /**
     * Set current level by index
     */
    setCurrentLevelIndex(index: number): void {
        if (index >= 0 && index < this.levels.length) {
            this.currentLevelIndex = index;
        }
    }

    /**
     * Show the levels panel
     */
    show(): void {
        // Re-render levels to update completion status
        this.renderLevels();
        this.container.style.display = 'flex';
        this.updateMenuButton();
    }

    /**
     * Hide the levels panel
     */
    hide(): void {
        this.container.style.display = 'none';
        this.updateMenuButton();
    }

    /**
     * Update the levels menu button visibility
     */
    private updateMenuButton(): void {
        const levelsMenuBtn = document.getElementById('levels-menu-btn');
        if (levelsMenuBtn) {
            if (this.isVisible()) {
                levelsMenuBtn.classList.add('hidden');
            } else {
                levelsMenuBtn.classList.remove('hidden');
            }
        }
    }

    /**
     * Check if panel is visible
     */
    isVisible(): boolean {
        return this.container.style.display !== 'none';
    }
}
