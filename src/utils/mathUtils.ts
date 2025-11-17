import { Circle } from '../game/shapes/Circle.js';
import { IPoint, ILine, IArc, ICircle } from '../game/types.js';

/**
 * Checks if a line segment intersects with a circular arc.
 * @param line - The line segment { start, end }.
 * @param arc - The arc data { circle, startAngle, endAngle }.
 * @returns True if they intersect, false otherwise.
 */
export function lineIntersectsArc(line: ILine, arc: IArc): boolean {
    const intersectionPoints = getLineCircleIntersections(line, arc.circle);
    for (const p of intersectionPoints) {
        const onSegment = isPointOnLineSegment(p, line);
        const onArc = isPointOnArc(p, arc);
        if (onSegment && onArc) {
            return true;
        }
    }
    return false;
}

// --- Helper Functions ---

function getLineCircleIntersections(line: ILine, circle: ICircle): IPoint[] {
    const { start: p1, end: p2 } = line;
    const { center: c, radius: r } = circle;
    const points: IPoint[] = [];

    // Shift coordinate system to place circle center at the origin
    const p1_prime = { x: p1.x - c.x, y: p1.y - c.y };
    const p2_prime = { x: p2.x - c.x, y: p2.y - c.y };

    const dx = p2_prime.x - p1_prime.x;
    const dy = p2_prime.y - p1_prime.y;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const D = p1_prime.x * p2_prime.y - p2_prime.x * p1_prime.y;

    const discriminant = r * r * dr * dr - D * D;

    if (discriminant >= 0) {
        const sqrt_discriminant = Math.sqrt(discriminant);
        const sgn_dy = dy < 0 ? -1 : 1;

        const x1 = (D * dy + sgn_dy * dx * sqrt_discriminant) / (dr * dr);
        const y1 = (-D * dx + Math.abs(dy) * sqrt_discriminant) / (dr * dr);
        points.push({ x: x1 + c.x, y: y1 + c.y });

        if (discriminant > 0) {
            const x2 = (D * dy - sgn_dy * dx * sqrt_discriminant) / (dr * dr);
            const y2 = (-D * dx - Math.abs(dy) * sqrt_discriminant) / (dr * dr);
            points.push({ x: x2 + c.x, y: y2 + c.y });
        }
    }
    return points;
}

function isPointOnLineSegment(p: IPoint, line: ILine): boolean {
    const { start: p1, end: p2 } = line;
    const tolerance = 0.1;
    const isBetweenX =
        p.x >= Math.min(p1.x, p2.x) - tolerance && p.x <= Math.max(p1.x, p2.x) + tolerance;
    const isBetweenY =
        p.y >= Math.min(p1.y, p2.y) - tolerance && p.y <= Math.max(p1.y, p2.y) + tolerance;
    return isBetweenX && isBetweenY;
}

function isPointOnArc(p: IPoint, arc: IArc): boolean {
    const { circle, startAngle, endAngle } = arc;
    const c = circle.center;
    const angle = Math.atan2(p.y - c.y, p.x - c.x);
    const twoPi = 2 * Math.PI;
    const normAngle = (angle + twoPi) % twoPi;
    const normStart = (startAngle + twoPi) % twoPi;
    const normStop = (endAngle + twoPi) % twoPi;
    if (normStart < normStop) {
        return normAngle >= normStart && normAngle <= normStop;
    } else {
        return normAngle >= normStart || normAngle <= normStop;
    }
}

/**
 * Subtracts arcB from arcA, returning the parts of arcA that do not overlap with arcB.
 * This is a geometric set difference operation.
 * @param arcA - The arc to be subtracted from.
 * @param arcB - The arc to subtract.
 * @returns An array containing the resulting 0, 1, or 2 arcs.
 */
