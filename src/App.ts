import type p5 from 'p5';
import {
    threeCircleVenn,
    loadedLevels
} from './game/BoardData.js';
import { SoundManager } from './sound/SoundManager.js';
import { CameraController } from './camera/CameraController.js';
import { GameState } from './game/GameState.js';
import { InputHandler } from './input/InputHandler.js';
import { UIManager } from './ui/UIManager.js';
import { PlayerCard } from './ui/PlayerCard.js';
import { ProgressCard } from './ui/ProgressCard.js';
import { Countdown } from './ui/Countdown.js';
import { AuthManager } from './auth/AuthManager.js';
import { FirebaseAuthProvider } from './auth/FirebaseAuthProvider.js';
import { LoginScreen } from './auth/LoginScreen.js';
import { LevelsPanel, Level } from './ui/LevelsPanel.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { FirestoreService } from './data/FirestoreService.js';
import { NotificationManager } from './ui/NotificationManager.js';
import { StatsLandingPage } from './ui/StatsLandingPage.js';

/**
 * Request landscape orientation using the Screen Orientation API
 * This will lock the screen to landscape mode on supported devices
 */
function requestLandscapeOrientation() {
    // Check if the Screen Orientation API is available
    const screenOrientation = screen.orientation as any;
    if (screenOrientation && screenOrientation.lock) {
        // Try to lock to landscape mode
        screenOrientation.lock('landscape').catch((err: any) => {
            console.log('Orientation lock not supported or failed:', err);
            // Fallback: The CSS media query will handle the visual prompt
        });
    } else if ((screen as any).lockOrientation) {
        // Fallback for older browsers
        (screen as any).lockOrientation('landscape');
    } else if ((screen as any).mozLockOrientation) {
        // Firefox fallback
        (screen as any).mozLockOrientation('landscape');
    } else if ((screen as any).msLockOrientation) {
        // IE/Edge fallback
        (screen as any).msLockOrientation('landscape');
    }
}

