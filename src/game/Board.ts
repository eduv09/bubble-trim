import type p5 from 'p5';
import { Circle } from './shapes/Circle.js';
import { IArc, ICircle, ILine } from './types.js';
import { intersectTwoCircles, joinIntersections, lineIntersectsArc } from '../utils/mathUtils.js';
import { SoundManager } from '../sound/SoundManager.js';
import { AnimationManager } from '../animations/AnimationManager.js';

export class Board {
    p: p5;
    circles: Circle[] = [];
    intersections: IArc[] = [];
    totalCuts: number = 0;
    animationManager: AnimationManager;
    soundManager: SoundManager;
    missedCuts: number = 0;
    // Number of lives consumed via hints. Hints count toward game-over like missed cuts.
    hintsUsed: number = 0;
    hintedCircles: Circle[] = [];

    constructor(p: p5, circlesData: ICircle[], soundManager?: SoundManager) {
        this.p = p;
        this.circles = circlesData.map((c) => new Circle(p, c));
        this.animationManager = new AnimationManager(p);
        this.soundManager = soundManager || new SoundManager(p);
        this.calculateAllIntersections();
        this.totalCuts = this.intersections.length;
    }

    calculateAllIntersections(): void {
        this.intersections = [];
        for (let i = 0; i < this.circles.length; i++) {
            for (let j = i + 1; j < this.circles.length; j++) {
                const intersections = intersectTwoCircles(this.circles[i], this.circles[j]);
                if (intersections.length == 2) {
                    intersections.forEach(intersection => this.intersections.push(intersection));
                }
            }
        }
        this.intersections = joinIntersections(this.intersections);
        this.intersections = this.intersections.filter( (arc) => {
            if (Math.abs(arc.startAngle - arc.endAngle) + 0.001 >= 2 * Math.PI) {
                this.circles = this.circles.filter( c => c !== arc.circle );
                return false;
            }

            return true;
        } );
    }

    getRemainingCuts(): number {
        return this.intersections.length;
    }

    checkVictory(): boolean {
        return this.intersections.length === 0;
    }

    /**
     * Check if a wrong cut occurred. Returns:
     * 0 = no hit
     * 1 = life lost (not game over)
     * 2 = game over
     */
    checkLoss(line: ILine): number {
        for (const circle of this.circles) {
            if (circle.intersect(line)) {
                this.soundManager.playPenaltySound();
                this.missedCuts++;
                // Check combined misses (missedCuts + hintsUsed) for game over
                if (this.missedCuts + this.hintsUsed >= 3) {
                    return 2;
                }
                return 1;
            }
        }
        return 0;
    }

    /**
     * Record that a hint was used. Hints count toward the same life budget as missed cuts.
     * Returns true if this causes game over.
     */
    recordHintUsed(): boolean {
        this.hintsUsed++;
        const intersection = this.intersections[Math.floor(Math.random() * this.intersections.length)];
        this.hintedCircles.push(intersection.circle as Circle);
        console.log("Hint used on circle at ", intersection.circle.center);
        console.log(this.hintedCircles);
        return (this.missedCuts + this.hintsUsed) >= 3;
    }

    getProgress(): string {
        return ((1 - this.getRemainingCuts() / this.totalCuts) * 100).toFixed(2);
    }

    checkIntersection(line: ILine): number {
        let hitCount = 0;
        this.intersections = this.intersections.filter(intersection => {
            if (lineIntersectsArc(line, intersection)) {
                (intersection.circle as Circle).removePiece(intersection);

                // Create explosion effect at the midpoint of the arc
                const midAngle = (intersection.startAngle + intersection.endAngle) / 2;
                const explosionX = intersection.circle.center.x +
                    Math.cos(midAngle) * intersection.circle.radius;
                const explosionY = intersection.circle.center.y +
                    Math.sin(midAngle) * intersection.circle.radius;
                this.animationManager.createActiveAnimation({
                    x: explosionX,
                    y: explosionY
                    // using default particle count
                });

                hitCount++;

                return false;
            }
            return true;
        });

        // Update hintedCircles to only include circles that still have intersections
        if (this.hintedCircles.length > 0) {
            const circlesWithIntersections = new Set(
                this.intersections.map(intersection => intersection.circle)
            );
            this.hintedCircles = this.hintedCircles.filter(circle =>
                circlesWithIntersections.has(circle)
            );
            console.log("Updated hintedCircles: ", this.hintedCircles);
        }

        // Play sound if we hit something
        if (hitCount > 0) {
            console.log(`Hit ${hitCount} intersections!`);
            this.soundManager.playPopSound();
        }


        return hitCount;
    }

    update(): void {
        this.animationManager.update();
    }

    draw(): void {
        for (const circle of this.circles) {
            if (this.hintedCircles.includes(circle)) {
                circle.hintedDraw();
            } else {
                circle.draw();
            }
        }
        this.animationManager.draw();
    }
}
