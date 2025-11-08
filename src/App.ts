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
import { AuthManager } from './auth/AuthManager.js';
import { SimpleAuthProvider } from './auth/SimpleAuthProvider.js';
import { LoginScreen } from './auth/LoginScreen.js';

const sketch = (p: p5) => {
    let camera: CameraController;
    let gameState: GameState;
    let inputHandler: InputHandler;
    let soundManager: SoundManager;
    let authManager: AuthManager;
    let loginScreen: LoginScreen;
    let playerCard: PlayerCard;
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
        gameState = new GameState(p, classicVen, soundManager, camera);
        inputHandler = new InputHandler(p, gameState, camera);

        // Initialize and show player card
        playerCard = new PlayerCard();
        playerCard.show();

        // Setup level buttons
        setupLevelButtons();

        // Setup UI controls
        setupUIControls();

        // Setup camera controls
        setupCameraControls();

        // Setup input listeners
        setupInputListeners();

        isGameInitialized = true;

        console.log(`Game initialized for player: ${authManager.getCurrentUser()}`);
    };

    const setupLevelButtons = () => {
        UIManager.createLevelButton('Classic Venn', () => gameState.loadMap(classicVen), 'map1-btn');
        UIManager.createLevelButton('Three Overlap', () => gameState.loadMap(threeCircleVenn), 'map2-btn');
        UIManager.createLevelButton('Planetary System', () => gameState.loadMap(planetarySystem), 'map3-btn');
        UIManager.createLevelButton('Caterpillar', () => gameState.loadMap(caterpillarChain), 'map4-btn');
        UIManager.createLevelButton('Bubble Cluster', () => gameState.loadMap(bubbleCluster), 'map5-btn');
        UIManager.createLevelButton('Level 1', () => gameState.loadMap(generateLevel(700, 350)), 'map6-btn');
        UIManager.createLevelButton('Level 2', () => gameState.loadMap(generateLevel(1400, 700)), 'map7-btn');
        UIManager.createLevelButton('Level 3', () => gameState.loadMap(generateLevel(2800, 1400)), 'map8-btn');
    };

    const setupUIControls = () => {
        const restartBtn = document.getElementById('restart-btn');
        const levelBtn = document.getElementById('level-btn');

        restartBtn?.addEventListener('click', () => gameState.restart());
        levelBtn?.addEventListener('click', () => UIManager.hidePanel('result-panel'));
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

        if (gameState.isPlaying) {
            // Handle cutting logic FIRST (before camera panning changes transform)
            inputHandler.handleCutting();
        }

        // Handle camera panning (both right-click and left-click)
        camera.handleMousePanning();

        // Draw the cutting line (in screen space, before transform)
        inputHandler.drawCuttingLine();

        // Apply camera transformations
        camera.applyTransform();

        // Update and draw game
        gameState.update();
        gameState.activeBoard.draw();

        // Check victory condition
        gameState.checkVictory();
    };

    p.mousePressed = () => {
        if (isGameInitialized) {
            inputHandler.onMousePressed();
        }
    };

    p.mouseReleased = () => {
        if (isGameInitialized) {
            inputHandler.onMouseReleased();
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new (window as any).p5(sketch);

