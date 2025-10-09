import {subtractArc} from "./utils.js";
import {lineIntersectsArc} from "./utils.js";

export class Circle {
    constructor(p, x, y, radius) {
        this.p = p;
        this.pos = p.createVector(x, y); // p5.js vector for position
        this.x = x;
        this.y = y;
        this.r = radius;
        this.arc = [{ c: this, start: 0, stop: 2* Math.PI, colour: [255,225,225] }];
        //this.isUnited = false; // To track if it's part of a united group
    }

    draw(){
        // Set the style for our shapes
        this.p.push();
        this.p.stroke(255);      // White border
        this.p.strokeWeight(2.5);  // A nice thick border
        this.p.noFill();         // Make the inside transparent
        for(const arc of this.arc){
            this.p.arc(arc.c.x, arc.c.y, arc.c.r * 2, arc.c.r * 2, arc.start, arc.stop);
        }
        this.p.pop();
    }

    removePiece(arc1) {
        const arcs = [];
        for (const arc of this.arc) {
            const newArcs = subtractArc(arc, arc1);
            console.log(newArcs);
            for (const arc2 of newArcs) arcs.push(arc2);
        }
        this.arc = arcs;
        console.log(arcs);
    }

    intersect(line) {
        // Loop through each of the intersection arcs
        for(const arc of this.arc){
            // Check if the user's line intersects this specific arc
            if (lineIntersectsArc(line, arc)) {
                return true; // You lost
            }
        }
        return false; // All good
    }
}