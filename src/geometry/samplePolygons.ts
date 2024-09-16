import { SampleModel } from "@geometry/sampleModel";

export const SAMPLE_POLYGONS: SampleModel[] = [
    {
        points: [
            [-1, 1, 0],  // Top-left
            [1, 1, 0],   // Top-right
            [1, -1, 0],  // Bottom-right
            [-1, -1, 0],  // Bottom-left
            [-1, 1, 0],  // Top-left; close
        ],
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
        ],
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
        ],
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
        ],
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
        ],
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
        ],
        description: "A concave polygon with 21 points.",
        name: "Concave Polygon 2"
    },
    {
        points: [
            [0, 3, 0], [1, 2.5, 0], [2, 3, 0], [3, 2, 0], [2.5, 1, 0], 
            [3, 0, 0], [2.5, -1, 0], [2, -2, 0], [1, -3, 0], [0, -2.5, 0], 
            [-1, -3, 0], [-2, -2, 0], [-3, -1, 0], [-3, 0, 0], [-2.5, 1, 0],
            [-3, 2, 0], [-2, 3, 0], [-1, 2.5, 0], [0, 3, 0]
        ],
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
        ],
        description: "A concave polygon with 25 points",
        name: "Concave Polygon 4"
    }
];