import { FirestoreService } from '../data/FirestoreService.js';

interface GameStats {
    gameName: string;
    totalPlays: number;
    averageDuration: number;
    averageHints: number;
    numberWins: number;
    bestScores: BestScore[];
}

interface BestScore {
    playerName: string;
    startTime: number;
    endTime: number;
    hintsUsed: number;
    successfulIntersections: number;
    gameDifficulty: number;
    boardName: string;
}

interface LeaderboardEntry {
    playerName: string;
    totalGamesPlayed: number;
    totalIntersections: number;
    totalGamesWon: number;
    averageDifficulty: number;
}

interface GeneralStats {
    mostPlayedGames: string[];
}

/**
 * StatsLandingPage - Beautiful landing page showing statistics and leaderboards
 */
export class StatsLandingPage {
    private landingPanel: HTMLElement | null = null;
    private firestoreService: FirestoreService;
    private onPlayCallback?: () => void;

    constructor(firestoreService: FirestoreService) {
        this.firestoreService = firestoreService;
    }

    /**
     * Shows the landing page
     */
    show(): void {
        this.createLandingPanel();
        this.landingPanel!.style.display = 'flex';
    }

    /**
     * Hides the landing page
     */
    hide(): void {
        if (this.landingPanel) {
            this.landingPanel.style.display = 'none';
        }
    }

    /**
     * Sets the callback for when PLAY button is clicked
     */
    setOnPlayCallback(callback: () => void): void {
        this.onPlayCallback = callback;
    }

    /**
     * Creates the landing panel HTML structure
     */
    private createLandingPanel(): void {
        let panel = document.getElementById('stats-landing-panel');

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'stats-landing-panel';
            panel.className = 'stats-landing-panel';

            panel.innerHTML = `
                <div class="stats-landing-container">
                    <header class="stats-header">
                        <h1 class="stats-main-title">🎯 Bubble Trim</h1>
                        <p class="stats-subtitle">Cut the overlapping circles!</p>
                    </header>

                    <button id="play-button" class="btn-play">PLAY</button>

                    <div class="stats-content">
                        <section class="stats-section stats-section-leaderboard">
                            <h2 class="section-title">🏆 Top Players</h2>
                            <div id="leaderboard" class="leaderboard-list">
                                <div class="loading-text">Loading...</div>
                            </div>
                        </section>

                        <section class="stats-section stats-section-game-stats">
                            <h2 class="section-title">🎮 Game Statistics</h2>
                            <div id="game-stats" class="game-stats-grid">
                                <div class="loading-text">Loading...</div>
                            </div>
                        </section>
                    </div>
                </div>
            `;

            document.body.appendChild(panel);
        }

