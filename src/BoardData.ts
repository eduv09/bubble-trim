import { ICircle } from "./types.js";

export class BoardData {
    // TODO: Implement BoardData logic
}

export const classicVen: ICircle[] = [
    { center: { x: -30, y: 10 }, radius: 50 },
    { center: { x: 30, y: 0 }, radius: 50 },
];

export const threeCircleVenn: ICircle[] = [
    { center: { x: 0, y: -80 }, radius: 100 },
    { center: { x: 70, y: 50 }, radius: 100 },
    { center: { x: -70, y: 50 }, radius: 100 },
];

export const planetarySystem: ICircle[] = [
    { center: { x: 0, y: 0 }, radius: 180 },
    { center: { x: -110, y: -90 }, radius: 60 },
    { center: { x: 120, y: -70 }, radius: 75 },
    { center: { x: 80, y: 110 }, radius: 50 },
];

export const caterpillarChain: ICircle[] = [
    { center: { x: -150, y: 20 }, radius: 40 },
    { center: { x: -100, y: -10 }, radius: 50 },
    { center: { x: -40, y: 30 }, radius: 60 },
    { center: { x: 30, y: -20 }, radius: 55 },
    { center: { x: 90, y: 40 }, radius: 45 },
];

export const bubbleCluster: ICircle[] = [
    { center: { x: 0, y: 0 }, radius: 80 },
    { center: { x: 70, y: 30 }, radius: 60 },
    { center: { x: -50, y: 60 }, radius: 55 },
    { center: { x: -80, y: -40 }, radius: 45 },
    { center: { x: 40, y: -90 }, radius: 50 },
    { center: { x: 10, y: 80 }, radius: 30 },
    { center: { x: -20, y: -95 }, radius: 25 },
];

export const generateChaoticBoard = (p: any, n: number, minRadius = 20, maxRadius = 100): ICircle[] => {
    if (n <= 0) return [];
    const circles: ICircle[] = [];
    const usableWidth = p.width * 0.8;
    const usableHeight = p.height * 0.8;
    const x0 = -usableWidth / 2;
    const y0 = -usableHeight / 2;
    let attempts = 0;
    while (circles.length < n && attempts < n * 20) {
        attempts++;
        const r = minRadius + Math.random() * (maxRadius - minRadius);
        const x = x0 + r + Math.random() * (usableWidth - 2 * r);
        const y = y0 + r + Math.random() * (usableHeight - 2 * r);
        let contained = false;
        for (const c of circles) {
            if (r < c.radius) {
                const dist = Math.hypot(x - c.center.x, y - c.center.y);
                if (dist + r <= c.radius) {
                    contained = true;
                    break;
                }
            }
        }
        if (!contained) {
            circles.push({ center: { x, y }, radius: r });
        }
    }
    return circles;
};

/**
 * Generates a level with circles based on board size.
 * The number of circles is calculated from the board area and circle sizes.
 *
 * @param width - Fixed width of the board
 * @param height - Fixed height of the board
 * @param boardSizeFactor - Factor to control level difficulty (0.5 = easy, 1.0 = medium, 1.5 = hard)
 * @param minRadius - Minimum radius for circles
 * @param maxRadius - Maximum radius for circles
 * @returns Array of circles for the level
 */
export const generateLevel = (
    width: number,
    height: number,
    minRadius: number = 20,
    maxRadius: number = 100
): ICircle[] => {
    const boardArea = width * height;

    // Calculate average circle area
    const avgRadius = (minRadius + maxRadius) / 2;
    const avgCircleArea = Math.PI * avgRadius * avgRadius;

    // Calculate number of circles based on board coverage
    // Target coverage: 40-60% of board area with overlap tolerance
    const targetCoverage = 0.5;
    const overlapFactor = 0.7; // Accounts for overlaps reducing effective area
    const n = Math.floor((boardArea * targetCoverage) / (avgCircleArea * overlapFactor));

    // Ensure we have at least 2 circles and not too many
    const circleCount = Math.max(2, Math.min(n, 15));

    const circles: ICircle[] = [];
    const x0 = -width / 2;
    const y0 = -height / 2;
    let attempts = 0;

    while (circles.length < circleCount && attempts < circleCount * 20) {
        attempts++;
        const r = minRadius + Math.random() * (maxRadius - minRadius);
        const x = x0 + r + Math.random() * (width - 2 * r);
        const y = y0 + r + Math.random() * (height - 2 * r);

        let contained = false;
        for (const c of circles) {
            if (r < c.radius) {
                const dist = Math.hypot(x - c.center.x, y - c.center.y);
                if (dist + r <= c.radius) {
                    contained = true;
                    break;
                }
            }
        }

        if (!contained) {
            circles.push({ center: { x, y }, radius: r });
        }
    }

    return circles;
};
