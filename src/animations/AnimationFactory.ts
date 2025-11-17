import type p5 from 'p5';
import { Animation } from './Animation.js';
import { ParticleExplosion, ParticleExplosionConfig } from './particle-explosion/ParticleExplosion.js';

/**
 * Factory class for creating animations by name
 */
export class AnimationFactory {
    private static p: p5;

    /**
     * Initialize the factory with a p5 instance
     * @param p - The p5 instance to use for creating animations
     */
    static initialize(p: p5): void {
        AnimationFactory.p = p;
    }

    /**
     * Create an animation from a configuration object
     * @param type - The animation type
     * @param config - Configuration object for the animation
     * @returns The created animation
     */
    static createFromConfig(type: string, config: ParticleExplosionConfig): Animation {
        switch (type.toLowerCase()) {
            case 'explosion':
                return new ParticleExplosion(AnimationFactory.p, config);
            default:
                console.warn(`Animation type "${type}" not found, using explosion`);
                return new ParticleExplosion(AnimationFactory.p, config);
        }
    }

    /**
     * Create an animation by name (legacy method for backward compatibility)
     * @param type - The animation type ('explosion')
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param particleCount - Number of particles (default: 20)
     * @returns The created animation
     */
    static create(type: string, config: ParticleExplosionConfig): Animation {
        return AnimationFactory.createFromConfig(type, config);
    }

    /**
     * Convenience method for creating a particle explosion
     */
    static createExplosion(x: number, y: number, particleCount?: number): Animation {
        return new ParticleExplosion(AnimationFactory.p, { x, y, particleCount });
    }
}
