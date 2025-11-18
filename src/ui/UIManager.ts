import { IGameStats } from '../game/StatsCollector.js';

/**
 * UIManager - Handles all UI elements like buttons, panels, and progress display
 */
export class UIManager {

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
    private static updateResultPanel({ title, stats = '', style = {}, result }: {
        title: string;
        stats?: string;
        style?: any;
        result?: 'victory' | 'loss';
    }): void {
        const panel = document.getElementById('result-panel');
        if (!panel) return;

        const titleElem = document.getElementById('result-title');
        const statsElem = document.getElementById('result-stats');

        if (titleElem) titleElem.textContent = title;
        if (statsElem) statsElem.innerHTML = stats ?? '';

        // Set data-result attribute for CSS styling
        if (result) {
            panel.setAttribute('data-result', result);
        }

        if (style && typeof style === 'object') {
            Object.keys(style).forEach((key) => {
                (panel as HTMLElement).style.setProperty(key, style[key]);
            });
        }
    }

    /**
     * Formats IGameStats into an HTML string for display
     * @param stats - The game statistics
     * @returns Formatted HTML string
     */
    private static formatStats(stats: IGameStats): string {
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
     * @param stats - Optional stats to display (can be IGameStats or string)
     */
    static showVictoryPanel(stats?: IGameStats | string): void {
        const statsHtml = typeof stats === 'string'
            ? stats
            : stats
                ? UIManager.formatStats(stats)
                : '';

        UIManager.updateResultPanel({
            title: 'Victory!',
            stats: statsHtml,
            result: 'victory',
            style: {},
        });
        UIManager.showPanel('result-panel');
    }

    /**
     * Shows the loss panel
     * @param stats - Optional stats to display (can be IGameStats or string)
     */
    static showLossPanel(stats?: IGameStats | string): void {
        const statsHtml = typeof stats === 'string'
            ? stats
            : stats
                ? UIManager.formatStats(stats)
                : '';

        UIManager.updateResultPanel({
            title: 'Game Over',
            stats: statsHtml,
            result: 'loss',
            style: {},
        });
        UIManager.showPanel('result-panel');
    }

    /**
     * Shows the result panel (victory or loss)
     * @param isVictory - Whether this is a victory or loss
     * @param stats - Optional stats to display (can be IGameStats or string)
     */
    static showResultPanel(isVictory = true, stats?: IGameStats | string): void {
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

    /**
     * Shows the levels panel
     */
    static showLevelsPanel(): void {
        UIManager.showPanel('levels-panel');
    }

    /**
     * Hides the levels panel
     */
    static hideLevelsPanel(): void {
        UIManager.hidePanel('levels-panel');
    }
}
