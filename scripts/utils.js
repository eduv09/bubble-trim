// utils.js

/**
 * Checks if a line segment intersects with a circular arc.
 * @param {object} line - The line segment { p1: {x, y}, p2: {x, y} }.
 * @param {object} arc - The arc data { c: {x, y, r}, start: startAngle, stop: stopAngle }.
 * @returns {boolean} - True if they intersect, false otherwise.
 */
export function lineIntersectsArc(line, arc) {
    // First, find the intersection points of the line (as an infinite line) and the arc's circle.
    const intersectionPoints = getLineCircleIntersections(line, arc.c);

    for (const p of intersectionPoints) {
        // For each intersection point, we need to verify two things:
        // 1. Is the point on the LINE SEGMENT?
        // 2. Is the point on the ARC (not just the circle)?

        const onSegment = isPointOnLineSegment(p, line);
        const onArc = isPointOnArc(p, arc);
        console.log(onSegment);
        if (onSegment && onArc) {
            return true; // We found a valid intersection!
        }
    }

    return false; // No intersection found.
}

// --- Helper Functions ---

/**
 * Finds intersection points between an infinite line and a circle.
 * A bit of analytic geometry.
 */
function getLineCircleIntersections(line, circle) {
    let { p1, p2 } = line;
    let { x, y, r } = circle;
    let points = [];

    // Shift coordinate system to place circle center at the origin
    let p1_prime = { x: p1.x - x, y: p1.y - y };
    let p2_prime = { x: p2.x - x, y: p2.y - y };

    let dx = p2_prime.x - p1_prime.x;
    let dy = p2_prime.y - p1_prime.y;
    let dr = Math.sqrt(dx * dx + dy * dy);
    let D = p1_prime.x * p2_prime.y - p2_prime.x * p1_prime.y;

    let discriminant = r * r * dr * dr - D * D;

    if (discriminant >= 0) {
        let sqrt_discriminant = Math.sqrt(discriminant);
        let sgn_dy = dy < 0 ? -1 : 1;

        let x1 = (D * dy + sgn_dy * dx * sqrt_discriminant) / (dr * dr);
        let y1 = (-D * dx + Math.abs(dy) * sqrt_discriminant) / (dr * dr);
        points.push({ x: x1 + x, y: y1 + y }); // Shift back to original coordinates

        if (discriminant > 0) { // Two distinct points
            let x2 = (D * dy - sgn_dy * dx * sqrt_discriminant) / (dr * dr);
            let y2 = (-D * dx - Math.abs(dy) * sqrt_discriminant) / (dr * dr);
            points.push({ x: x2 + x, y: y2 + y });
        }
    }
    return points;
}

/**
 * Checks if a point lies on a given line segment.
 */
function isPointOnLineSegment(p, line) {
    const { p1, p2 } = line;
    // Check if the point's coordinates are between the segment's start and end coordinates.
    // Includes a small tolerance for floating point inaccuracies.
    const tolerance = 0.1;
    const isBetweenX = p.x >= Math.min(p1.x, p2.x) - tolerance && p.x <= Math.max(p1.x, p2.x) + tolerance;
    const isBetweenY = p.y >= Math.min(p1.y, p2.y) - tolerance && p.y <= Math.max(p1.y, p2.y) + tolerance;
    return isBetweenX && isBetweenY;
}


/**
 * Checks if a point on a circle lies within the angle bounds of an arc.
 */
function isPointOnArc(p, arc) {
    const { c, start, stop } = arc;
    const angle = Math.atan2(p.y - c.y, p.x - c.x);

    // Normalize angles to be between 0 and 2*PI for consistent comparison
    const twoPi = 2 * Math.PI;
    const normAngle = (angle + twoPi) % twoPi;
    const normStart = (start + twoPi) % twoPi;
    const normStop = (stop + twoPi) % twoPi;

    if (normStart < normStop) {
        // Standard case: arc doesn't cross the 0-radian line
        return normAngle >= normStart && normAngle <= normStop;
    } else {
        // Arc crosses the 0-radian line (e.g., from 300 to 30 degrees)
        return normAngle >= normStart || normAngle <= normStop;
    }
}


/**
 * Subtracts arcB from arcA, returning the parts of arcA that do not overlap with arcB.
 * This is a geometric set difference operation.
 * @param {object} arcA - The arc to be subtracted from. { c, r, start, stop }
 * @param {object} arcB - The arc to subtract ("the cutter"). { c, r, start, stop }
 * @returns {Array<object>} An array containing the resulting 0, 1, or 2 arcs.
 */
export function subtractArc(arcA, arcB) {
    const twoPi = 2 * Math.PI;
    // Normalize arcB's start and stop to [0, 2PI]
    let bStart = ((arcB.start % twoPi) + twoPi) % twoPi;
    let bStop = ((arcB.stop % twoPi) + twoPi) % twoPi;

    // If arcB wraps around, split into two intervals
    let bIntervals = [];
    if (bStop >= bStart) {
        bIntervals.push([bStart, bStop]);
    } else {
        bIntervals.push([bStart, twoPi]);
        bIntervals.push([0, bStop]);
    }

    // Helper: subtract a single interval from arcA
    const subtractInterval = (aStart, aStop, bStart, bStop) => {
        // No overlap
        if (bStop <= aStart || bStart >= aStop) {
            return [{ start: aStart, stop: aStop }];
        }
        // b fully covers a
        if (bStart <= aStart && bStop >= aStop) {
            return [];
        }
        // b overlaps left
        if (bStart <= aStart && bStop < aStop) {
            return [{ start: bStop, stop: aStop }];
        }
        // b overlaps right
        if (bStart > aStart && bStop >= aStop) {
            return [{ start: aStart, stop: bStart }];
        }
        // b is inside a
        if (bStart > aStart && bStop < aStop) {
            return [
                { start: aStart, stop: bStart },
                { start: bStop, stop: aStop }
            ];
        }
        // fallback
        return [{ start: aStart, stop: aStop }];
    }

    // Start with arcA
    let result = [{ start: arcA.start, stop: arcA.stop }];
    for (const [bS, bE] of bIntervals) {
        let newResult = [];
        for (const seg of result) {
            newResult.push(...subtractInterval(seg.start, seg.stop, bS, bE));
        }
        result = newResult;
    }
    // Clamp to [0, 2PI]
    result = result.filter(
        seg => {return seg.stop > seg.start && seg.start >= 0 && seg.stop <= twoPi}
    ).map(arc => {return {...arcA, start: arc.start, stop: arc.stop}});

    return result;
}