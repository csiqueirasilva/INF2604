import { Point3, orientation1D, OrientationCase, orientation2D, orientation3D, signedArea2D, signedVolume3D, rotateVector } from "@geometry/affine";
import { Vector3 } from "three";

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
