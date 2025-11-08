import type p5 from 'p5';
import { Animation } from './Animation.js';
import { AnimationFactory } from './AnimationFactory.js';
import { ParticleExplosionConfig } from './particle-explosion/ParticleExplosion.js';

export type AnimationType = 'explosion' | 'none';

export type AnimationConfig = ParticleExplosionConfig;

/**
 * AnimationManager - manages all active animations
 * Handles updating, drawing, and removing completed animations
 */
export class AnimationManager {
    private animations: Animation[] = [];
    private p: p5;
    private activeAnimationType: AnimationType;

    constructor(p: p5) {
        this.p = p;
        this.activeAnimationType = 'explosion';
        // Initialize the factory with the p5 instance
        AnimationFactory.initialize(p);
    }

    /**
     * Get the current active animation type
     */
    getActiveType(): AnimationType {
        return this.activeAnimationType;
    }

    /**
     * Set the active animation type
     * @param type - The animation type to set as active
     */
    setActiveType(type: AnimationType): void {
        this.activeAnimationType = type;
    }

    /**
     * Get the list of supported animation types
     */
    static getSupportedTypes(): AnimationType[] {
        return ['explosion', 'none'];
    }

    /**
     * Check if an animation type is supported
     * @param type - The animation type to check
     */
    static isSupported(type: string): boolean {
        const supportedTypes = AnimationManager.getSupportedTypes();
        return supportedTypes.indexOf(type as AnimationType) !== -1;
    }

    /**
     * Add an animation to the manager
     * @param animation - The animation to add
     */
    add(animation: Animation | null): void {
        if (animation) {
            this.animations.push(animation);
        }
    }

    /**
     * Create and add an animation using the active animation type
     * @param config - Optional configuration for the animation (type-specific)
     * @returns The created animation, or null if type is 'none'
     */
    createActiveAnimation(config: AnimationConfig): Animation | undefined {
        if (this.activeAnimationType === 'none') {
            return undefined;
        }
        const animation = AnimationFactory.createFromConfig(this.activeAnimationType, config);
        this.add(animation);
        return animation;
    }

    /**
     * Update all active animations and remove completed ones
     */
    update(): void {
        // Update all animations
        for (const animation of this.animations) {
            animation.update();
        }

        // Remove completed animations
        this.animations = this.animations.filter(
            animation => !animation.isComplete()
        );
    }

    /**
     * Draw all active animations
     */
    draw(): void {
        for (const animation of this.animations) {
            animation.draw();
        }
    }

    /**
     * Get the number of active animations
     */
    getActiveCount(): number {
        return this.animations.length;
    }

    /**
     * Clear all animations
     */
    clear(): void {
        this.animations = [];
    }

    /**
     * Force complete all animations
     */
    completeAll(): void {
        for (const animation of this.animations) {
            animation.complete();
        }
    }
}
