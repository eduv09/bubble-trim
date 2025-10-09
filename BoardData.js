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


export const nestedSystem = [
  { x: -60, y: 0, r: 180 },    // Large container circle on the left
  { x: 110, y: 0, r: 140 },    // Large container circle on the right
  { x: 20, y: 0, r: 90 },     // A middle circle overlapping both containers
  { x: -100, y: 30, r: 40 },    // A small circle fully inside the left container
  { x: -30, y: -50, r: 60 },   // A medium circle fully inside the left container
  { x: 130, y: -40, r: 35 }     // A small circle fully inside the right container
];


/**
 * Generates a board of circles placed randomly within a central cluster,
 * ensuring the entire cluster fits within the canvas dimensions.
 * @param {object} p - The p5 instance (for getting width and height).
 * @param {number} difficulty - The number of circles to generate.
 * @param {number} [circleRadius=100] - The radius for each generated circle.
 * @returns {Array<object>} An array of circle objects for the board.
 */
export const generateChaoticBoard = (p, difficulty, circleRadius = 100) => {
  if (difficulty <= 0) {
    return [];
  }

  const circles = [];

  // 1. Calculate the ideal spawn radius based on difficulty.
  const idealSpawnRadius = difficulty * 25;

  // 2. Calculate the maximum possible spawn radius to stay within the window.
  // We find the smaller of the window's width or height to define our boundary.
  const maxPossibleRadius = Math.min(p.width / 2, p.height / 2) - circleRadius;

  // 3. Use the smaller of the two radii. This ensures the cluster is never
  //    larger than the window, but can still be small for low difficulties.
  //    Math.max(0, ...) prevents a negative radius on very small windows.
  const spawnRadius = Math.min(idealSpawnRadius, Math.max(0, maxPossibleRadius));

  for (let i = 0; i < difficulty; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * spawnRadius;

    const x = distance * Math.cos(angle);
    const y = distance * Math.sin(angle);

    circles.push({ x, y, r: circleRadius });
  }

  return circles;
};