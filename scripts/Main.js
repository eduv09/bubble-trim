
/**
 * The setup function runs once when the sketch starts.
 */
import { Board } from "./Board.js";
import {
    classicVen,
    threeCircleVenn,
    planetarySystem,
    caterpillarChain,
    bubbleCluster,
    generateChaoticBoard
} from "./BoardData.js";

const sketch = (p) => {
    let activeBoard;
    let isHunting = false;
    let isPlaying = true;
    let lastBoard = null;

    const updateProgress = () => {

        const progress = activeBoard.getProgress();
        document.getElementById('progress-value').textContent = `${progress}%`;
    };

    const loadMap = (circles) => {
        // Create a new Board instance with the provided circle data
        activeBoard = new Board(p, circles);
        updateProgress();
        console.log("New map loaded!");
        lastBoard = circles;
        isPlaying = true;
        document.getElementById('result-panel').style.display = 'none';
    };

    p.setup = () => {
        // Create a canvas that fills the entire browser window
        p.createCanvas(p.windowWidth, p.windowHeight);
        // --- Define our Circles ---
        activeBoard = new Board(p, classicVen);

        // 4. Get the HTML buttons and add click listeners
        const map1Button = document.getElementById('map1-btn');
        const map2Button = document.getElementById('map2-btn');
        const map3Button = document.getElementById('map3-btn');
        const map4Button = document.getElementById('map4-btn');
        const map5Button = document.getElementById('map5-btn');
        const map6Button = document.getElementById('map6-btn');
        map1Button.addEventListener('click', () => loadMap(classicVen));
        map2Button.addEventListener('click', () => loadMap(threeCircleVenn));
        map3Button.addEventListener('click', () => loadMap(planetarySystem));
        map4Button.addEventListener('click', () => loadMap(caterpillarChain));
        map5Button.addEventListener('click', () => loadMap(bubbleCluster));
        map6Button.addEventListener('click', () => loadMap(generateChaoticBoard(p, 50)));

        lastBoard = classicVen;


        const restartBtn = document.getElementById('restart-btn');
        const levelBtn = document.getElementById('level-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (lastBoard) {

                    document.getElementById('result-panel').style.display = 'none';
                    loadMap(lastBoard);
                }
            });
        }
        if (levelBtn) {
            levelBtn.addEventListener('click', () => {
                document.getElementById('result-panel').style.display = 'none';
            });
        }
    }

    /**
    * The draw function runs continuously in a loop, drawing frames.
    */
    p.draw = () => {
        if (!isPlaying) return;
        // Set a dark blue-gray background
        p.background(50, 30, 40);
        if (p.mouseIsPressed) {
            p.push();
            p.stroke(255, 204, 0); // A bright yellow color
            p.strokeWeight(4);     // Make the line 4 pixels thick

            // Draw a line from the mouse's previous position to its current one
            p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
            p.pop();
            if (isHunting) {
                const line = {
                    p1: { x: p.pmouseX - p.width / 2, y: p.pmouseY - p.height / 2 },
                    p2: { x: p.mouseX - p.width / 2, y: p.mouseY - p.height / 2 }
                };

                activeBoard.checkIntersection(line);

                if (activeBoard.checkLoss(line)) {
                    console.log("You lost!");
                    isPlaying = false;
                    showResultPanel(false, `You popped a circle!<br>Progress: ${activeBoard.getProgress()}%`);
                }
            }
            isHunting = true;
        }

        // Center all drawing coordinates to the middle of the screen
        p.translate(p.width / 2, p.height / 2);
        activeBoard.draw();
        updateProgress();
        if (activeBoard.checkVictory()) {
            isPlaying = false;
            showResultPanel();
        }
    }

    function updateResultPanel({ title, stats = '', style = {} }) {
        const panel = document.getElementById('result-panel');
        document.getElementById('result-title').textContent = title;
        document.getElementById('result-stats').innerHTML = stats;
        // Apply custom styles if provided
        for (const [key, value] of Object.entries(style)) {
            panel.style[key] = value;
        }
    }

    function showVictoryPanel(stats = '') {
        updateResultPanel({
            title: 'Victory!',
            stats,
            style: { background: '#2ecc40' }
        });
        document.getElementById('result-panel').style.display = 'block';
    }

    function showLossPanel(stats = '') {
        updateResultPanel({
            title: 'Game Over',
            stats,
            style: { background: '#e74c3c' }
        });
        document.getElementById('result-panel').style.display = 'block';
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
    }

    p.mouseReleased = () => {
        isHunting = false;
    }

    /**
    * This helper function is called by p5.js whenever the browser window is resized.
    */
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
}

new p5(sketch);
