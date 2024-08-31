import { det4x4 } from "@geometry/math";

describe('det4x4', () => {
    test('calculates determinant for a 4x4 identity matrix', () => {
        const matrix = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ];

        const result = det4x4(matrix);
        expect(result).toBeCloseTo(1);
    });

    test('calculates determinant for a simple 4x4 matrix', () => {
        const matrix = [
            [2, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 2, 0],
            [0, 0, 0, 2],
        ];

        const result = det4x4(matrix);
        expect(result).toBeCloseTo(16); // 2^4 = 16
    });

    test('calculates determinant for a 4x4 matrix with non-zero off-diagonal elements', () => {
        const matrix = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
        ];

        const result = det4x4(matrix);
        expect(result).toBeCloseTo(0); // This matrix is singular, determinant should be 0
    });

    test('calculates determinant for a negative and mixed values matrix', () => {
        const matrix = [
            [-1, 2, -3, 4],
            [5, -6, 7, -8],
            [-9, 10, -11, 12],
            [13, -14, 15, -16],
        ];

        const result = det4x4(matrix);
        expect(result).toBeCloseTo(0); // This matrix is also singular, determinant should be 0
    });

    test('calculates determinant for a complex 4x4 matrix', () => {
        const matrix = [
            [2, -3, 1, 5],
            [4, 0, -2, 6],
            [7, 1, 3, -4],
            [-1, 4, 2, 0],
        ];

        const result = det4x4(matrix);
        expect(result).toBeCloseTo(1050); // This is the correct determinant for the matrix
    });
});