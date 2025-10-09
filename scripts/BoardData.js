export const classicVen = [{ x: -30, y: 10, r: 50 }, { x: 30, y: 0, r: 50 }]

export const threeCircleVenn = [
  { x: 0, y: -80, r: 100 },
  { x: 70, y: 50, r: 100 },
  { x: -70, y: 50, r: 100 }
];

export const planetarySystem = [
  { x: 0, y: 0, r: 180 },
  { x: -110, y: -90, r: 60 },
  { x: 120, y: -70, r: 75 },
  { x: 80, y: 110, r: 50 }
];

export const caterpillarChain = [
  { x: -150, y: 20, r: 40 },
  { x: -100, y: -10, r: 50 },
  { x: -40, y: 30, r: 60 },
  { x: 30, y: -20, r: 55 },
  { x: 90, y: 40, r: 45 }
];


export const bubbleCluster = [
  { x: 0, y: 0, r: 80 },
  { x: 70, y: 30, r: 60 },
  { x: -50, y: 60, r: 55 },
  { x: -80, y: -40, r: 45 },
  { x: 40, y: -90, r: 50 },
  { x: 10, y: 80, r: 30 },
  { x: -20, y: -95, r: 25 }
];




/**
 * Generates N random circles with random radii and positions, ensuring no small circle is completely inside a bigger one.
 * @param {object} p - The p5 instance (for getting width and height).
 * @param {number} n - Number of circles to generate.
 * @param {number} minRadius - Minimum radius for circles.
 * @param {number} maxRadius - Maximum radius for circles.
 * @returns {Array<object>} Array of circle objects {x, y, r}
 */
export const generateChaoticBoard = (p, n, minRadius = 20, maxRadius = 100) => {
  if (n <= 0) return [];
  const circles = [];
  // Shrink usable area by 10% on each side (80% total)
  const usableWidth = p.width * 0.8;
  const usableHeight = p.height * 0.8;
  const x0 = -usableWidth / 2;
  const y0 = -usableHeight / 2;
  let attempts = 0;
  while (circles.length < n && attempts < n * 20) {
    attempts++;
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    // Place fully inside the shrunken canvas
    const x = x0 + r + Math.random() * (usableWidth - 2 * r);
    const y = y0 + r + Math.random() * (usableHeight - 2 * r);

    // Check: not fully inside any bigger circle
    let contained = false;
    for (const c of circles) {
      if (r < c.r) {
        const dist = Math.hypot(x - c.x, y - c.y);
        if (dist + r <= c.r) {
          contained = true;
          break;
        }
      }
    }
    if (!contained) {
      circles.push({ x, y, r });
    }
  }
  return circles;
};