export function subtractArc(arcA: IArc, arcB: IArc): IArc[] {
    const twoPi = 2 * Math.PI;
    let bStart = ((arcB.startAngle % twoPi) + twoPi) % twoPi;
    let bStop = ((arcB.endAngle % twoPi) + twoPi) % twoPi;
    let bIntervals: [number, number][] = [];
    if (bStop >= bStart) {
        bIntervals.push([bStart, bStop]);
    } else {
        bIntervals.push([bStart, twoPi]);
        bIntervals.push([0, bStop]);
    }
    const subtractInterval = (
        aStart: number,
        aStop: number,
        bStart: number,
        bStop: number,
    ): { start: number; stop: number }[] => {
        if (bStop <= aStart || bStart >= aStop) {
            return [{ start: aStart, stop: aStop }];
        }
        if (bStart <= aStart && bStop >= aStop) {
            return [];
        }
        if (bStart <= aStart && bStop < aStop) {
            return [{ start: bStop, stop: aStop }];
        }
        if (bStart > aStart && bStop >= aStop) {
            return [{ start: aStart, stop: bStart }];
        }
        if (bStart > aStart && bStop < aStop) {
            return [
                { start: aStart, stop: bStart },
                { start: bStop, stop: aStop },
            ];
        }
        return [{ start: aStart, stop: aStop }];
    };
    let result: { start: number; stop: number }[] = [
        { start: arcA.startAngle, stop: arcA.endAngle },
    ];
    for (const [bS, bE] of bIntervals) {
        let newResult: { start: number; stop: number }[] = [];
        for (const seg of result) {
            newResult.push(...subtractInterval(seg.start, seg.stop, bS, bE));
        }
        result = newResult;
    }
    // Only keep valid segments and map to IArc objects
    return result
        .filter((seg) => seg.stop > seg.start && seg.start >= 0 && seg.stop <= twoPi)
        .map((seg) => ({
            circle: arcA.circle,
            startAngle: seg.start,
            endAngle: seg.stop,
        }));
}


