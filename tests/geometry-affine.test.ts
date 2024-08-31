import { orientation1D, OrientationCase, orientation2D, orientation3D, signedArea2D, signedVolume3D, rotateVector, addVectors, crossProduct, dotProduct, interpolatePoints, multiplyPointByScalar, scaleVector, subVectors, translatePoint, vector2dLength, vectorLength } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { Vector2, Vector3 } from "three";

describe('Geometry Affine Class and Utility Functions', () => {

    describe('Point3 Class', () => {
        it('should create a Point3 with default values', () => {
            const point = new Point3();
            expect(point.x).toBe(0);
            expect(point.y).toBe(0);
            expect(point.z).toBe(0);
        });

        it('should correctly clone a Point3', () => {
            const original = new Point3(1, 2, 3);
            const clone = original.clone();
            expect(clone).not.toBe(original);
            expect(clone.x).toBe(1);
            expect(clone.y).toBe(2);
            expect(clone.z).toBe(3);
        });

        it('should subtract two points correctly', () => {
            const p1 = new Point3(3, 4, 5);
            const p2 = new Point3(1, 2, 3);
            const result = p1.sub(p2);
            expect(result.x).toBe(2);
            expect(result.y).toBe(2);
            expect(result.z).toBe(2);
        });

        it('should add two points correctly', () => {
            const p1 = new Point3(3, 4, 5);
            const p2 = new Point3(1, 2, 3);
            const result = p1.add(p2);
            expect(result.x).toBe(4);
            expect(result.y).toBe(6);
            expect(result.z).toBe(8);
        });
    });

    describe('Orientation Functions', () => {
        it('should return COLINEAR for identical 1D points', () => {
            expect(orientation1D(5, 5)).toBe(OrientationCase.COLINEAR);
        });

        it('should return COUNTER_CLOCK_WISE for increasing 1D points', () => {
            expect(orientation1D(2, 5)).toBe(OrientationCase.COUNTER_CLOCK_WISE);
        });

        it('should return CLOCK_WISE for decreasing 1D points', () => {
            expect(orientation1D(5, 2)).toBe(OrientationCase.CLOCK_WISE);
        });

        it('should return COLINEAR for collinear 2D points', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 1, 0);
            const p3 = new Point3(2, 2, 0);
            expect(orientation2D(p1, p2, p3)).toBe(OrientationCase.COLINEAR);
        });

        it('should return COUNTER_CLOCK_WISE for counterclockwise 2D points', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 0, 0);
            const p3 = new Point3(0, 1, 0);
            expect(orientation2D(p1, p2, p3)).toBe(OrientationCase.COUNTER_CLOCK_WISE);
        });

        it('should return CLOCK_WISE for clockwise 2D points', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(0, 1, 0);
            const p3 = new Point3(1, 0, 0);
            expect(orientation2D(p1, p2, p3)).toBe(OrientationCase.CLOCK_WISE);
        });

        it('should return COLINEAR for coplanar 3D points', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 1, 1);
            const p3 = new Point3(2, 2, 2);
            const p4 = new Point3(3, 3, 3);
            expect(orientation3D(p1, p2, p3, p4)).toBe(OrientationCase.COLINEAR);
        });

        it('should return COUNTER_CLOCK_WISE for a valid counterclockwise 3D configuration', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 0, 0);
            const p3 = new Point3(0, 1, 0);
            const p4 = new Point3(0, 0, 1);
            expect(orientation3D(p1, p2, p3, p4)).toBe(OrientationCase.COUNTER_CLOCK_WISE);
        });

        it('should return CLOCK_WISE for a valid clockwise 3D configuration', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(0, 1, 0);
            const p3 = new Point3(1, 0, 0);
            const p4 = new Point3(0, 0, 1);
            expect(orientation3D(p1, p2, p3, p4)).toBe(OrientationCase.CLOCK_WISE);
        });
    });

    describe('Signed Area and Volume Functions', () => {
        it('should return zero for collinear points in signedArea2D', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 1, 0);
            const p3 = new Point3(2, 2, 0);
            expect(signedArea2D(p1, p2, p3)).toBe(0);
        });

        it('should return positive value for counterclockwise points in signedArea2D', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 0, 0);
            const p3 = new Point3(0, 1, 0);
            expect(signedArea2D(p1, p2, p3)).toBeGreaterThan(0);
        });

        it('should return negative value for clockwise points in signedArea2D', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(0, 1, 0);
            const p3 = new Point3(1, 0, 0);
            expect(signedArea2D(p1, p2, p3)).toBeLessThan(0);
        });

        it('should return zero for coplanar points in signedVolume3D', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 1, 1);
            const p3 = new Point3(2, 2, 2);
            const p4 = new Point3(3, 3, 3);
            expect(signedVolume3D(p1, p2, p3, p4)).toBe(0);
        });

        it('should return positive value for valid counterclockwise configuration in signedVolume3D', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(1, 0, 0);
            const p3 = new Point3(0, 1, 0);
            const p4 = new Point3(0, 0, 1);
            expect(signedVolume3D(p1, p2, p3, p4)).toBeGreaterThan(0);
        });

        it('should return negative value for valid clockwise configuration in signedVolume3D', () => {
            const p1 = new Point3(0, 0, 0);
            const p2 = new Point3(0, 1, 0);
            const p3 = new Point3(1, 0, 0);
            const p4 = new Point3(0, 0, 1);
            expect(signedVolume3D(p1, p2, p3, p4)).toBeLessThan(0);
        });
    });

    describe('Rotate Vector Function', () => {
        it('should rotate vector correctly around Z-axis by 90 degrees', () => {
            const vector = new Vector3(1, 0, 0);
            const axis = new Vector3(0, 0, 1);
            const angle = Math.PI / 2; // 90 degrees in radians
            const result = rotateVector(vector, angle, axis);
            expect(result.x).toBeCloseTo(0);
            expect(result.y).toBeCloseTo(1);
            expect(result.z).toBeCloseTo(0);
        });

        it('should rotate vector correctly around Y-axis by 180 degrees', () => {
            const vector = new Vector3(1, 0, 0);
            const axis = new Vector3(0, 1, 0);
            const angle = Math.PI; // 180 degrees in radians
            const result = rotateVector(vector, angle, axis);
            expect(result.x).toBeCloseTo(-1);
            expect(result.y).toBeCloseTo(0);
            expect(result.z).toBeCloseTo(0);
        });

        it('should rotate vector correctly around X-axis by 45 degrees', () => {
            const vector = new Vector3(0, 1, 0);
            const axis = new Vector3(1, 0, 0);
            const angle = Math.PI / 4; // 45 degrees in radians
            const result = rotateVector(vector, angle, axis);
            expect(result.x).toBeCloseTo(0);
            expect(result.y).toBeCloseTo(Math.sqrt(2) / 2);
            expect(result.z).toBeCloseTo(Math.sqrt(2) / 2);
        });
    });
});

