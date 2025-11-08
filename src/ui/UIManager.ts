import { GameStats } from '../game/StatsCollector.js';

/**
 * UIManager - Handles all UI elements like buttons, panels, and progress display
 */
export class UIManager {
    /**
     * Creates and adds a level button to the map-controls container
     * @param label - The text label for the button
     * @param onClick - The callback function when button is clicked
     * @param id - Optional custom ID for the button (auto-generated if not provided)
     * @returns The created button element
     */
    static createLevelButton(label: string, onClick: () => void, id?: string): HTMLButtonElement {
        const container = document.getElementById('map-controls');
        if (!container) {
            throw new Error('map-controls container not found');
        }

        const button = document.createElement('button');
        button.textContent = label;
        if (id) {
            button.id = id;
        }
        button.addEventListener('click', onClick);
        container.appendChild(button);

        return button;
    }

    /**
     * Updates the progress display
     * @param progress - The progress percentage as a string (e.g., "75")
     */
    static updateProgress(progress: string): void {
        const progressElem = document.getElementById('progress-value');
        if (progressElem) {
            progressElem.textContent = `${progress}%`;
        }
    }

    /**
     * Updates the result panel with title, stats, and styling
     */
    private static updateResultPanel({ title, stats = '', style = {} }: {
        title: string;
        stats?: string;
        style?: any
    }): void {
        const panel = document.getElementById('result-panel');
        if (!panel) return;

        const titleElem = document.getElementById('result-title');
        const statsElem = document.getElementById('result-stats');

        if (titleElem) titleElem.textContent = title;
        if (statsElem) statsElem.innerHTML = stats ?? '';

        if (style && typeof style === 'object') {
            Object.keys(style).forEach((key) => {
                (panel as HTMLElement).style.setProperty(key, style[key]);
            });
        }
    }

    /**
     * Formats GameStats into an HTML string for display
     * @param stats - The game statistics
     * @returns Formatted HTML string
     */
    private static formatStats(stats: GameStats): string {
        const lines = [];

        // Duration
        if (stats.duration) {
            const seconds = Math.floor(stats.duration / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
            const secondsStr = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();
            lines.push(`Time: ${minutesStr}:${secondsStr}`);
        }

        // Successful intersections
        if (stats.successfulIntersections > 0) {
            lines.push(`Intersections: ${stats.successfulIntersections}`);
        }

        // Hints used
        if (stats.hintsUsed > 0) {
            lines.push(`Hints Used: ${stats.hintsUsed}`);
        }

        // Board name
        if (stats.boardName) {
            lines.push(`Level: ${stats.boardName}`);
        }

        return lines.join('<br>');
    }

    /**
     * Shows the victory panel
     * @param stats - Optional stats to display (can be GameStats or string)
     */
    static showVictoryPanel(stats?: GameStats | string): void {
        const statsHtml = typeof stats === 'string'
            ? stats
            : stats
                ? UIManager.formatStats(stats)
                : '';

        UIManager.updateResultPanel({
            title: 'Victory!',
            stats: statsHtml,
            style: { background: '#2ecc40' },
        });
        UIManager.showPanel('result-panel');
    }

    /**
     * Shows the loss panel
     * @param stats - Optional stats to display (can be GameStats or string)
     */
    static showLossPanel(stats?: GameStats | string): void {
        const statsHtml = typeof stats === 'string'
            ? stats
            : stats
                ? UIManager.formatStats(stats)
                : '';

        UIManager.updateResultPanel({
            title: 'Game Over',
            stats: statsHtml,
            style: { background: '#e74c3c' },
        });
        UIManager.showPanel('result-panel');
    }

    /**
     * Shows the result panel (victory or loss)
     * @param isVictory - Whether this is a victory or loss
     * @param stats - Optional stats to display (can be GameStats or string)
     */
    static showResultPanel(isVictory = true, stats?: GameStats | string): void {
        if (isVictory) {
            UIManager.showVictoryPanel(stats);
        } else {
            UIManager.showLossPanel(stats);
        }
    }

    /**
     * Shows a panel by ID
     * @param panelId - The ID of the panel to show
     */
    static showPanel(panelId: string): void {
        const panel = document.getElementById(panelId);
        if (panel) panel.style.display = 'block';
    }

    /**
     * Hides a panel by ID
     * @param panelId - The ID of the panel to hide
     */
    static hidePanel(panelId: string): void {
        const panel = document.getElementById(panelId);
        if (panel) panel.style.display = 'none';
    }
}
