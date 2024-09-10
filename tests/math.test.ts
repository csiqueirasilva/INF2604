import { det4x4, invertMatrix3x3 } from "@geometry/math";

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

describe('invertMatrix3x3', () => {

    test('should invert a basic 3x3 matrix', () => {
        const matrix = [
            [1, 2, 3],
            [0, 1, 4],
            [5, 6, 0]
        ];
        const expectedInverse = [
            [-24, 18, 5],
            [20, -15, -4],
            [-5, 4, 1]
        ];

        const result = invertMatrix3x3(matrix);

        // Check if each element of the result matches the expected inverse
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                expect(result[i][j]).toBeCloseTo(expectedInverse[i][j], 5);
            }
        }
    });

    test('should throw an error for a singular matrix', () => {
        const singularMatrix = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];

        expect(() => invertMatrix3x3(singularMatrix)).toThrow('Matrix is non-invertible');
    });

    test('should return the identity matrix when inverting an identity matrix', () => {
        const identityMatrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];

        const result = invertMatrix3x3(identityMatrix);

        // The result should still be the identity matrix
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                expect(result[i][j]).toBe(identityMatrix[i][j]);
            }
        }
    });

    test('should handle a matrix with floating-point precision', () => {
        const matrix = [
            [1.5, 2.3, 3.1],
            [0.0, 1.2, 4.6],
            [5.8, 6.4, 0.0]
        ];
    
        // Calculate the expected inverse manually or use a tool to get precise values
        const expectedInverse = [
            [6.73376029277218664, -4.53796889295516925, -1.56907593778591033],
            [-6.10247026532479414, 4.11253430924062213, 1.578225068618481244],
            [1.5919487648673376026, -0.8554437328453796887, -0.41171088746569075932]
        ];
    
        const result = invertMatrix3x3(matrix);
    
        // Check if each element of the result matches the expected inverse (allowing for floating point precision)
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                expect(result[i][j]).toBeCloseTo(expectedInverse[i][j], 4);
            }
        }
    });

});