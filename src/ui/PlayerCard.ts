import { PlayerIdentity } from '../game/PlayerIdentity.js';
import { AuthManager } from '../auth/AuthManager.js';

/**
 * PlayerCard - Displays player information and stats in an expandable card
 */
export class PlayerCard {
    private cardElement: HTMLElement | null = null;
    private isExpanded: boolean = false;
    private authManager: AuthManager;

    constructor(authManager: AuthManager) {
        this.authManager = authManager;
        this.createCard();
    }

    /**
     * Creates the player card HTML structure
     */
    private createCard(): void {
        // Check if card already exists
        let card = document.getElementById('player-card');

        if (!card) {
            card = document.createElement('div');
            card.id = 'player-card';
            card.className = 'player-card';

            card.innerHTML = `
                <div class="player-card-compact">
                    <div class="player-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <div class="player-info">
                        <div class="player-name" id="player-name">Player</div>
                        <div class="player-status">Click to expand</div>
                    </div>
                    <div class="expand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                        </svg>
                    </div>
                </div>
                <div class="player-card-expanded" id="player-card-expanded">
                    <div class="player-stats-container">
                        <h3 class="stats-title">Player Statistics</h3>
                        <div class="stats-content">
                            <!-- Stats will be populated here in the future -->
                            <p class="stats-placeholder">More stats coming soon!</p>
                        </div>
                        <div class="player-actions">
                            <button id="logout-btn" class="btn-logout">Logout</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(card);
        }

        this.cardElement = card;
        this.setupEventListeners();
        this.updatePlayerName();
    }

    /**
     * Sets up event listeners for card interactions
     */
    private setupEventListeners(): void {
        const compactSection = this.cardElement?.querySelector('.player-card-compact');

        compactSection?.addEventListener('click', () => {
            this.toggleExpanded();
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn?.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent card collapse
            await this.handleLogout();
        });
    }

    /**
     * Handles logout and page refresh
     */
    private async handleLogout(): Promise<void> {
        try {
            // Logout from Firebase
            await this.authManager.logout();

            // Force a hard refresh of the page (like Ctrl+F5)
            // This clears all JavaScript state and reloads everything
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            // Still reload even if logout fails
            window.location.reload();
        }
    }

    /**
     * Toggles the expanded state of the player card
     */
    private toggleExpanded(): void {
        this.isExpanded = !this.isExpanded;

        if (this.cardElement) {
            if (this.isExpanded) {
                this.cardElement.classList.add('expanded');
            } else {
                this.cardElement.classList.remove('expanded');
            }
        }

        // Rotate the expand icon
        const expandIcon = this.cardElement?.querySelector('.expand-icon');
        if (expandIcon) {
            if (this.isExpanded) {
                (expandIcon as HTMLElement).style.transform = 'rotate(180deg)';
            } else {
                (expandIcon as HTMLElement).style.transform = 'rotate(0deg)';
            }
        }
    }

    /**
     * Updates the player name display
     */
    updatePlayerName(): void {
        const playerNameElement = document.getElementById('player-name');
        if (playerNameElement) {
            const playerName = PlayerIdentity.getPlayerName();
            playerNameElement.textContent = playerName;
        }
    }

    /**
     * Shows the player card
     */
    show(): void {
        if (this.cardElement) {
            this.cardElement.style.display = 'block';
            this.updatePlayerName();
        }
    }

    /**
     * Hides the player card
     */
    hide(): void {
        if (this.cardElement) {
            this.cardElement.style.display = 'none';
        }
    }

    /**
     * Updates the stats content (to be implemented with actual stats)
     * @param stats - Stats object to display
     */
    updateStats(stats?: any): void {
        const statsContent = this.cardElement?.querySelector('.stats-content');
        if (statsContent && stats) {
            // Future implementation: populate with actual stats
            // For now, just show placeholder
        }
    }

    /**
     * Removes the player card from the DOM
     */
    destroy(): void {
        if (this.cardElement && this.cardElement.parentNode) {
            this.cardElement.parentNode.removeChild(this.cardElement);
            this.cardElement = null;
        }
    }

    /**
     * Checks if the card is currently expanded
     */
    getIsExpanded(): boolean {
        return this.isExpanded;
    }
}
