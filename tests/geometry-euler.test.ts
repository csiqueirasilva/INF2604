import { crossProduct, distanceBetweenPoints, dotProduct, vectorLength } from '@geometry/affine';
import { angleBetweenVectors, angleBetweenVectorsCross, baricentricCoordsAtVectorField, checkIfVectorsOrthogonal, errorIfPointsColinear3, fastAnglePqr, fastCalcAreaTriangle2d, fastCalcAreaTriangle3d, findOrthonormalBase, findPerpendicularComponent, normalizeVector, projectVector, pseudoAngleAsSquarePerimeter, pseudoAngleBetweenVectors } from '@geometry/euler';
import { Point3 } from '@geometry/points';
import { Vector2, Vector3 } from 'three';

describe('Euler utility tests', () => {

    test('smooth transition from first to second quadrant', () => {
        const vectors = [
            new Vector2(1, 0),     // Along positive x-axis (acc should be close to 0)
            new Vector2(1, 1),     // Along the line y = x (acc should be close to 1)
            new Vector2(0, 1),     // Along positive y-axis (acc should be close to 2)
            new Vector2(-1, 1),    // Transitioning to second quadrant (acc should be slightly more than 3)
            new Vector2(-1, 0)     // Along negative x-axis (acc should be close to 4)
        ];

        const expected = [0, 1, 2, 3, 4];

        vectors.forEach((vector, index) => {
            const result = pseudoAngleAsSquarePerimeter(vector);
            expect(result).toBeCloseTo(expected[index], 5); // Allow some numerical tolerance
        });
    });

    test('smooth transition from second to third quadrant', () => {
        const vectors = [
            new Vector2(-1, 1),    // Along the line y = -x in second quadrant (acc should be close to 3)
            new Vector2(-1, 0),    // Along negative x-axis (acc should be close to 4)
            new Vector2(-1, -1),   // Along the line y = -x in third quadrant (acc should be close to 5)
            new Vector2(0, -1),    // Along negative y-axis (acc should be close to 6)
            new Vector2(1, -1),    // Transitioning to fourth quadrant (acc should be slightly more than 7)
            new Vector2(1, 0)      // Along positive x-axis (acc should be close to 8, wraps around to 0)
        ];

        const expected = [3, 4, 5, 6, 7, 8];

        vectors.forEach((vector, index) => {
            const result = pseudoAngleAsSquarePerimeter(vector);
            expect(result).toBeCloseTo(expected[index] % 8, 5); // Allow some numerical tolerance
        });
    });

    // Test for pseudoAngleAsSquarePerimeter
    test('pseudoAngleAsSquarePerimeter - full perimeter with additional points', () => {
        const vectors = [
            new Vector2(1, 0),       // Along positive x-axis (expected: 0)
            new Vector2(0.5, 0.5),   // First quadrant, parallel to 1,1 (expected: 1)
            new Vector2(1, 1),       // First quadrant, diagonal (expected: 1)
            new Vector2(0.5, 1),     // First quadrant, closer to y-axis (expected: 1.3333)
            new Vector2(0, 1),       // Along positive y-axis (expected: 2)
            new Vector2(-0.5, 1),    // Second quadrant, closer to y-axis (expected: 2.6667)
            new Vector2(-1, 1),      // Second quadrant, diagonal (expected: 3)
            new Vector2(-1, 0.5),    // Second quadrant, closer to x-axis (expected: 3.3333)
            new Vector2(-1, 0),      // Along negative x-axis (expected: 4)
            new Vector2(-1, -0.5),   // Third quadrant, closer to x-axis (expected: 4.6667)
            new Vector2(-1, -1),     // Third quadrant, diagonal (expected: 5)
            new Vector2(-0.5, -1),   // Third quadrant, closer to y-axis (expected: 5.3333)
            new Vector2(0, -1),      // Along negative y-axis (expected: 6)
            new Vector2(0.5, -1),    // Fourth quadrant, closer to y-axis (expected: 6.6667)
            new Vector2(1, -1),      // Fourth quadrant, diagonal (expected: 7)
            new Vector2(1, -0.5)     // Fourth quadrant, closer to x-axis (expected: 7.3333)
        ];

        const expected = [
            0, 1, 1, 1.33333333, 2, 2.66666667, 3, 3.33333333, 
            4, 4.66666667, 5, 5.33333333, 6, 6.66666667, 7, 7.33333333
        ];

        vectors.forEach((vector, index) => {
            const result = pseudoAngleAsSquarePerimeter(vector);
            expect(result).toBeCloseTo(expected[index], 5); // Allow some numerical tolerance
        });
    });

    // Test for normalizeVector
    test('normalizeVector', () => {
        const v = new Vector3(3, 4, 0);
        const normalized = normalizeVector(v);
        expect(normalized.length()).toBeCloseTo(1, 5); // The length should be 1
        expect(normalized.x).toBeCloseTo(0.6, 5);
        expect(normalized.y).toBeCloseTo(0.8, 5);
    });

    // Test for distanceBetweenPoints
    test('distanceBetweenPoints', () => {
        const p = new Point3(1, 2, 3);
        const q = new Point3(4, 6, 3);
        const distance = distanceBetweenPoints(p, q);
        expect(distance).toBeCloseTo(5, 5); // Distance should be 5
    });

    // Test for checkIfVectorsOrthogonal
    test('checkIfVectorsOrthogonal', () => {
        const v1 = new Vector3(1, 0, 0);
        const v2 = new Vector3(0, 1, 0);
        expect(checkIfVectorsOrthogonal(v1, v2)).toBe(true); // Should be orthogonal

        const v3 = new Vector3(1, 1, 0);
        expect(checkIfVectorsOrthogonal(v1, v3)).toBe(false); // Should not be orthogonal
    });

    // Test for projectVector
    test('projectVector', () => {
        const u = new Vector3(3, 4, 0);
        const v = new Vector3(1, 0, 0);
        const projection = projectVector(u, v);
        expect(projection.x).toBeCloseTo(3, 5); // Projection on x-axis
        expect(projection.y).toBeCloseTo(0, 5);
    });

    // Test for findPerpendicularComponent
    test('findPerpendicularComponent', () => {
        const u = new Vector3(3, 4, 0);
        const v = new Vector3(1, 0, 0);
        const perpComponent = findPerpendicularComponent(u, v);
        expect(perpComponent.x).toBeCloseTo(0, 5);
        expect(perpComponent.y).toBeCloseTo(4, 5); // Perpendicular component along y-axis
    });

    // Test for angleBetweenVectors
    test('angleBetweenVectors', () => {
        const u = new Vector3(1, 0, 0);
        const v = new Vector3(0, 1, 0);
        const angle = angleBetweenVectors(u, v);
        expect(angle).toBeCloseTo(Math.PI / 2, 5); // 90 degrees or PI/2 radians
    });

    // Test for pseudoAngleBetweenVectors
    test('pseudoAngleBetweenVectors', () => {
        const u = new Vector3(1, 0, 0);
        const v = new Vector3(1, 1, 0);
        const pseudoAngle = pseudoAngleBetweenVectors(u, v);
        expect(pseudoAngle).toBeCloseTo(0.29289, 5); // Expected pseudo-angle
    });

    // Test for fastCalcAreaTriangle2d
    test('fastCalcAreaTriangle2d should correctly calculate the area of a triangle in 2D', () => {
        const p = new Point3(0, 0, 0);
        const q = new Point3(1, 0, 0);
        const r = new Point3(0, 1, 0);
        const area = fastCalcAreaTriangle2d(p, q, r);
        expect(area).toBeCloseTo(0.5, 5);
    });

    // Test for fastCalcAreaTriangle3d
    test('fastCalcAreaTriangle3d should correctly calculate the volume of a tetrahedron in 3D', () => {
        const p = new Point3(0, 0, 0);
        const q = new Point3(1, 0, 0);
        const r = new Point3(0, 1, 0);
        const t = new Point3(0, 0, 1);
        const volume = fastCalcAreaTriangle3d(p, q, r, t);
        expect(volume).toBeCloseTo(1 / 6, 5);
    });

    // Test for fastAnglePqr
    test('fastAnglePqr should correctly calculate the angle between vectors in 2D', () => {
        const p = new Point3(1, 0, 0);
        const q = new Point3(0, 0, 0);
        const r = new Point3(0, 1, 0);
        const angle = fastAnglePqr(p, q, r);
        expect(angle).toBeCloseTo(-Math.PI / 2, 5);
    });

    // Test for angleBetweenVectorsCross
    test('angleBetweenVectorsCross should correctly calculate the angle between vectors in 3D using cross product', () => {
        const u = new Vector3(1, 0, 0);
        const v = new Vector3(0, 1, 0);
        const angle = angleBetweenVectorsCross(u, v);
        expect(angle).toBeCloseTo(Math.PI / 2, 5);
    });

    // Test for findOrthonormalBase
    test('findOrthonormalBase should return an orthonormal basis in 3D', () => {
        const n = new Vector3(0, 0, 1);
        const base = findOrthonormalBase(n);
        expect(vectorLength(crossProduct(base.u, base.v))).toBeCloseTo(1, 5);
        expect(vectorLength(base.u)).toBeCloseTo(1, 5);
        expect(vectorLength(base.v)).toBeCloseTo(1, 5);
        expect(vectorLength(base.w)).toBeCloseTo(1, 5);
        expect(dotProduct(base.u, base.v)).toBeCloseTo(0, 5);
        expect(dotProduct(base.v, base.w)).toBeCloseTo(0, 5);
        expect(dotProduct(base.u, base.w)).toBeCloseTo(0, 5);
    });

    // Test for errorIfPointsColinear3
    test('errorIfPointsColinear3 should throw an error if points are collinear', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 1, 1);
        const p3 = new Point3(2, 2, 2); // Collinear with p1 and p2
        expect(() => errorIfPointsColinear3(p1, p2, p3)).toThrow("Operação ilegal: pontos colinerares");
    });

    // Test for baricentricCoordsAtVectorField
    test('baricentricCoordsAtVectorField should return correct barycentric coordinates for vector field in 2D', () => {
        const v1 = new Point3(1, 0, 0);
        const v2 = new Point3(0, 1, 0);
        const v3 = new Point3(-1, -1, 0);
        const baryCoords = baricentricCoordsAtVectorField(v1, v2, v3);
        expect(baryCoords.x + baryCoords.y + baryCoords.z).toBeCloseTo(1, 5);
        // Further assertions can be made depending on the expected values.
    });

});
