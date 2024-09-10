export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export const det4x4 = (m: number[][]): number => {
    const ret = (
        m[0][0] * (m[1][1] * (m[2][2] * m[3][3] - m[2][3] * m[3][2]) -
            m[1][2] * (m[2][1] * m[3][3] - m[2][3] * m[3][1]) +
            m[1][3] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])) -
        m[0][1] * (m[1][0] * (m[2][2] * m[3][3] - m[2][3] * m[3][2]) -
            m[1][2] * (m[2][0] * m[3][3] - m[2][3] * m[3][0]) +
            m[1][3] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])) +
        m[0][2] * (m[1][0] * (m[2][1] * m[3][3] - m[2][3] * m[3][1]) -
            m[1][1] * (m[2][0] * m[3][3] - m[2][3] * m[3][0]) +
            m[1][3] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])) -
        m[0][3] * (m[1][0] * (m[2][1] * m[3][2] - m[2][2] * m[3][1]) -
            m[1][1] * (m[2][0] * m[3][2] - m[2][2] * m[3][0]) +
            m[1][2] * (m[2][0] * m[3][1] - m[2][1] * m[3][0]))
    );
    return ret;
};

export function invertMatrix3x3(matrix: number[][]): number[][] {
    const inv: number[][] = [];

    // Extracting elements from the matrix for readability
    const a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
    const d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];
    const g = matrix[2][0], h = matrix[2][1], i = matrix[2][2];

    // Calculate the determinant of the matrix
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

    // If the determinant is 0, the matrix is non-invertible
    if (det === 0) {
        throw new Error('Matrix is non-invertible');
    }

    const invDet = 1 / det; // Inverse of the determinant

    // Cofactor matrix
    inv[0] = [
        (e * i - f * h) * invDet,
        (c * h - b * i) * invDet,
        (b * f - c * e) * invDet
    ];
    inv[1] = [
        (f * g - d * i) * invDet,
        (a * i - c * g) * invDet,
        (c * d - a * f) * invDet
    ];
    inv[2] = [
        (d * h - e * g) * invDet,
        (b * g - a * h) * invDet,
        (a * e - b * d) * invDet
    ];

    return inv;
}
