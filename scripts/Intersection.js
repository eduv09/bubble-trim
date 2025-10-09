import {lineIntersectsArc} from "./utils.js";

export class Intersection {
  constructor(p, c1, c2) {
    this.p = p;
    this.circle1 = c1;
    this.circle2 = c2;
    this.arcs = []; // Will store the data needed to draw the arcs
    this.calculate();
    this.colour = [225,225,225];
  }

  // Calculates the geometry of the intersection arcs
  // Calculates the geometry of the intersection arcs
    calculate() {
        this.intersectionPoints = getCircleIntersections(this.circle1, this.circle2);

        if (this.intersectionPoints.length < 2) {
            return; // No intersection to calculate
        }

        const p1 = this.intersectionPoints[0];
        const p2 = this.intersectionPoints[1];

        // Helper to create arc data
        const makeArc = (circle, from, to) => {
            let start = Math.atan2(from.y - circle.y, from.x - circle.x);
            let stop = Math.atan2(to.y - circle.y, to.x - circle.x);
            const arc = { c: circle, start, stop, colour: [5,225,225] };
            return arc; // because we draw with stroke 4
        };

        // Generate 4 possible arcs
        const arcs = [
            makeArc(this.circle1, p1, p2),
            makeArc(this.circle1, p2, p1),
            makeArc(this.circle2, p1, p2),
            makeArc(this.circle2, p2, p1)
        ];

        // Helper to check if arc midpoint is inside the other circle
        const isMidpointInside = (arc, otherCircle) => {
            let midAngle = getDirectedArcMidpoint(arc.start, arc.stop);
            let midX = arc.c.x + arc.c.r * this.p.cos(midAngle);
            let midY = arc.c.y + arc.c.r * this.p.sin(midAngle);

            let dist = Math.hypot(midX - otherCircle.x, midY - otherCircle.y);
            return dist < otherCircle.r;
        };

        // Select the two arcs whose midpoints are inside the other circle
        this.arcs = [];
        for(const arc of arcs.slice(0,2)){
            if (isMidpointInside(arc, this.circle2)) {
                //this.arcs.push(shortenArc(arc, 6));
                this.arcs.push(arc);
            }
        }
        for(const arc of arcs.slice(2,4)){
            if (isMidpointInside(arc, this.circle1)) {
                //this.arcs.push(shortenArc(arc, 6));
                this.arcs.push(arc);
            }
        }
    }

    intersect(line) {
        // Loop through each of the intersection arcs
        this.arcs = this.arcs.filter(arc => {

            // Check if the user's line intersects this specific arc
            if (lineIntersectsArc(line, arc)) {
                arc.c.removePiece(arc);
                return false;
            }
            return true;
        });
    }

    // Draws the intersection arcs
    draw() {
        this.p.push(); // Save current drawing style

        // Set the style for the intersection arcs
        // stroke(this.colour); // Use a distinct color
        this.p.strokeWeight(3);       // Make them slightly thicker
        this.p.noFill();

        for (const arcData of this.arcs) {
            this.p.stroke(arcData.colour);
            this.p.arc(arcData.c.x, arcData.c.y, arcData.c.r * 2, arcData.c.r * 2, arcData.start, arcData.stop);
            //console.log(arcData);
        }

        this.p.pop(); // Restore original drawing style
    }

}

function getDirectedArcMidpoint(startAngle, stopAngle) {
  const twoPi = 2 * Math.PI;

  // 1. Normalize both angles to a consistent range of [0, 2*PI]
  // This makes calculating the span straightforward.
  const normStart = (startAngle % twoPi + twoPi) % twoPi;
  const normStop = (stopAngle % twoPi + twoPi) % twoPi;

  // 2. Calculate the angular distance (span) in the counter-clockwise direction
  let span = normStop - normStart;
  if (span < 0) {
    span += twoPi; // If stop is "behind" start, go the long way around.
  }

  // 3. The midpoint is the start angle plus half the span
  let midAngle = normStart + span / 2;

  // 4. Normalize the final angle to the standard [-PI, PI] range
  // to match the output of functions like atan2.
  if (midAngle > Math.PI) {
    midAngle -= twoPi;
  }

  return midAngle;
}

/**
 * Calculates the intersection points of two circles.
 * @param {object} c1 - The first circle { x, y, r }.
 * @param {object} c2 - The second circle { x, y, r }.
 * @returns {Array} An array of intersection point objects [{x, y}, ...].
 */
function getCircleIntersections(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Check for cases where there are no intersections
    if (d > c1.r + c2.r || d < Math.abs(c1.r - c2.r)) {
        return []; // No intersections
    }

    // 'a' is the distance from the center of c1 to the line connecting the intersection points
    const a = (d * d - c2.r * c2.r + c1.r * c1.r) / (2 * d);

    // 'h' is the distance from that line to an intersection point
    const h = Math.sqrt(c1.r * c1.r - a * a);

    // Find the midpoint on the line between the circle centers
    const midX = c1.x + (dx * a) / d;
    const midY = c1.y + (dy * a) / d;

    // Calculate the two intersection points
    const p1 = {
        x: midX + (h * dy) / d,
        y: midY - (h * dx) / d,
    };
    const p2 = {
        x: midX - (h * dy) / d,
        y: midY + (h * dx) / d,
    };


    return [p1, p2];
}
