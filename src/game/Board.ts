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
    }

    getRemainingCuts(): number {
        return this.intersections.length;
    }

    checkVictory(): boolean {
        return this.intersections.length === 0;
    }

    checkLoss(line: ILine): boolean {
        for (const circle of this.circles) {
            if (circle.intersect(line)) {
                return true;
            }
        }
        return false;
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
            circle.draw();
        }
        this.animationManager.draw();
    }
}