describe('Point3 and related functions', () => {

    it('should create a Point3 object and convert to Vector3', () => {
        const point = new Point3(1, 2, 3);
        const vector = point.toVector3();
        expect(vector.x).toEqual(1);
        expect(vector.y).toEqual(2);
        expect(vector.z).toEqual(3);
    });

    it('should clone a Point3 object', () => {
        const point = new Point3(1, 2, 3);
        const clone = point.clone();
        expect(clone.x).toEqual(1);
        expect(clone.y).toEqual(2);
        expect(clone.z).toEqual(3);
    });

    it('should subtract two Point3 objects', () => {
        const p1 = new Point3(3, 2, 1);
        const p2 = new Point3(1, 2, 3);
        const result = p1.sub(p2);
        expect(result.x).toEqual(2);
        expect(result.y).toEqual(0);
        expect(result.z).toEqual(-2);
    });

    it('should add two Point3 objects', () => {
        const p1 = new Point3(1, 2, 3);
        const p2 = new Point3(3, 2, 1);
        const result = p1.add(p2);
        expect(result.x).toEqual(4);
        expect(result.y).toEqual(4);
        expect(result.z).toEqual(4);
    });

    it('should calculate the distance between two Point3 objects', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(3, 4, 0);
        const distance = p1.distanceTo(p2);
        expect(distance).toBeCloseTo(5);
    });

    it('should calculate the median point between two Point3 objects', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(2, 2, 2);
        const median = p1.medianPointTo(p2);
        expect(median.x).toEqual(1);
        expect(median.y).toEqual(1);
        expect(median.z).toEqual(1);
    });

    it('should calculate the centroid of a list of Point3 objects', () => {
        const points = [
            new Point3(0, 0, 0),
            new Point3(2, 2, 2),
            new Point3(4, 4, 4)
        ];
        const centroid = Point3.centroid(points);
        expect(centroid.x).toEqual(2);
        expect(centroid.y).toEqual(2);
        expect(centroid.z).toEqual(2);
    });

    it('should scale a vector by a scalar', () => {
        const v = new Vector3(1, 2, 3);
        const scaled = scaleVector(v, 2);
        expect(scaled.x).toEqual(2);
        expect(scaled.y).toEqual(4);
        expect(scaled.z).toEqual(6);
    });

    it('should multiply a Point3 by a scalar', () => {
        const p = new Point3(1, 2, 3);
        const result = multiplyPointByScalar(p, 2);
        expect(result.x).toEqual(2);
        expect(result.y).toEqual(4);
        expect(result.z).toEqual(6);
    });

    it('should calculate the dot product of two vectors', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const result = dotProduct(v1, v2);
        expect(result).toBeCloseTo(32);
    });

    it('should calculate the cross product of two vectors', () => {
        const v1 = new Vector3(1, 0, 0);
        const v2 = new Vector3(0, 1, 0);
        const result = crossProduct(v1, v2);
        expect(result.x).toEqual(0);
        expect(result.y).toEqual(0);
        expect(result.z).toEqual(1);
    });

    it('should add two vectors', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const result = addVectors(v1, v2);
        expect(result.x).toEqual(5);
        expect(result.y).toEqual(7);
        expect(result.z).toEqual(9);
    });

    it('should subtract two vectors', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const result = subVectors(v1, v2);
        expect(result.x).toEqual(-3);
        expect(result.y).toEqual(-3);
        expect(result.z).toEqual(-3);
    });

    it('should translate a Point3 by a vector', () => {
        const point = new Point3(1, 1, 1);
        const vector = new Vector3(1, 2, 3);
        const translatedPoint = translatePoint(point, vector);
        expect(translatedPoint.x).toEqual(2);
        expect(translatedPoint.y).toEqual(3);
        expect(translatedPoint.z).toEqual(4);
    });

    it('should interpolate between points using scalars', () => {
        const points = [
            new Point3(0, 0, 0),
            new Point3(1, 1, 1)
        ];
        const scalars = [0.5, 0.5];
        const result = interpolatePoints(points, scalars);
        expect(result.x).toEqual(0.5);
        expect(result.y).toEqual(0.5);
        expect(result.z).toEqual(0.5);
    });

    it('should determine the orientation in 1D', () => {
        expect(orientation1D(1, 2)).toEqual(OrientationCase.COUNTER_CLOCK_WISE);
        expect(orientation1D(2, 1)).toEqual(OrientationCase.CLOCK_WISE);
        expect(orientation1D(1, 1)).toEqual(OrientationCase.COLINEAR);
    });

    it('should calculate the length of a 3D vector', () => {
        const v = new Vector3(3, 4, 0);
        const length = vectorLength(v);
        expect(length).toBeCloseTo(5);
    });

    it('should calculate the length of a 2D vector', () => {
        const v = new Vector2(3, 4);
        const length = vector2dLength(v);
        expect(length).toBeCloseTo(5);
    });

    it('should rotate a vector around an axis', () => {
        const vector = new Vector3(1, 0, 0);
        const axis = new Vector3(0, 1, 0); // y-axis
        const angle = Math.PI / 2; // 90 degrees
        const result = rotateVector(vector, angle, axis);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(-1);
    });

    it('should calculate the signed area of a triangle in 2D', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 0, 0);
        const p3 = new Point3(0, 1, 0);
        const area = signedArea2D(p1, p2, p3);
        expect(area).toBeCloseTo(1);
    });

    it('should calculate the signed volume of a tetrahedron in 3D', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 0, 0);
        const p3 = new Point3(0, 1, 0);
        const p4 = new Point3(0, 0, 1);
        const volume = signedVolume3D(p1, p2, p3, p4);
        expect(volume).toBeCloseTo(1 / 6);
    });

    it('should determine the orientation of three points in 2D', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 0, 0);
        const p3 = new Point3(0, 1, 0);
        const orientation = orientation2D(p1, p2, p3);
        expect(orientation).toEqual(OrientationCase.COUNTER_CLOCK_WISE);
    });

    it('should determine the orientation of four points in 3D', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 0, 0);
        const p3 = new Point3(0, 1, 0);
        const p4 = new Point3(0, 0, 1);
        const orientation = orientation3D(p1, p2, p3, p4);
        expect(orientation).toEqual(OrientationCase.COUNTER_CLOCK_WISE);
    });

    it('should determine the orientation of collinear points in 2D', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 1, 0);
        const p3 = new Point3(2, 2, 0);
        const orientation = orientation2D(p1, p2, p3);
        expect(orientation).toEqual(OrientationCase.COLINEAR);
    });

    it('should determine the orientation of collinear points in 3D', () => {
        const p1 = new Point3(0, 0, 0);
        const p2 = new Point3(1, 1, 1);
        const p3 = new Point3(2, 2, 2);
        const p4 = new Point3(3, 3, 3);
        const orientation = orientation3D(p1, p2, p3, p4);
        expect(orientation).toEqual(OrientationCase.COLINEAR);
    });

    it('should rotate a vector around the Y-axis', () => {
        const vector = new Vector3(1, 0, 0);
        const angle = Math.PI / 2; // 90 degrees
        const rotated = rotateVector(vector, angle, new Vector3(0, 1, 0));
        expect(rotated.x).toBeCloseTo(0);
        expect(rotated.y).toBeCloseTo(0);
        expect(rotated.z).toBeCloseTo(-1);
    });

    it('should rotate a vector around the X-axis', () => {
        const vector = new Vector3(0, 1, 0);
        const angle = Math.PI / 2; // 90 degrees
        const rotated = rotateVector(vector, angle, new Vector3(1, 0, 0));
        expect(rotated.x).toBeCloseTo(0);
        expect(rotated.y).toBeCloseTo(0);
        expect(rotated.z).toBeCloseTo(1);
    });

    it('should rotate a vector around the Z-axis', () => {
        const vector = new Vector3(1, 0, 0);
        const angle = Math.PI / 2; // 90 degrees
        const rotated = rotateVector(vector, angle, new Vector3(0, 0, 1));
        expect(rotated.x).toBeCloseTo(0);
        expect(rotated.y).toBeCloseTo(1);
        expect(rotated.z).toBeCloseTo(0);
    });

    it('should correctly handle interpolation with scalars', () => {
        const points = [
            new Point3(1, 0, 0),
            new Point3(0, 1, 0),
            new Point3(0, 0, 1),
        ];
        const scalars = [0.5, 0.5, 0];
        const result = interpolatePoints(points, scalars);
        expect(result.x).toEqual(0.5);
        expect(result.y).toEqual(0.5);
        expect(result.z).toEqual(0);
    });

    it('should throw an error when number of points and scalars do not match during interpolation', () => {
        const points = [
            new Point3(1, 0, 0),
            new Point3(0, 1, 0),
        ];
        const scalars = [0.5];
        expect(() => interpolatePoints(points, scalars)).toThrow('A quantidade de pontos e escalares de entrada deve ser a mesma');
    });
});