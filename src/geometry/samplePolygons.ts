import { SampleModel } from "@geometry/sampleModel";
const geometric = require("geometric");

export const createSnakePit = function(segments : number, width: number = 1, incr: number = 2, maxY : number = 10) : number[][] {
    let ret : number[][] = [];
    let acc : number[][] = [];
    for(let i = 0; i < segments; i++) {
        const x = (width / 2) + (Math.random() * incr)
        acc.push([ x, ((i / segments) * maxY) - (maxY / 2), 0 ]);
    }
    ret.push(...acc);
    ret.push(...acc.slice(0).reverse().map(p => [ p[0] - width, p[1], 0 ]));
    return ret;
}

export const SAMPLE_POLYGONS: SampleModel[] = [
    {
        points: createSnakePit(50, 1, 2),
        name: "SNAKE PIT",
        description: "Attempt at replicating a snake like structure"
    },{
        points: geometric.polygonRandom(50).map((v : any) => [ v[0], v[1], 0 ]).reverse(),
        name: "50 side polygon",
        description: "a 50 side polygon generated with the geometric library"
    },
    {
        points: [
            [-1, 1, 0],  // Top-left
            [1, 1, 0],   // Top-right
            [1, -1, 0],  // Bottom-right
            [-1, -1, 0],  // Bottom-left
            [-1, 1, 0],  // Top-left; close
        ].reverse(),
        description: "A square with four equal sides.",
        name: "Square"
    },
    {
        points: [
            [0, 1, 0],          // Top vertex
            [0.2245, 0.309, 0], // Upper-right inner
            [0.951, 0.309, 0],  // Upper-right outer
            [0.363, -0.118, 0], // Lower-right inner
            [0.588, -0.809, 0], // Lower-right outer
            [0, -0.382, 0],     // Bottom vertex
            [-0.588, -0.809, 0],// Lower-left outer
            [-0.363, -0.118, 0],// Lower-left inner
            [-0.951, 0.309, 0], // Upper-left outer
            [-0.2245, 0.309, 0], // Upper-left inner
            [0, 1, 0], // Top vertex ; close
        ].reverse(),
        description: "A 5-pointed star polygon.",
        name: "5-Pointed Star"
    },
    {
        points: [
            [0, 1, 0],         // Top vertex
            [0.866, 0.5, 0],   // Top-right
            [0.866, -0.5, 0],  // Bottom-right
            [0, -1, 0],        // Bottom vertex
            [-0.866, -0.5, 0], // Bottom-left
            [-0.866, 0.5, 0],   // Top-left
            [0, 1, 0],         // Top vertex; close
        ].reverse(),
        description: "A regular hexagon with six equal sides.",
        name: "Hexagon"
    },
    {
        points: [
            [0, 1, 0],          // Top vertex
            [0.951, 0.309, 0],  // Top-right
            [0.588, -0.809, 0], // Bottom-right
            [-0.588, -0.809, 0],// Bottom-left
            [-0.951, 0.309, 0],  // Top-left
            [0, 1, 0],          // Top vertex; close
        ].reverse(),
        description: "A regular pentagon with five equal sides.",
        name: "Regular Pentagon"
    },
    {
        points: [
            [0, 3, 0], [1, 2.5, 0], [2, 3, 0], 
            [3, 2, 0], [2.5, 1, 0], [3, 0, 0],
            [2, -1, 0], [1, 0, 0], [0, -1, 0],
            [-1, 0, 0], [-2, -1, 0], [-3, 0, 0],
            [-2.5, 1, 0], [-3, 2, 0], [-2, 3, 0],
            [-1, 2.5, 0], [0, 3, 0]
        ].reverse(),
        description: "A concave polygon with 17 points.",
        name: "Concave Polygon 1"
    },
    {
        points: [
            [2, 4, 0], [2.5, 3.5, 0], [3.5, 3.5, 0],
            [4, 2.5, 0], [3.5, 2, 0], [4, 1.5, 0],
            [3.5, 1, 0], [2.5, 1.5, 0], [2, 1, 0],
            [1.5, 1.5, 0], [1, 1, 0], [0.5, 1.5, 0],
            [0, 1, 0], [-0.5, 1.5, 0], [-1, 1, 0],
            [-1.5, 2, 0], [-2, 3, 0], [-1.5, 3.5, 0],
            [0, 4, 0], [1.5, 4, 0], [2, 4, 0]
        ].reverse(),
        description: "A concave polygon with 21 points.",
        name: "Concave Polygon 2"
    },
    {
        points: [
            [0, 3, 0], [1, 2.5, 0], [2, 3, 0], [3, 2, 0], [2.5, 1, 0], 
            [3, 0, 0], [2.5, -1, 0], [2, -2, 0], [1, -3, 0], [0, -2.5, 0], 
            [-1, -3, 0], [-2, -2, 0], [-3, -1, 0], [-3, 0, 0], [-2.5, 1, 0],
            [-3, 2, 0], [-2, 3, 0], [-1, 2.5, 0], [0, 3, 0]
        ].reverse(),
        description: "A more complex concave polygon with 19 points.",
        name: "Concave Polygon 3"
    },
    {
        points: [
            [2, 4, 0], [3, 3.5, 0], [4, 3.2, 0], [5, 3, 0],
            [5, 2, 0], [4.5, 1, 0], [4, 0.5, 0], [3.5, 0, 0], 
            [2.5, -0.5, 0], [1.5, -1, 0], [0.5, -1.5, 0], [-0.5, -1.8, 0],
            [-1.5, -1.5, 0], [-2.5, -1, 0], [-3.5, -0.5, 0], [-4.5, 0, 0],
            [-4.5, 1, 0], [-4, 1.5, 0], [-3.5, 2, 0], [-2.5, 2.5, 0],
            [-1.5, 3, 0], [-0.5, 3.5, 0], [0.5, 4, 0], [1.5, 4.2, 0], [2, 4, 0]
        ].reverse(),
        description: "A concave polygon with 25 points",
        name: "Concave Polygon 4"
    },
    {
        points: [
            [0, 0, 0],     // Bottom-left
            [5, 0, 0],     // Bottom-right
            [5, 1, 0],     // First valley
            [3.5, 2, 0],   // Valley bottom
            [4.5, 3, 0],   // Second valley
            [3, 5, 0],     // Top-most point
            [1.5, 3, 0],   // Second valley on left side
            [2.5, 2, 0],   // Valley bottom on left side
            [0, 1, 0],     // First valley on left side
            [0, 0, 0]      // Closing the loop (back to bottom-left)
        ], // already ccw
        description: "A monotone polygon with concave valleys used for triangulation and visibility problems.",
        name: "Monotone Concave Polygon"
    },
    {
        points: [
            [0, 3, 0],      // Top point
            [1, 1, 0],      // First inner vertex
            [3, 1, 0],      // First outer vertex
            [2, 0, 0],      // Second inner vertex
            [4, -2, 0],     // Second outer vertex
            [0, -1, 0],     // Middle inner vertex
            [-4, -2, 0],    // Third outer vertex
            [-2, 0, 0],     // Third inner vertex
            [-3, 1, 0],     // Fourth outer vertex
            [-1, 1, 0],     // Fourth inner vertex
            [0, 3, 0]       // Closing the loop
        ].reverse(),
        description: "A classic star-shaped polygon used in the art gallery problem to study watchers and visibility in concave polygons.",
        name: "Star-Shaped Polygon"
    }
];

