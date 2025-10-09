import { Intersection } from "./Intersection.js";
import { Circle } from "./Circle.js";

export class Board {
    constructor(p, circlesData) {
        this.p = p;
        this.circles = [];
        this.intersections = [];

        // Create Circle objects from the provided data
        circlesData.forEach(c => {
            this.circles.push(new Circle(p, c.x, c.y, c.r));
        });

        this.calculateAllIntersections();

        this.totalCuts = this.getRemainingCuts();
    }

    calculateAllIntersections() {
        for (let i = 0; i < this.circles.length; i++) {
            for (let j = i + 1; j < this.circles.length; j++) {
                const intersection = new Intersection(this.p, this.circles[i], this.circles[j]);
                if(intersection.intersectionPoints.length == 2){
                    this.intersections.push(intersection);
                }
            }
        }
    }

    getRemainingCuts(){
        let remainingCuts = 0;
        this.intersections.forEach(element => {
            remainingCuts += element.arcs.length;
        });
        return remainingCuts;
    }

    checkVictory(){
        return this.intersections.length === 0;
    }

    checkLoss(line){
        for (const circle of this.circles) {
            if (circle.intersect(line)) {
                return true; // You lost
            }
        }
        return false; // All good
    }

    getProgress(){
        return ((1 - this.getRemainingCuts() / this.totalCuts) * 100).toFixed(2);
    }

    checkIntersection(line){
        const newIntersections = [];
        for (const intersection of this.intersections){
            intersection.intersect(line);
            if(intersection.arcs.length > 0) {
                newIntersections.push(intersection);
            }
            else {
                console.log("Intersection removed");
            }
        }
        this.intersections = newIntersections;
    }

    draw(){
        for (const circle of this.circles) {
            circle.draw();
        }
        /*for (const intersection of this.intersections) {
            intersection.draw();
        }*/
    }

}