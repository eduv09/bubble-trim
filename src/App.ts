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
    const backgroundImage = p.loadImage('../assets/background.png');


    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(backgroundImage);

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

        // Don't allow interactions during countdown
        if (!gameState.isCountingDown) {
            if (gameState.isPlaying) {
                // Handle cutting logic FIRST (before camera panning changes transform)
                inputHandler.handleCutting();
            }

            // Handle camera panning (both right-click and left-click)
            camera.handleMousePanning();
        }

        // Draw the cutting line (in screen space, before transform)
        inputHandler.drawCuttingLine();

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
        if (isGameInitialized && !gameState.isCountingDown) {
            inputHandler.onMousePressed();
        }
    };

    p.mouseReleased = () => {
        if (isGameInitialized && !gameState.isCountingDown) {
            inputHandler.onMouseReleased();
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new (window as any).p5(sketch);

