function rotatePoint(point: number[], angle: number): number[] {
  const [x, y, z] = point;
  const [ax, ay, az] = [0, 0, 1];
  
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  
  const rotatedX = x * cosAngle - y * sinAngle;
  const rotatedY = x * sinAngle + y * cosAngle;
  
  return [parseFloat(rotatedX.toFixed(4)), parseFloat(rotatedY.toFixed(4)), z];
}

function generateTrianglePoints(
  baseLeft: number[],
  baseRight: number[],
  top: number[],
  numPointsBase: number,
  numPointsSides: number,
  angle: number = 0
): number[][] {
  // Calculate points on the base
  const basePoints = Array.from({ length: numPointsBase - 2 }, (_, i) => {
    const t = (i + 1) / (numPointsBase - 1);  // Fraction along the base
    const x = baseLeft[0] + t * (baseRight[0] - baseLeft[0]);
    const y = baseLeft[1] + t * (baseRight[1] - baseLeft[1]);
    return rotatePoint([parseFloat(x.toFixed(4)), parseFloat(y.toFixed(4)), 0], angle);
  });

  // Calculate points on the left side (baseLeft -> top)
  const leftSidePoints = Array.from({ length: numPointsSides - 2 }, (_, i) => {
    const t = (i + 1) / (numPointsSides - 1);
    const x = baseLeft[0] + t * (top[0] - baseLeft[0]);
    const y = baseLeft[1] + t * (top[1] - baseLeft[1]);
    return rotatePoint([parseFloat(x.toFixed(4)), parseFloat(y.toFixed(4)), 0], angle);
  });

  // Calculate points on the right side (baseRight -> top)
  const rightSidePoints = Array.from({ length: numPointsSides - 2 }, (_, i) => {
    const t = (i + 1) / (numPointsSides - 1);
    const x = baseRight[0] + t * (top[0] - baseRight[0]);
    const y = baseRight[1] + t * (top[1] - baseRight[1]);
    return rotatePoint([parseFloat(x.toFixed(4)), parseFloat(y.toFixed(4)), 0], angle);
  });

  // Rotate base, top, and other points
  const rotatedBaseLeft = rotatePoint(baseLeft, angle);
  const rotatedBaseRight = rotatePoint(baseRight, angle);
  const rotatedTop = rotatePoint(top, angle);

  // Combine all points: base vertices, basePoints, leftSidePoints, rightSidePoints
  const points = [
    rotatedBaseLeft,           // Left vertex of the base
    rotatedBaseRight,          // Right vertex of the base
    rotatedTop,                // Top vertex
    ...basePoints,             // Points along the base
    ...leftSidePoints,         // Points along the left side
    ...rightSidePoints         // Points along the right side
  ];

  return points;
}

