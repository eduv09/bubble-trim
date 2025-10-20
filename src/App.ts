import { Board } from './Board.js';
import {
    classicVen,
    threeCircleVenn,
    planetarySystem,
    caterpillarChain,
    bubbleCluster,
    generateChaoticBoard,
    generateLevel
} from './BoardData.js';

/**
 * Creates and adds a level button to the map-controls container
 * @param label - The text label for the button
 * @param onClick - The callback function when button is clicked
 * @param id - Optional custom ID for the button (auto-generated if not provided)
 * @returns The created button element
 */
function createLevelButton(label: string, onClick: () => void, id?: string): HTMLButtonElement {
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

const sketch = (p: any) => {
    let activeBoard: Board;
    let isHunting = false;
    let isPlaying = true;
    let lastBoard: any = null;

    // Camera/View controls
    let zoomLevel = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Touch controls for mobile
    let isTouchPanning = false;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const updateProgress = () => {
        const progress = activeBoard.getProgress();
        const progressElem = document.getElementById('progress-value');
        if (progressElem) progressElem.textContent = `${progress}%`;
    };

    const resetView = () => {
        zoomLevel = 1.0;
        panX = 0;
        panY = 0;
    }
    /**
     * Calculates the bounding box of all circles and returns the required scale to fit on screen
     */
    const calculateZoomScale = (circles: any[]): number => {
        if (circles.length === 0) return 1.0;

        // Find bounding box of all circles
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        circles.forEach(circle => {
            const left = circle.center.x - circle.radius;
            const right = circle.center.x + circle.radius;
            const top = circle.center.y - circle.radius;
            const bottom = circle.center.y + circle.radius;

            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, bottom);
        });

        const circlesBoundWidth = maxX - minX;
        const circlesBoundHeight = maxY - minY;

        // Calculate available screen space (leave some padding)
        const padding = 0.9; // Use 90% of screen space
        const availableWidth = p.width * padding;
        const availableHeight = p.height * padding;

        // Calculate scale needed to fit both dimensions
        const scaleX = availableWidth / circlesBoundWidth;
        const scaleY = availableHeight / circlesBoundHeight;

        // Use the smaller scale to ensure everything fits
        return Math.min(scaleX, scaleY, 1.5); // Cap maximum zoom at 1.5x
    };

    const loadMap = (circles: any) => {
        activeBoard = new Board(p, circles);
        zoomLevel = calculateZoomScale(circles);
        updateProgress();
        lastBoard = circles;
        isPlaying = true;
        resetView();
        const resultPanel = document.getElementById('result-panel');
        if (resultPanel) resultPanel.style.display = 'none';
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        activeBoard = new Board(p, classicVen);

        // Create level buttons programmatically
        createLevelButton('Classic Venn', () => loadMap(classicVen), 'map1-btn');
        createLevelButton('Three Overlap', () => loadMap(threeCircleVenn), 'map2-btn');
        createLevelButton('Planetary System', () => loadMap(planetarySystem), 'map3-btn');
        createLevelButton('Caterpillar', () => loadMap(caterpillarChain), 'map4-btn');
        createLevelButton('Bubble Cluster', () => loadMap(bubbleCluster), 'map5-btn');
        //createLevelButton('HARD!', () => loadMap(generateChaoticBoard(p, 50)), 'map6-btn');
        createLevelButton('Level 1', () => loadMap(generateLevel(700, 350)), 'map6-btn');
        createLevelButton('Level 2', () => loadMap(generateLevel(1400, 700)), 'map7-btn');
        createLevelButton('Level 3', () => loadMap(generateLevel(2800, 1400)), 'map8-btn');


        lastBoard = classicVen;
        const restartBtn = document.getElementById('restart-btn');
        const levelBtn = document.getElementById('level-btn');
        restartBtn?.addEventListener('click', () => {
            if (lastBoard) {
                const resultPanel = document.getElementById('result-panel');
                if (resultPanel) resultPanel.style.display = 'none';
                loadMap(lastBoard);
            }
        });
        levelBtn?.addEventListener('click', () => {
            const resultPanel = document.getElementById('result-panel');
            if (resultPanel) resultPanel.style.display = 'none';
        });

        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');

        zoomInBtn?.addEventListener('click', () => {
            zoomLevel *= 1.2;
            if (zoomLevel > 5) zoomLevel = 5; // Max zoom
        });

        zoomOutBtn?.addEventListener('click', () => {
            zoomLevel /= 1.2;
            if (zoomLevel < 0.2) zoomLevel = 0.2; // Min zoom
        });

        zoomResetBtn?.addEventListener('click', () => {
            resetView();
        });
        // Disable right-click context menu on the canvas
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Touch event handlers for mobile two-finger panning
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Two fingers detected - start panning
                e.preventDefault();
                isTouchPanning = true;
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                lastTouchX = centerX;
                lastTouchY = centerY;
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isTouchPanning) {
                // Continue panning with two fingers
                e.preventDefault();
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const dx = centerX - lastTouchX;
                const dy = centerY - lastTouchY;
                panX += dx;
                panY += dy;
                lastTouchX = centerX;
                lastTouchY = centerY;
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                // Less than two fingers - stop panning
                isTouchPanning = false;
            }
        });
    };

    p.draw = () => {
        if (!isPlaying) return;
        p.background(50, 30, 40);

        // Handle right-click panning
        if (p.mouseIsPressed && p.mouseButton === p.RIGHT) {
            if (!isPanning) {
                isPanning = true;
                lastMouseX = p.mouseX;
                lastMouseY = p.mouseY;
            } else {
                const dx = p.mouseX - lastMouseX;
                const dy = p.mouseY - lastMouseY;
                panX += dx;
                panY += dy;
                lastMouseX = p.mouseX;
                lastMouseY = p.mouseY;
            }
        }

        // Draw the cutting line and handle intersection
        if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
            p.push();
            p.stroke(255, 204, 0);
            p.strokeWeight(4);
            p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
            p.pop();
            if (isHunting) {
                // Convert screen coordinates to world coordinates
                const worldPrevX = (p.pmouseX - p.width / 2 - panX) / zoomLevel;
                const worldPrevY = (p.pmouseY - p.height / 2 - panY) / zoomLevel;
                const worldCurrX = (p.mouseX - p.width / 2 - panX) / zoomLevel;
                const worldCurrY = (p.mouseY - p.height / 2 - panY) / zoomLevel;

                const line = {
                    start: { x: worldPrevX, y: worldPrevY },
                    end: { x: worldCurrX, y: worldCurrY },
                };
                activeBoard.checkIntersection(line);
                if (activeBoard.checkLoss(line)) {
                    isPlaying = false;
                    showResultPanel(false, `You popped a circle!<br>Progress: ${activeBoard.getProgress()}%`);
                }
            }
            isHunting = true;
        }

        // Apply camera transformations
        p.translate(p.width / 2 + panX, p.height / 2 + panY);
        p.scale(zoomLevel);

        activeBoard.draw();
        updateProgress();
        if (activeBoard.checkVictory()) {
            isPlaying = false;
            showResultPanel();
        }
    };

    function updateResultPanel({ title, stats = '', style = {} }: { title: string; stats?: string; style?: any }) {
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

    function showVictoryPanel(stats = '') {
        updateResultPanel({
            title: 'Victory!',
            stats,
            style: { background: '#2ecc40' },
        });
        const panel = document.getElementById('result-panel');
        if (panel) panel.style.display = 'block';
    }

    function showLossPanel(stats = '') {
        updateResultPanel({
            title: 'Game Over',
            stats,
            style: { background: '#e74c3c' },
        });
        const panel = document.getElementById('result-panel');
        if (panel) panel.style.display = 'block';
    }

    function showResultPanel(isVictory = true, stats = '') {
        if (isVictory) {
            showVictoryPanel(stats);
        } else {
            showLossPanel(stats);
        }
    }

    p.mousePressed = () => {
        if (!isHunting) {
            isHunting = true;
        }
    };

    p.mouseReleased = () => {
        isHunting = false;
        isPanning = false;
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new (window as any).p5(sketch);
