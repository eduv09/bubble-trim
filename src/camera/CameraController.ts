import type p5 from 'p5';

/**
 * CameraController - Handles zoom, pan, and view transformations
 */
export class CameraController {
    private p: p5;
    public zoomLevel: number = 1.0;
    public panX: number = 0;
    public panY: number = 0;

    // Panning state
    private isPanning: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    // Left-click mouse panning state
    private isLeftMousePanning: boolean = false;
    private leftMousePanningEnabled: boolean = false;
    private leftMousePanFactor: number = 0.6; // Slight movement factor (0.0 to 1.0)

    // Touch panning state
    private isTouchPanning: boolean = false;
    private lastTouchX: number = 0;
    private lastTouchY: number = 0;

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * Resets the camera to default position and zoom
     */
    reset(): void {
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
    }

    /**
     * Calculates the optimal zoom level to fit all circles on screen
     * @param circles - Array of circles with center and radius properties
     * @returns The calculated zoom scale
     */
    calculateZoomScale(circles: any[]): number {
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
        const availableWidth = this.p.width * padding;
        const availableHeight = this.p.height * padding;

        // Calculate scale needed to fit both dimensions
        const scaleX = availableWidth / circlesBoundWidth;
        const scaleY = availableHeight / circlesBoundHeight;

        // Use the smaller scale to ensure everything fits
        return Math.min(scaleX, scaleY, 1.5); // Cap maximum zoom at 1.5x
    }

    /**
     * Zooms in by a factor
     * @param factor - The zoom factor (default: 1.2)
     * @param maxZoom - Maximum zoom level (default: 5)
     */
    zoomIn(factor: number = 1.2, maxZoom: number = 5): void {
        this.zoomLevel *= factor;
        if (this.zoomLevel > maxZoom) this.zoomLevel = maxZoom;
    }

    /**
     * Zooms out by a factor
     * @param factor - The zoom factor (default: 1.2)
     * @param minZoom - Minimum zoom level (default: 0.2)
     */
    zoomOut(factor: number = 1.2, minZoom: number = 0.2): void {
        this.zoomLevel /= factor;
        if (this.zoomLevel < minZoom) this.zoomLevel = minZoom;
    }

    /**
     * Zooms towards a specific point (typically the mouse cursor)
     * @param targetX - X coordinate in screen space to zoom towards
     * @param targetY - Y coordinate in screen space to zoom towards
     * @param zoomFactor - The zoom multiplier (>1 to zoom in, <1 to zoom out)
     * @param minZoom - Minimum zoom level (default: 0.2)
     * @param maxZoom - Maximum zoom level (default: 5)
     */
    zoomTowardsPoint(targetX: number, targetY: number, zoomFactor: number, minZoom: number = 0.2, maxZoom: number = 5): void {
        // Get world position before zoom
        const worldPosBefore = this.screenToWorld(targetX, targetY);

        // Apply zoom
        const newZoom = this.zoomLevel * zoomFactor;
        if (newZoom < minZoom || newZoom > maxZoom) return;
        this.zoomLevel = newZoom;

        // Get world position after zoom
        const worldPosAfter = this.screenToWorld(targetX, targetY);

        // Adjust pan to keep the same world point under the cursor
        const worldDeltaX = worldPosAfter.x - worldPosBefore.x;
        const worldDeltaY = worldPosAfter.y - worldPosBefore.y;

        this.panX += worldDeltaX * this.zoomLevel;
        this.panY += worldDeltaY * this.zoomLevel;
    }

    /**
     * Sets up mouse wheel zoom event handler
     * Should be called once during setup
     */
    setupMouseWheelZoom(): void {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.warn('Canvas not found for mouse wheel zoom setup');
            return;
        }

        canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();

            // Get mouse position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Determine zoom direction and factor
            const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

            // Zoom towards mouse position
            this.zoomTowardsPoint(mouseX, mouseY, zoomFactor);
        }, { passive: false });
    }

    /**
     * Enables or disables left-click mouse panning
     * @param enabled - Whether left-click panning should be enabled
     * @param panFactor - Movement factor (0.0 to 1.0, default: 0.3 for slight movement)
     */
    setLeftMousePanning(enabled: boolean, panFactor: number = 0.3): void {
        this.leftMousePanningEnabled = enabled;
        this.leftMousePanFactor = Math.max(0, Math.min(1, panFactor)); // Clamp between 0 and 1
    }

    /**
     * Handles right-click mouse panning
     * Should be called in the draw loop
     */
    handleMousePanning(): void {
        this.handleRightMousePanning();
        this.handleLeftMousePanning();
    }

    /**
     * Handles right-click mouse panning
     * Should be called in the draw loop
     */
    private handleRightMousePanning(): void {
        if (this.p.mouseIsPressed && this.p.mouseButton === this.p.RIGHT) {
            if (!this.isPanning) {
                this.isPanning = true;
                this.lastMouseX = this.p.mouseX;
                this.lastMouseY = this.p.mouseY;
            } else {
                const dx = this.p.mouseX - this.lastMouseX;
                const dy = this.p.mouseY - this.lastMouseY;
                this.panX += dx;
                this.panY += dy;
                this.lastMouseX = this.p.mouseX;
                this.lastMouseY = this.p.mouseY;
            }
        }
    }

    /**
     * Handles left-click mouse panning (if enabled)
     * Moves camera slightly in the direction of the drag
     * Should be called in the draw loop
     */
    private handleLeftMousePanning(): void {
        if (!this.leftMousePanningEnabled) return;

        if (this.p.mouseIsPressed && this.p.mouseButton === this.p.LEFT) {
            if (!this.isLeftMousePanning) {
                this.isLeftMousePanning = true;
                this.lastMouseX = this.p.mouseX;
                this.lastMouseY = this.p.mouseY;
            } else {
                const dx = this.lastMouseX - this.p.mouseX;
                const dy = this.lastMouseY - this.p.mouseY;

                // Apply slight movement based on pan factor (reversed direction)
                this.panX += dx * this.leftMousePanFactor;
                this.panY += dy * this.leftMousePanFactor;

                this.lastMouseX = this.p.mouseX;
                this.lastMouseY = this.p.mouseY;
            }
        }
    }

    /**
     * Stops panning (should be called on mouse release)
     */
    stopPanning(): void {
        this.isPanning = false;
        this.isLeftMousePanning = false;
    }

    /**
     * Applies the camera transformation (translate and scale)
     * Should be called before drawing world objects
     */
    applyTransform(): void {
        this.p.translate(this.p.width / 2 + this.panX, this.p.height / 2 + this.panY);
        this.p.scale(this.zoomLevel);
    }

    /**
     * Converts screen coordinates to world coordinates
     * @param screenX - X coordinate in screen space
     * @param screenY - Y coordinate in screen space
     * @returns Object with world x and y coordinates
     */
    screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: (screenX - this.p.width / 2 - this.panX) / this.zoomLevel,
            y: (screenY - this.p.height / 2 - this.panY) / this.zoomLevel,
        };
    }

    /**
     * Sets up touch event handlers for two-finger panning
     * Should be called once during setup
     */
    setupTouchControls(): void {
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this.isTouchPanning = true;
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                this.lastTouchX = centerX;
                this.lastTouchY = centerY;
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.isTouchPanning) {
                e.preventDefault();
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const dx = centerX - this.lastTouchX;
                const dy = centerY - this.lastTouchY;
                this.panX += dx;
                this.panY += dy;
                this.lastTouchX = centerX;
                this.lastTouchY = centerY;
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                this.isTouchPanning = false;
            }
        });
    }
}
