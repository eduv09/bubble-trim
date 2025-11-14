import type p5 from 'p5';
import {
    classicVen,
    threeCircleVenn,
    planetarySystem,
    caterpillarChain,
    bubbleCluster,
    generateLevel
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
import { SimpleAuthProvider } from './auth/SimpleAuthProvider.js';
import { LoginScreen } from './auth/LoginScreen.js';
import { LevelsPanel, Level } from './ui/LevelsPanel.js';

const sketch = (p: p5) => {
    let camera: CameraController;
    let gameState: GameState;
    let inputHandler: InputHandler;
    let soundManager: SoundManager;
    let authManager: AuthManager;
    let loginScreen: LoginScreen;
    let playerCard: PlayerCard;
    let progressCard: ProgressCard;
    let countdown: Countdown;
    let levelsPanel: LevelsPanel;
    let isGameInitialized = false;
    const backgroundImage = p.loadImage('../assets/background.png');


    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(backgroundImage);

        // Initialize authentication system
        const authProvider = new SimpleAuthProvider();
        authManager = new AuthManager(authProvider);

        // Show login screen first
        loginScreen = new LoginScreen(authManager, () => {
            // This callback is called after successful login
            initializeGame();
        });
        loginScreen.show();
    };

    const initializeGame = () => {
        if (isGameInitialized) return;

        // Initialize core systems
        soundManager = new SoundManager(p);
        camera = new CameraController(p);

        // Initialize UI components
        progressCard = new ProgressCard();
        countdown = new Countdown();

        // Initialize game state with progress card and countdown
        gameState = new GameState(p, classicVen, soundManager, camera, progressCard, countdown);
        inputHandler = new InputHandler(p, gameState, camera);

        // Initialize and show player card
        playerCard = new PlayerCard();
        playerCard.show();

        // Setup levels panel
        setupLevelsPanel();

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
            // Reload the current board
            gameState.restart();
        });

        // Define all levels with metadata
        const levels: Level[] = [
            {
                id: 'classic-venn',
                name: 'Classic Venn',
                difficulty: 1,
                boardData: classicVen,
                boardName: 'Classic Venn',
                description: 'Two overlapping circles - perfect for beginners'
            },
            {
                id: 'three-overlap',
                name: 'Three Overlap',
                difficulty: 1,
                boardData: threeCircleVenn,
                boardName: 'Three Overlap',
                description: 'Three circles with a central intersection'
            },
            {
                id: 'planetary-system',
                name: 'Planetary System',
                difficulty: 1,
                boardData: planetarySystem,
                boardName: 'Planetary System',
                description: 'A large circle with smaller orbiting circles'
            },
            {
                id: 'caterpillar',
                name: 'Caterpillar',
                difficulty: 1,
                boardData: caterpillarChain,
                boardName: 'Caterpillar',
                description: 'Chain of overlapping circles'
            },
            {
                id: 'bubble-cluster',
                name: 'Bubble Cluster',
                difficulty: 1,
                boardData: bubbleCluster,
                boardName: 'Bubble Cluster',
                description: 'Multiple circles in a cluster formation'
            },
            {
                id: 'level-1',
                name: 'Challenge 1',
                difficulty: 2,
                boardData: generateLevel(700, 350, 20, 100, 'Challenge 1'),
                boardName: 'Challenge 1',
                description: 'Randomly generated level - easy difficulty'
            },
            {
                id: 'level-2',
                name: 'Challenge 2',
                difficulty: 3,
                boardData: generateLevel(1400, 700, 20, 100, 'Challenge 2'),
                boardName: 'Challenge 2',
                description: 'Randomly generated level - medium difficulty'
            },
            {
                id: 'level-3',
                name: 'Challenge 3',
                difficulty: 4,
                boardData: generateLevel(2800, 1400, 20, 100, 'Challenge 3'),
                boardName: 'Challenge 3',
                description: 'Randomly generated level - hard difficulty'
            },
            {
                id: 'level-4',
                name: 'Challenge 4',
                difficulty: 4,
                boardData: generateLevel(3200, 1600, 20, 100, 'Challenge 4'),
                boardName: 'Challenge 4',
                description: 'Randomly generated level - hard difficulty'
            },
            {
                id: 'level-5',
                name: 'Challenge 5',
                difficulty: 5,
                boardData: generateLevel(4000, 2000, 20, 100, 'Challenge 5'),
                boardName: 'Challenge 5',
                description: 'Randomly generated level - expert difficulty'
            }
        ];

        // Add all levels to the panel
        levelsPanel.addLevels(levels);

        // Show levels panel initially so player can select first level
        levelsPanel.show();

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

