import type p5 from 'p5';
import { Animation } from '../Animation.js';
import { Particle } from './Particle.js';

export interface ParticleExplosionConfig {
    x: number;
    y: number;
    particleCount?: number;
}

/**
 * ParticleExplosion animation - creates an explosion of particles at a position
 */
export class ParticleExplosion extends Animation {
    private particles: Particle[] = [];
    private particleCount: number;

    // Default configuration
    static readonly DEFAULT_CONFIG: Partial<ParticleExplosionConfig> = {
        particleCount: 20
    };

    constructor(p: p5, config: ParticleExplosionConfig) {
        super(p);
        this.particleCount = config.particleCount ?? ParticleExplosion.DEFAULT_CONFIG.particleCount!;
        this.createParticles(config.x, config.y);
    }

    private createParticles(x: number, y: number): void {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.p, x, y));
        }
    }

    update(): void {
        // Update all particles and remove dead ones
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });

        // Mark as done when all particles are gone
        if (this.particles.length === 0) {
            this.isDone = true;
        }
    }

    draw(): void {
        for (const particle of this.particles) {
            particle.draw();
        }
    }
}
