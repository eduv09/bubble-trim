import type p5 from 'p5';
import { Circle } from './Circle.js';
import { IArc, ICircle, ILine } from './types.js';
import { intersectTwoCircles, joinIntersections, lineIntersectsArc } from './utils/utils.js';

export class Board {
    p: p5;
    circles: Circle[] = [];
    intersections: IArc[] = [];
    totalCuts: number = 0;

    constructor(p: p5, circlesData: ICircle[]) {
        this.p = p;
        this.circles = circlesData.map((c) => new Circle(p, c));
        this.calculateAllIntersections();
        this.totalCuts = this.intersections.length;
        console.log(`Total cuts needed: ${this.totalCuts}`);
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
        // Merge overlapping or adjacent arcs
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

    checkIntersection(line: ILine): void {
        this.intersections = this.intersections.filter(intersection => {
            if (lineIntersectsArc(line, intersection)) {
                (intersection.circle as Circle).removePiece(intersection);
                return false;
            }
            return true;
        });
    }

    draw(): void {
        for (const circle of this.circles) {
            circle.draw();
        }
    }
}