export const SAMPLE_POINT_CLOUDS = [
  {
    name: '10 pontos em 2D',
    points: [
      [-3.2, 2.4],
      [1.7, -1.9],
      [-0.8, -3.1],
      [0.9, 4.5],
      [-2.5, -0.6],
      [2.3, 1.8],
      [-3.9, -1.4],
      [4.8, -4.2],
      [1.2, 0.3],
      [-1.6, 3.7],
    ],
    description: `Radius: 5.19, Center: (0.97, -0.69, 0.00)`,
  },
  {
    name: '10 pontos em 3D',
    points: [
      [-2.1, 1.6, -4.3],
      [3.5, -2.4, 1.1],
      [-4.4, 3.2, -1.9],
      [1.4, -3.8, 2.7],
      [-0.3, 2.9, -3.5],
      [4.1, -1.2, 1.9],
      [-3.2, -4.6, 3.5],
      [0.2, 0.5, -0.2],
      [2.9, 4.3, -2.3],
      [-1.2, -2.5, 4.6],
    ],
    description: `Radius: 6.12, Center: (-0.15, -0.15, 0.60)`,
  },
  {
    name: '40 pontos em 2D',
    points: [
      [-4.8, -4.7],
      [-4.6, -4.3],
      [-4.4, -3.9],
      [-4.2, -3.5],
      [-4.0, -3.1],
      [-3.8, -2.7],
      [-3.6, -2.3],
      [-3.4, -1.9],
      [-3.2, -1.5],
      [-3.0, -1.1],
      [-2.8, -0.7],
      [-2.6, -0.3],
      [-2.4, 0.1],
      [-2.2, 0.5],
      [-2.0, 0.9],
      [-1.8, 1.3],
      [-1.6, 1.7],
      [-1.4, 2.1],
      [-1.2, 2.5],
      [-1.0, 2.9],
      [-0.8, 3.3],
      [-0.6, 3.7],
      [-0.4, 4.1],
      [-0.2, 4.5],
      [0.0, 4.9],
      [0.2, 4.5],
      [0.4, 4.1],
      [0.6, 3.7],
      [0.8, 3.3],
      [1.0, 2.9],
      [1.2, 2.5],
      [1.4, 2.1],
      [1.6, 1.7],
      [1.8, 1.3],
      [2.0, 0.9],
      [2.2, 0.5],
      [2.4, 0.1],
      [2.6, -0.3],
      [2.8, -0.7],
      [3.0, -1.1],
    ],
    description: `Radius: 5.37, Center: (-2.25, 0.02, 0.00)`,
  },
  {
    name: '40 pontos em 3D',
    points: [
      [-4.9, -4.9, -4.9],
      [-4.6, -4.6, -4.6],
      [-4.3, -4.3, -4.3],
      [-4.0, -4.0, -4.0],
      [-3.7, -3.7, -3.7],
      [-3.4, -3.4, -3.4],
      [-3.1, -3.1, -3.1],
      [-2.8, -2.8, -2.8],
      [-2.5, -2.5, -2.5],
      [-2.2, -2.2, -2.2],
      [-1.9, -1.9, -1.9],
      [-1.6, -1.6, -1.6],
      [-1.3, -1.3, -1.3],
      [-1.0, -1.0, -1.0],
      [-0.7, -0.7, -0.7],
      [-0.4, -0.4, -0.4],
      [-0.1, -0.1, -0.1],
      [0.2, 0.2, 0.2],
      [0.5, 0.5, 0.5],
      [0.8, 0.8, 0.8],
      [1.1, 1.1, 1.1],
      [1.4, 1.4, 1.4],
      [1.7, 1.7, 1.7],
      [2.0, 2.0, 2.0],
      [2.3, 2.3, 2.3],
      [2.6, 2.6, 2.6],
      [2.9, 2.9, 2.9],
      [3.2, 3.2, 3.2],
      [3.5, 3.5, 3.5],
      [3.8, 3.8, 3.8],
      [4.1, 4.1, 4.1],
      [4.4, 4.4, 4.4],
      [-4.9, 4.9, -4.9],
      [-4.6, 4.6, -4.6],
      [-4.3, 4.3, -4.3],
      [-4.0, 4.0, -4.0],
      [-3.7, 3.7, -3.7],
      [-3.4, 3.4, -3.4],
      [-3.1, 3.1, -3.1],
      [-2.8, 2.8, -2.8],
      [-2.5, 2.5, -2.5],
      [-2.2, 2.2, -2.2],
    ],
    description: `Radius: 8.06, Center: (-0.38, 0.00, -0.38)`,
  },
  {
    name: 'Pontos coplanares em 3D (plano: z = 0.5x - y + 2)',
    points: [
      [-4.0, -4.0, 4.0],
      [-2.5, -3.0, 3.25],
      [-1.0, -2.0, 2.5],
      [0.5, -1.0, 1.75],
      [2.0, 0.0, 1.0],
      [-3.5, 1.0, 4.75],
      [-2.0, 2.0, 4.0],
      [-0.5, 3.0, 3.25],
      [1.0, 4.0, 2.5],
      [2.5, 5.0, 1.75],
    ],
    description: `Radius: 5.66, Center: (-0.75, 0.5, 2.88)`,
  },
  {
    name: '10 pontos, alguns colineares',
    points: [
      [-5.0, -5.0],
      [-3.5, -3.5],
      [-2.0, -2.0], // Pontos colineares ao longo de y = x
      [2.3, -3.6],
      [-1.4, 2.8],
      [4.6, -0.9],
      [-0.6, 4.1],
      [3.8, 1.5],
      [-2.5, -1.1],
      [0.3, 4.8],
    ],
    description: `Radius: 5.74, Center: (-1.14, -0.76, -0.00)`,
  },
  {
    name: '50 pontos na periferia de um círculo (z=0)',
    points: [
      // Pontos calculados usando x = r * cos(θ), y = r * sin(θ), r = 5
      // θ de 0 a 2π em 50 passos
      ...Array.from({ length: 50 }, (_, i) => {
        const theta = (2 * Math.PI * i) / 50;
        const x = 5 * Math.cos(theta);
        const y = 5 * Math.sin(theta);
        return [parseFloat(x.toFixed(4)), parseFloat(y.toFixed(4)), 0.0];
      }),
    ],
    description: `Radius: 5.00, Center: (0.00, 0.00, 0.00)`,
  },
  {
    name: '30 pontos no eixo y (x=0, z=0)',
    points: [
      ...Array.from({ length: 30 }, (_, i) => {
        const y = -5 + (i * 10) / 29; // y varies from -5 to 5
        return [0.0, parseFloat(y.toFixed(2)), 0.0];
      }),
    ],
    description: `Radius: 5.00, Center: (0.00, 0.00, 0.00)`,
  },
  {
    name: '30 pontos no eixo y (x=0, z=0) + 1 não colinear',
    points: [
      ...Array.from({ length: 30 }, (_, i) => {
        const y = -5 + (i * 10) / 29; // y varies from -5 to 5
        return [0.0, parseFloat(y.toFixed(2)), 0.0];
      }),
      [5, 0, 0]
    ],
    description: `Radius: 5.00, Center: (0.00, 0.00, 0.00)`,
  },
  {
    name: '40 pontos nas arestas de um quadrado',
    points: [
      // Aresta inferior de (-5, -5) a (5, -5)
      ...Array.from({ length: 10 }, (_, i) => {
        const x = -5 + (i * 10) / 9; // x varia de -5 a 5
        return [parseFloat(x.toFixed(2)), -5.0];
      }),
      // Aresta direita de (5, -5) a (5, 5)
      ...Array.from({ length: 10 }, (_, i) => {
        const y = -5 + (i * 10) / 9; // y varia de -5 a 5
        return [5.0, parseFloat(y.toFixed(2))];
      }),
      // Aresta superior de (5, 5) a (-5, 5)
      ...Array.from({ length: 10 }, (_, i) => {
        const x = 5 - (i * 10) / 9; // x varia de 5 a -5
        return [parseFloat(x.toFixed(2)), 5.0];
      }),
      // Aresta esquerda de (-5, 5) a (-5, -5)
      ...Array.from({ length: 10 }, (_, i) => {
        const y = 5 - (i * 10) / 9; // y varia de 5 a -5
        return [-5.0, parseFloat(y.toFixed(2))];
      }),
    ],
    description: `Radius: 7.07, Center: (0.00, 0.00)`,
  },
  {
    name: 'Triângulo com 15 pontos',
    points: [ 
      ...generateTrianglePoints([0, 0, 0], [5, 0, 0], [2.5, 4.33, 0], 5, 5),
      [2.5, 1, 0],
      [2.5, 2, 0],
      [2.5, 3, 0]
    ],
    description: `Radius: 2.89, Center: (2.50, 1.44, 0.00)`,
  },
  {
    name: 'Triângulo com 12 pontos rotacionado',
    points: [ 
      ...generateTrianglePoints([0, 0, 0], [5, 0, 0], [2.5, 4.33, 0], 5, 5, Math.PI / 4)
    ],
    description: `Radius: 2.89, Center: (0.75, 2.79, 0.00)`,
  },
];