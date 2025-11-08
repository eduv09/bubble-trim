import type p5 from 'p5';
import { IPoint } from '../../game/types.js';

export class Particle {
    private p: p5;
    public position: IPoint;
    private velocity: IPoint;
    private lifespan: number;
    private maxLifespan: number;
    private size: number;
    private color: number[];

    constructor(p: p5, x: number, y: number) {
        this.p = p;
        this.position = { x, y };

        // Random velocity for particle spread
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
        };

        this.maxLifespan = 30 + Math.random() * 30; // 30-60 frames
        this.lifespan = this.maxLifespan;
        this.size = 2 + Math.random() * 4;

        // Random bright colors for particles
        const colors = [
            [255, 204, 0],   // Gold
            [255, 100, 100], // Red
            [100, 200, 255], // Blue
            [255, 150, 255], // Pink
            [150, 255, 150], // Green
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update(): void {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Apply gravity
        this.velocity.y += 0.2;

        // Slow down
        this.velocity.x *= 0.98;
        this.velocity.y *= 0.98;

        this.lifespan--;
    }

    draw(): void {
        const alpha = (this.lifespan / this.maxLifespan) * 255;
        this.p.push();
        this.p.noStroke();
        this.p.fill(this.color[0], this.color[1], this.color[2], alpha);
        this.p.circle(this.position.x, this.position.y, this.size);
        this.p.pop();
    }

    isDead(): boolean {
        return this.lifespan <= 0;
    }
}

export class ParticleSystem {
    private p: p5;
    private particles: Particle[] = [];

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * Creates an explosion effect at the given position
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param count - Number of particles to spawn (default: 20)
     */
    explode(x: number, y: number, count: number = 20): void {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.p, x, y));
        }
    }

    update(): void {
        // Update all particles and remove dead ones
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
    }

    draw(): void {
        for (const particle of this.particles) {
            particle.draw();
        }
    }

    getParticleCount(): number {
        return this.particles.length;
    }
}
