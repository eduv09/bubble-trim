import type p5 from 'p5';

/**
 * Base Animation class that all animations should extend
 * Provides a common interface for updating, drawing, and checking if an animation is complete
 */
export abstract class Animation {
    protected p: p5;
    protected isDone: boolean = false;

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * Update the animation state
     * Should be called once per frame
     */
    abstract update(): void;

    /**
     * Draw the animation to the canvas
     * Should be called once per frame after update()
     */
    abstract draw(): void;

    /**
     * Check if the animation has completed
     * @returns true if the animation is finished and should be removed
     */
    isComplete(): boolean {
        return this.isDone;
    }

    /**
     * Force the animation to complete immediately
     */
    complete(): void {
        this.isDone = true;
    }
}
