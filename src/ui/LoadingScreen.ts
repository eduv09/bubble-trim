/**
 * LoadingScreen - Shows a loading spinner while data is being loaded
 */
export class LoadingScreen {
    private loadingPanel: HTMLElement | null = null;

    /**
     * Shows the loading screen
     * @param message - Optional custom loading message
     */
    show(message: string = 'Loading your game data...'): void {
        this.createLoadingPanel(message);
        this.loadingPanel!.style.display = 'flex';
    }

    /**
     * Hides the loading screen
     */
    hide(): void {
        if (this.loadingPanel) {
            this.loadingPanel.style.display = 'none';
        }
    }

    /**
     * Updates the loading message
     * @param message - New message to display
     */
    updateMessage(message: string): void {
        const messageElement = document.getElementById('loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    /**
     * Creates the loading panel HTML structure
     */
    private createLoadingPanel(message: string): void {
        // Check if panel already exists
        let panel = document.getElementById('loading-panel');

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'loading-panel';
            panel.className = 'loading-panel';

            panel.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message" id="loading-message">${message}</p>
                </div>
            `;

            document.body.appendChild(panel);
        } else {
            // Update message if panel exists
            this.updateMessage(message);
        }

        this.loadingPanel = panel;
    }

    /**
     * Removes the loading panel from the DOM
     */
    destroy(): void {
        if (this.loadingPanel && this.loadingPanel.parentNode) {
            this.loadingPanel.parentNode.removeChild(this.loadingPanel);
            this.loadingPanel = null;
        }
    }
}
