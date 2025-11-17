import type p5 from 'p5';
import { subtractArc, lineIntersectsArc } from '../../utils/mathUtils.js';
import { IArc, ILine, ICircle, IPoint } from '../types.js';

export class Circle implements ICircle {
    private p: p5;
    public center: IPoint;
    public radius: number;
    public arc: IArc[];

    constructor(p: p5, circleData: ICircle) {
        this.p = p;
        this.center = circleData.center;
        this.radius = circleData.radius;
        this.arc = [
            {
                circle: { center: this.center, radius: this.radius },
                startAngle: 0,
                endAngle: 2 * Math.PI,
            },
        ];
    }

    public hintedDraw(): void {
        this.p.push();
        this.p.stroke(0, 255, 255); // Cyan color for hints
        this.p.strokeWeight(2);
        this.p.noFill();
        for (const arc of this.arc) {
            const c = arc.circle.center;
            const r = arc.circle.radius;
            this.p.arc(c.x, c.y, r * 2, r * 2, arc.startAngle, arc.endAngle);
        }
        this.p.pop();
    }


    public draw(): void {
        this.p.push();
        this.p.stroke(255, 255, 255);
        this.p.strokeWeight(2);
        this.p.noFill();
        for (const arc of this.arc) {
            const c = arc.circle.center;
            const r = arc.circle.radius;
            this.p.arc(c.x, c.y, r * 2, r * 2, arc.startAngle, arc.endAngle);
        }
        this.p.pop();
    }

    removePiece(arc1: IArc): void {
        const arcs: IArc[] = [];
        for (const arc of this.arc) {
            const newArcs = subtractArc(arc, arc1);
            for (const arc2 of newArcs) arcs.push(arc2);
        }
        this.arc = arcs;
    }

    intersect(line: ILine): boolean {
        for (const arc of this.arc) {
            if (lineIntersectsArc(line, arc)) {
                return true;
            }
        }
        return false;
    }
}