const sketch = (p: p5) => {
    let camera: CameraController;
    let gameState: GameState;
    let inputHandler: InputHandler;
    let soundManager: SoundManager;
    let authManager: AuthManager;
    let loginScreen: LoginScreen;
    let loadingScreen: LoadingScreen;
    let playerCard: PlayerCard;
    let progressCard: ProgressCard;
    let countdown: Countdown;
    let levelsPanel: LevelsPanel;
    let firestoreService: FirestoreService;
    let statsLandingPage: StatsLandingPage;
    let isGameInitialized = false;
    let backgroundImage: p5.Image;

    /**
     * Load background image with fallback paths
     */
    const loadBackgroundImage = (): p5.Image => {
        // Try loading from both possible paths
        // First try relative path (for local development)
        let img = p.loadImage(
            '../assets/background.png',
            () => {
                console.log('Background loaded from ../assets/background.png');
            },
            () => {
                // If that fails, try the deployment path
                console.log('Trying alternative path: ./assets/background.png');
                img = p.loadImage(
                    './assets/background.png',
                    () => {
                        console.log('Background loaded from ./assets/background.png');
                    },
                    (err) => {
                        console.error('Failed to load background image from both paths', err);
                    }
                );
            }
        );
        return img;
    };

    /**
     * Check if any panel/overlay is currently visible
     */
    const isAnyPanelVisible = (): boolean => {
        // Check if login panel is visible
        const loginPanel = document.getElementById('login-panel');
        if (loginPanel && loginPanel.style.display !== 'none') {
            return true;
        }

        // Check if stats landing page is visible
        const statsPanel = document.getElementById('stats-landing-panel');
        if (statsPanel && statsPanel.style.display !== 'none') {
            return true;
        }

        // Check if levels panel is visible
        if (levelsPanel && levelsPanel.isVisible()) {
            return true;
        }

        // Check if result panel is visible
        const resultPanel = document.getElementById('result-panel');
        if (resultPanel && resultPanel.style.display !== 'none') {
            return true;
        }

        return false;
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        
        // Load background image with fallback
        backgroundImage = loadBackgroundImage();
        p.background(200); // Gray background while loading

        // Request landscape orientation on mobile devices
        requestLandscapeOrientation();

        // Initialize Firestore service
        firestoreService = new FirestoreService();

        // Initialize authentication system with Firebase
        const authProvider = new FirebaseAuthProvider();
        authManager = new AuthManager(authProvider);

        // Initialize loading screen
        loadingScreen = new LoadingScreen();

        // Show login screen first
        loginScreen = new LoginScreen(authManager, async () => {
            // This callback is called after successful login
            await loadGameDataAndInitialize();
        });
        loginScreen.show();
    };

    const loadGameDataAndInitialize = async () => {
        // Hide login screen
        loginScreen.hide();

        // Show loading screen
        loadingScreen.show('Loading your game data...');

        // Small delay for UI update
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Initialize game first (so GameDataManager exists)
            await initializeGame();

            // Load game data
            const gameDataManager = gameState.statsCollector.getGameDataManager();

            // Setup notification callback for upload failures
            const notificationManager = NotificationManager.getInstance();
            gameDataManager.setOnUploadFailedCallback((message: string) => {
                notificationManager.showOfflineMessage(message);
            });

            await gameDataManager.loadData();

            // Setup levels panel
            setupLevelsPanel();

            // Hide loading screen
            loadingScreen.hide();

            // Show stats landing page
            statsLandingPage = new StatsLandingPage(firestoreService);
            statsLandingPage.setOnPlayCallback(() => {
                statsLandingPage.hide();
                levelsPanel.setHasActiveGame(false);
                levelsPanel.show();
                updateLevelsMenuButton();
            });
            statsLandingPage.show();
            await statsLandingPage.loadAndDisplayStats();
        } catch (error) {
            console.error('Error loading game data:', error);
            // Continue even if data loading fails
            loadingScreen.hide();
        }
    };

    const initializeGame = async () => {
        if (isGameInitialized) return;

        // Initialize core systems
        soundManager = new SoundManager(p);
        camera = new CameraController(p);

        // Initialize UI components
        progressCard = new ProgressCard();
        countdown = new Countdown();

        // Initialize game state with progress card and countdown (passing firestoreService)
        gameState = new GameState(p, threeCircleVenn, soundManager, camera, progressCard, countdown, firestoreService);
        inputHandler = new InputHandler(p, gameState, camera);

        // Initialize and show player card
        playerCard = new PlayerCard(authManager);
        playerCard.show();

        // Setup levels panel
        //setupLevelsPanel();

        // Setup UI controls
        setupUIControls();

        // Setup camera controls
        setupCameraControls();

        // Setup input listeners
        setupInputListeners();

        isGameInitialized = true;

        console.log(`Game initialized for player: ${authManager.getCurrentUser()}`);
    };

    const setupLevelsPanel = () => {
        // Initialize the levels panel with GameDataManager
        levelsPanel = new LevelsPanel((level: Level) => {
            gameState.loadMap(level.boardData);
            // Update the levels menu button visibility
            updateLevelsMenuButton();
        }, gameState.statsCollector.getGameDataManager());

        // Set up callback for when panel closes with active game
        levelsPanel.setOnCloseCallback(() => {
            // Just hide the panel, don't restart the game
            // This allows players to continue their current game
        });

        // Set up callback for when Home button is clicked
        levelsPanel.setOnHomeCallback(() => {
            // Clear the game state
            //gameState.restart();
            // Show the landing page
            statsLandingPage.show();
            statsLandingPage.loadAndDisplayStats();
        });

        // Define all levels with metadata
        const levels = [...loadedLevels];

        // Add all levels to the panel
        levelsPanel.addLevels(levels);

        // Don't show levels panel initially - landing page will do it via PLAY button

        // Set up next level callback for GameState
        gameState.setNextLevelCallback(() => {
            return levelsPanel.loadNextLevel();
        });
    };

    const updateLevelsMenuButton = () => {
        const levelsMenuBtn = document.getElementById('levels-menu-btn');
        if (levelsMenuBtn) {
            if (levelsPanel.isVisible()) {
                levelsMenuBtn.classList.add('hidden');
            } else {
                levelsMenuBtn.classList.remove('hidden');
            }
        }
    };

    const setupUIControls = () => {
        const restartBtn = document.getElementById('restart-btn');
        const levelBtn = document.getElementById('level-btn');
        const nextLevelBtn = document.getElementById('next-level-btn');
        const levelsMenuBtn = document.getElementById('levels-menu-btn');

        // Levels menu button - toggle panel
        levelsMenuBtn?.addEventListener('click', () => {
            if (levelsPanel.isVisible()) {
                levelsPanel.setHasActiveGame(gameState.isPlaying);
                levelsPanel.hide();
            } else {
                UIManager.hidePanel('result-panel');
                levelsPanel.setHasActiveGame(gameState.isPlaying);
                levelsPanel.show();
            }
            updateLevelsMenuButton();
        });

        restartBtn?.addEventListener('click', () => {
            gameState.restart();
        });

        levelBtn?.addEventListener('click', () => {
            UIManager.hidePanel('result-panel');
            levelsPanel.setHasActiveGame(false);
            levelsPanel.show();
            updateLevelsMenuButton();
        });

        nextLevelBtn?.addEventListener('click', () => {
            const hasNextLevel = gameState.loadNextLevel();
            if (hasNextLevel) {
                UIManager.hidePanel('result-panel');
            } else {
                // No next level available, show levels panel
                UIManager.hidePanel('result-panel');
                levelsPanel.setHasActiveGame(false);
                levelsPanel.show();
                updateLevelsMenuButton();
            }
        });
    };

    const setupCameraControls = () => {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');

        zoomInBtn?.addEventListener('click', () => camera.zoomIn());
        zoomOutBtn?.addEventListener('click', () => camera.zoomOut());
        zoomResetBtn?.addEventListener('click', () => camera.reset());

        // Setup left-click panning controls
        const leftPanToggle = document.getElementById('left-pan-toggle') as HTMLInputElement;
        const panFactorSlider = document.getElementById('pan-factor-slider') as HTMLInputElement;
        const panFactorValue = document.getElementById('pan-factor-value');

        // Toggle left-click panning on/off
        leftPanToggle?.addEventListener('change', () => {
            const isEnabled = leftPanToggle.checked;
            const percentage = parseFloat(panFactorSlider?.value || '70');
            const factor = percentage / 100; // Convert percentage to 0.0-1.0 factor
            camera.setLeftMousePanning(isEnabled, factor);
        });

        // Update pan factor when slider changes
        panFactorSlider?.addEventListener('input', () => {
            const percentage = parseFloat(panFactorSlider.value);
            if (panFactorValue) {
                panFactorValue.textContent = `${percentage}%`;
            }
            if (leftPanToggle?.checked) {
                const factor = percentage / 100; // Convert percentage to 0.0-1.0 factor
                camera.setLeftMousePanning(true, factor);
            }
        });
    };

    const setupInputListeners = () => {
        // Disable right-click context menu
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Setup touch controls for mobile
        camera.setupTouchControls();

        // Setup mouse wheel zoom
        camera.setupMouseWheelZoom();
    };

    p.draw = () => {
        p.background(backgroundImage);

        // Only run game loop if game is initialized (after login)
        if (!isGameInitialized) return;

        // Don't allow interactions during countdown or when panels are visible
        const panelVisible = isAnyPanelVisible();
        if (!gameState.isCountingDown && !panelVisible) {
            if (gameState.isPlaying) {
                // Handle cutting logic FIRST (before camera panning changes transform)
                inputHandler.handleCutting();
            }

            // Handle camera panning (both right-click and left-click)
            camera.handleMousePanning();
        }

        // Draw the cutting line (in screen space, before transform)
        if (!panelVisible) {
            inputHandler.drawCuttingLine();
        }

        // Apply camera transformations
        camera.applyTransform();

        // Update and draw game
        gameState.update();
        gameState.activeBoard.draw();

        // Check victory condition (only when not counting down)
        if (!gameState.isCountingDown) {
            gameState.checkVictory();
        }
    };

    p.mousePressed = () => {
        if (isGameInitialized && !gameState.isCountingDown && !isAnyPanelVisible()) {
            inputHandler.onMousePressed();
        }
    };

    p.touchStarted = () => {
        if (p.touches.length > 1) {
            return;
        }
        if (isGameInitialized && !gameState.isCountingDown && !isAnyPanelVisible()) {
            inputHandler.onMousePressed();
        }
    };

    p.touchEnded = () => {
        if (isGameInitialized && !gameState.isCountingDown && !isAnyPanelVisible()) {
            inputHandler.onMouseReleased();
        }
    };

    p.mouseReleased = () => {
        if (isGameInitialized && !gameState.isCountingDown && !isAnyPanelVisible()) {
            inputHandler.onMouseReleased();
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new (window as any).p5(sketch);

