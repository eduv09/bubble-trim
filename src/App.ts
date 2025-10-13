import { Board } from './Board.js';
import {
    classicVen,
    threeCircleVenn,
    planetarySystem,
    caterpillarChain,
    bubbleCluster,
    generateChaoticBoard,
} from './BoardData.js';

const sketch = (p: any) => {
    let activeBoard: Board;
    let isHunting = false;
    let isPlaying = true;
    let lastBoard: any = null;

    const updateProgress = () => {
        const progress = activeBoard.getProgress();
        const progressElem = document.getElementById('progress-value');
        if (progressElem) progressElem.textContent = `${progress}%`;
    };

    const loadMap = (circles: any) => {
        activeBoard = new Board(p, circles);
        updateProgress();
        lastBoard = circles;
        isPlaying = true;
        const resultPanel = document.getElementById('result-panel');
        if (resultPanel) resultPanel.style.display = 'none';
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        activeBoard = new Board(p, classicVen);
        const map1Button = document.getElementById('map1-btn');
        const map2Button = document.getElementById('map2-btn');
        const map3Button = document.getElementById('map3-btn');
        const map4Button = document.getElementById('map4-btn');
        const map5Button = document.getElementById('map5-btn');
        const map6Button = document.getElementById('map6-btn');
        map1Button?.addEventListener('click', () => loadMap(classicVen));
        map2Button?.addEventListener('click', () => loadMap(threeCircleVenn));
        map3Button?.addEventListener('click', () => loadMap(planetarySystem));
        map4Button?.addEventListener('click', () => loadMap(caterpillarChain));
        map5Button?.addEventListener('click', () => loadMap(bubbleCluster));
        map6Button?.addEventListener('click', () => loadMap(generateChaoticBoard(p, 50)));
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
    };

    p.draw = () => {
        if (!isPlaying) return;
        p.background(50, 30, 40);
        if (p.mouseIsPressed) {
            p.push();
            p.stroke(255, 204, 0);
            p.strokeWeight(4);
            p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
            p.pop();
            if (isHunting) {
                const line = {
                    start: { x: p.pmouseX - p.width / 2, y: p.pmouseY - p.height / 2 },
                    end: { x: p.mouseX - p.width / 2, y: p.mouseY - p.height / 2 },
                };
                activeBoard.checkIntersection(line);
                if (activeBoard.checkLoss(line)) {
                    isPlaying = false;
                    showResultPanel(false, `You popped a circle!<br>Progress: ${activeBoard.getProgress()}%`);
                }
            }
            isHunting = true;
        }
        p.translate(p.width / 2, p.height / 2);
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
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new (window as any).p5(sketch);
