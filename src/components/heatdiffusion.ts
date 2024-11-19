function padHeatMap(heatMap: number[][], width: number, height: number): number[][] {
    const paddedHeatMap = Array.from({ length: height + 2 }, () =>
        Array(width + 2).fill(0)
    );

    // Copy the original heat map into the padded version
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            paddedHeatMap[y + 1][x + 1] = heatMap[y][x];
        }
    }

    // Handle top and bottom edges (mirror padding)
    for (let x = 0; x < width; x++) {
        paddedHeatMap[0][x + 1] = heatMap[0][x]; // Top edge
        paddedHeatMap[height + 1][x + 1] = heatMap[height - 1][x]; // Bottom edge
    }

    // Handle left and right edges (mirror padding)
    for (let y = 0; y < height; y++) {
        paddedHeatMap[y + 1][0] = heatMap[y][0]; // Left edge
        paddedHeatMap[y + 1][width + 1] = heatMap[y][width - 1]; // Right edge
    }

    // Handle corners (mirror padding)
    paddedHeatMap[0][0] = heatMap[0][0]; // Top-left
    paddedHeatMap[0][width + 1] = heatMap[0][width - 1]; // Top-right
    paddedHeatMap[height + 1][0] = heatMap[height - 1][0]; // Bottom-left
    paddedHeatMap[height + 1][width + 1] = heatMap[height - 1][width - 1]; // Bottom-right

    return paddedHeatMap;
}

function heatDiffusionStep(heatMap: number[][], width: number, height: number): number[][] {
    const paddedHeatMap = padHeatMap(heatMap, width, height); // Pad the heat map
    const newHeatMap = Array.from({ length: height }, () => Array(width).fill(0));
    const kernel = [
        [0, 1, 0],
        [1, -4, 1],
        [0, 1, 0]
    ]; // Discrete Laplacian kernel

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    sum += paddedHeatMap[y + 1 + ky][x + 1 + kx] * kernel[ky + 1][kx + 1];
                }
            }
            newHeatMap[y][x] = heatMap[y][x] + 0.25 * sum; // Diffusion factor
        }
    }

    return newHeatMap;
}

function initializeHeatMap(imageData: ImageData): number[][] {
    const width = imageData.width;
    const height = imageData.height;
    const heatMap = Array.from({ length: height }, () => Array(width).fill(0));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const brightness = (r + g + b) / 3; // Initial heat based on brightness
            heatMap[y][x] = brightness / 255; // Normalize to [0, 1]
        }
    }

    return heatMap;
}

export function simulateHeatDiffusion(imageData: ImageData, iterations: number): number[][] {
    let heatMap = initializeHeatMap(imageData);
    const width = imageData.width;
    const height = imageData.height;

    for (let i = 0; i < iterations; i++) {
        heatMap = heatDiffusionStep(heatMap, width, height);
    }

    return heatMap;
}