        this.landingPanel = panel;
        this.setupEventListeners();
    }

    /**
     * Sets up event listeners
     */
    private setupEventListeners(): void {
        const playButton = document.getElementById('play-button');
        playButton?.addEventListener('click', () => {
            if (this.onPlayCallback) {
                this.onPlayCallback();
            }
        });
    }

    /**
     * Loads statistics from Firestore and displays them
     */
    async loadAndDisplayStats(): Promise<void> {
        try {
            // Load data from Firestore summary collection
            const [leaderboardData, gameStatsData] = await Promise.all([
                this.loadSummaryDoc('leaderboard'),
                this.loadSummaryDoc('game-stats')
            ]);

            // Display leaderboard
            if (leaderboardData) {
                this.displayLeaderboard(leaderboardData);
            } else {
                this.displayNoData('leaderboard');
            }

            // Display game stats
            if (gameStatsData) {
                this.displayGameStats(gameStatsData);
            } else {
                this.displayNoData('game-stats');
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.displayError();
        }
    }

    /**
     * Loads a document from the summary collection
     */
    private async loadSummaryDoc(docId: string): Promise<any> {
        try {
            const db = (await import('../firebase.js')).db;
            const { getDoc, doc } = await import('firebase/firestore');

            const docRef = doc(db, 'summary', docId);
            const docSnap = await getDoc(docRef);

            console.log(`Loaded summary doc: ${docId}`, docSnap.data());

            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error(`Error loading ${docId}:`, error);
            return null;
        }
    }

    /**
     * Displays leaderboard
     */
    private displayLeaderboard(leaderboardData: { [key: string]: LeaderboardEntry }): void {
        const container = document.getElementById('leaderboard');
        if (!container) return;

        // Convert to array and sort by total wins
        const sortedPlayers = Object.values(leaderboardData)
            .sort((a, b) => b.totalGamesWon - a.totalGamesWon)
            .slice(0, 10);

        if (sortedPlayers.length === 0) {
            this.displayNoData('leaderboard');
            return;
        }

        container.innerHTML = sortedPlayers.map((player, index) => `
            <div class="leaderboard-item">
                <span class="rank">${index + 1}</span>
                <div class="player-info">
                    <span class="player-name">${player.playerName}</span>
                    <span class="player-stats">
                        ${player.totalGamesWon} wins • ${player.totalGamesPlayed} games
                    </span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Displays game statistics
     */
    private displayGameStats(gameStatsData: { [key: string]: GameStats }): void {
        const container = document.getElementById('game-stats');
        if (!container) return;

        const games = Object.values(gameStatsData)
            .sort((a, b) => b.totalPlays - a.totalPlays);

        if (games.length === 0) {
            this.displayNoData('game-stats');
            return;
        }

        container.innerHTML = games.map(game => {
            const winRate = game.totalPlays > 0 ? Math.round((game.numberWins / game.totalPlays) * 100) : 0;
            const avgDuration = game.averageDuration;
            const min = Math.floor(avgDuration / 60000);
            const sec = Math.floor((avgDuration % 60000) / 1000);
            const ms = avgDuration % 1000;
            const avgDurationStr = `${min}:${sec.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;

            // Generate top 5 best players HTML
            const bestScoresHTML = this.generateBestScoresHTML(game.bestScores || []);

            return `
                <div class="game-stat-card">
                    <h3 class="game-stat-name">${game.gameName}</h3>
                    <div class="game-stat-details">
                        <div class="stat-item">
                            <span class="stat-label">Plays</span>
                            <span class="stat-value">${game.totalPlays}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Wins</span>
                            <span class="stat-value">${game.numberWins}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Win Rate</span>
                            <span class="stat-value">${winRate}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Avg Time</span>
                            <span class="stat-value">${avgDurationStr}</span>
                        </div>
                    </div>
                    ${bestScoresHTML}
                </div>
            `;
        }).join('');
    }

    /**
     * Generates HTML for the top 5 best scores
     */
    private generateBestScoresHTML(bestScores: BestScore[]): string {
        if (!bestScores || bestScores.length === 0) {
            return '<div class="best-scores-section"><h4 class="best-scores-title">🏅 Top Players</h4><p class="no-scores">No scores yet</p></div>';
        }

        // Sort by duration (fastest first)
        const sortedScores = [...bestScores].sort((a, b) => {
            const durationA = a.endTime - a.startTime;
            const durationB = b.endTime - b.startTime;
            return durationA - durationB;
        }).slice(0, 5);

        const scoresHTML = sortedScores.map((score, index) => {
            const duration = score.endTime - score.startTime;
            const min = Math.floor(duration / 60000);
            const sec = Math.floor((duration % 60000) / 1000);
            const ms = duration % 1000;
            const timeStr = `${min}:${sec.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;

            // Calculate hearts: 3 hearts minus hints used
            const hearts = Math.max(0, 3 - score.hintsUsed);
            const heartsStr = '❤️'.repeat(hearts);

            return `
                <div class="best-score-item">
                    <span class="score-rank">${index + 1}.</span>
                    <span class="score-player">${score.playerName}</span>
                    <span class="score-time">${timeStr}</span>
                    <span class="score-hearts">${heartsStr}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="best-scores-section">
                <h4 class="best-scores-title">🏅 Top Players</h4>
                <div class="best-scores-list">
                    ${scoresHTML}
                </div>
            </div>
        `;
    }

    /**
     * Displays "No data available" message
     */
    private displayNoData(containerId: string): void {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="no-data">No data available yet</div>';
        }
    }

    /**
     * Displays error message
     */
    private displayError(): void {
        ['most-played-games', 'leaderboard', 'game-stats'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<div class="error-text">Failed to load statistics</div>';
            }
        });
    }

    /**
     * Removes the landing panel from the DOM
     */
    destroy(): void {
        if (this.landingPanel && this.landingPanel.parentNode) {
            this.landingPanel.parentNode.removeChild(this.landingPanel);
            this.landingPanel = null;
        }
    }
}