function getDirectedArcMidpoint(startAngle: number, stopAngle: number): number {
    const twoPi = 2 * Math.PI;

    // 1. Normalize both angles to a consistent range of [0, 2*PI]
    // This makes calculating the span straightforward.
    const normStart = ((startAngle % twoPi) + twoPi) % twoPi;
    const normStop = ((stopAngle % twoPi) + twoPi) % twoPi;

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
 * @param {ICircle} c1 - The first circle { x, y, r }.
 * @param {ICircle} c2 - The second circle { x, y, r }.
 * @returns {Array} An array of intersection point objects [{x, y}, ...].
 */
function getCircleIntersections(c1: ICircle, c2: ICircle): IPoint[] {
    const dx = c2.center.x - c1.center.x;
    const dy = c2.center.y - c1.center.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Check for cases where there are no intersections
    if (d > c1.radius + c2.radius || d < Math.abs(c1.radius - c2.radius)) {
        return []; // No intersections
    }

    // 'a' is the distance from the center of c1 to the line connecting the intersection points
    const a = (d * d - c2.radius * c2.radius + c1.radius * c1.radius) / (2 * d);

    // 'h' is the distance from that line to an intersection point
    const h = Math.sqrt(c1.radius * c1.radius - a * a);

    // Find the midpoint on the line between the circle centers
    const midX = c1.center.x + (dx * a) / d;
    const midY = c1.center.y + (dy * a) / d;

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


export function intersectTwoCircles(circle1: Circle, circle2: Circle): IArc[] {
    const intersectionPoints = getCircleIntersections(circle1, circle2);

    if (intersectionPoints.length < 2) {
        return []; // No intersection to calculate
    }

    const p1 = intersectionPoints[0];
    const p2 = intersectionPoints[1];

    // Helper to create arc data
    const makeArc = (circle: Circle, from: IPoint, to: IPoint) => {
        let start = Math.atan2(from.y - circle.center.y, from.x - circle.center.x);
        let stop = Math.atan2(to.y - circle.center.y, to.x - circle.center.x);
        const arc: IArc = { circle: circle, startAngle: start, endAngle: stop };
        return arc;
    };

    // Generate 4 possible arcs
    const arcs = [
        makeArc(circle1, p1, p2),
        makeArc(circle1, p2, p1),
        makeArc(circle2, p1, p2),
        makeArc(circle2, p2, p1),
    ];

    // Helper to check if arc midpoint is inside the other circle
    const isMidpointInside = (arc: IArc, otherCircle: Circle) => {
        const midAngle = getDirectedArcMidpoint(arc.startAngle, arc.endAngle);
        const midX = arc.circle.center.x + arc.circle.radius * Math.cos(midAngle);
        const midY = arc.circle.center.y + arc.circle.radius * Math.sin(midAngle);

        const dist = Math.hypot(midX - otherCircle.center.x, midY - otherCircle.center.y);
        return dist < otherCircle.radius;
    };

    // Select the two arcs whose midpoints are inside the other circle
    const resultArcs = [];
    for (const arc of arcs.slice(0, 2)) {
        if (isMidpointInside(arc, circle2)) {
            resultArcs.push(arc);
        }
    }
    for (const arc of arcs.slice(2, 4)) {
        if (isMidpointInside(arc, circle1)) {
            resultArcs.push(arc);
        }
    }

    return resultArcs;
}



export function joinIntersections (arcs: IArc[]): IArc[] {
	if (arcs.length === 0) return [];
	const arcsByCircle = new Map<Circle, IArc[]>();
	for (const arc of arcs) {
		const circle = arc.circle as Circle;
		if (!arcsByCircle.has(circle)) {
			arcsByCircle.set(circle, []);
		}
		arcsByCircle.get(circle)!.push(arc);
	}

	for (const [circle, circleArcs] of arcsByCircle.entries()) {
		const joinedArcs = joinOverlappingArcs(circleArcs);
		arcsByCircle.set(circle, joinedArcs);
	}

	const result: IArc[] = [];
	for (const circleArcs of arcsByCircle.values()) {
		result.push(...circleArcs);
	}
	return result;
}


// Define the event points for the sweep-line algorithm
interface IEventPoint {
  angle: number;
  type: 'start' | 'end';
}

/**
 * Joins all overlapping or adjacent arcs on a circle using a sweep-line algorithm.
 * This method is robust and handles all wrap-around cases correctly.
 * @param arcs Array of arcs to join.
 * @returns A new array of joined, non-overlapping arcs.
 */
function joinOverlappingArcs(arcs: IArc[]): IArc[] {
  if (arcs.length <= 1) {
    return arcs;
  }
  const circle = arcs[0].circle; // All arcs belong to the same circle

  const TWO_PI = 2 * Math.PI;
  const tolerance = 1e-9;

  // A helper to normalize angles to the [0, 2π) range
  const normalize = (angle: number) => (angle % TWO_PI + TWO_PI) % TWO_PI;

  const points: IEventPoint[] = [];
  let wrapCounter = 0; // Tracks arcs that cross the 0-radian seam

  // 1. Create event points for all start and end angles
  for (const arc of arcs) {
    const start = normalize(arc.startAngle);
    const end = normalize(arc.endAngle);

    points.push({ angle: start, type: 'start' });
    points.push({ angle: end, type: 'end' });

    // If an arc wraps around (e.g., from 6.0 to 1.0), it covers the 0-radian point.
    // We track this to know if the circle is covered at the seam.
    if (start > end) {
      wrapCounter++;
    }
  }

  // 2. Sort the event points by angle
  points.sort((a, b) => a.angle - b.angle);

  // 3. Sweep through the points to build the merged arcs
  const merged: IArc[] = [];
  let activeArcs = wrapCounter;
  let currentArcStart = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const prevAngle = (i === 0) ? 0 : points[i - 1].angle;

    // If we were in a covered segment and it just ended, create the arc
    if (activeArcs > 0 && point.angle > prevAngle + tolerance) {
      if (merged.length > 0 && Math.abs(merged[merged.length - 1].endAngle - prevAngle) < tolerance) {
        // Extend the previous arc
        merged[merged.length - 1].endAngle = point.angle;
      } else {
        // Start a new arc
        merged.push({ startAngle: prevAngle, endAngle: point.angle, circle });
      }
    }

    // Update the active arc count
    activeArcs += (point.type === 'start' ? 1 : -1);
  }

  // Handle the final segment from the last point to 2π
  if (activeArcs > 0 && TWO_PI > points[points.length - 1].angle + tolerance) {
     const lastPointAngle = points[points.length - 1].angle;
     if (merged.length > 0 && Math.abs(merged[merged.length - 1].endAngle - lastPointAngle) < tolerance) {
        merged[merged.length-1].endAngle = TWO_PI;
     } else {
        merged.push({ startAngle: lastPointAngle, endAngle: TWO_PI, circle });
     }
  }

  // Final check: if the first and last arcs in our result touch, merge them
  if (merged.length > 1 && Math.abs(merged[merged.length - 1].endAngle - TWO_PI) < tolerance && merged[0].startAngle < tolerance) {
    const last = merged.pop()!;
    merged[0].startAngle = last.startAngle;
  }

  return merged;
}


