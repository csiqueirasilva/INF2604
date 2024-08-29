import { Point3 } from "@geometry/affine";
import { isInSphere, calcDiameter, calcCircumsphere } from "@geometry/minsphere";

describe('Geometry Functions', () => {
    describe('isInSphere', () => {
        it('should return true if a point is inside the sphere', () => {
            const sphere = { origin: new Point3(0, 0, 0), radius: 5 };
            const pointInside = new Point3(2, 2, 1);
            expect(isInSphere(sphere, pointInside)).toBe(true);
        });

        it('should return false if a point is outside the sphere', () => {
            const sphere = { origin: new Point3(0, 0, 0), radius: 5 };
            const pointOutside = new Point3(10, 10, 10);
            expect(isInSphere(sphere, pointOutside)).toBe(false);
        });

        it('should return true if a point is on the surface of the sphere', () => {
            const sphere = { origin: new Point3(0, 0, 0), radius: 5 };
            const pointOnSurface = new Point3(3, 4, 0);
            expect(isInSphere(sphere, pointOnSurface)).toBe(true);
        });
    });

    describe('calcDiameter', () => {
        it('should correctly calculate the diameter between two points', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(4, 0, 0);
            const diameter = calcDiameter(pointA, pointB);
            expect(diameter.origin.x).toEqual(2);
            expect(diameter.origin.y).toEqual(0);
            expect(diameter.origin.z).toEqual(0);
            expect(diameter.radius).toBeCloseTo(2);
        });

        it('should handle points in different quadrants', () => {
            const pointA = new Point3(-1, -1, -1);
            const pointB = new Point3(1, 1, 1);
            const diameter = calcDiameter(pointA, pointB);
            expect(diameter.origin.x).toEqual(0);
            expect(diameter.origin.y).toEqual(0);
            expect(diameter.origin.z).toEqual(0);
            expect(diameter.radius).toBeCloseTo(Math.sqrt(3));
        });
    });

    describe('calcCircumsphere', () => {
        it('should return null for co-planar points', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0, 1, 0);
            const pointD = new Point3(1, 1, 0);
            expect(calcCircumsphere(pointA, pointB, pointC, pointD)).toBeNull();
        });

        it('should correctly calculate the circumsphere for four non-coplanar points', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0, 1, 0);
            const pointD = new Point3(0, 0, 1);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC, pointD);
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toEqual(0.5);
            expect(circumsphere?.origin.y).toEqual(0.5);
            expect(circumsphere?.origin.z).toEqual(0.5);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(0.75));
        });

        it('should correctly handle points with negative coordinates', () => {
            const pointA = new Point3(-1, -1, -1);
            const pointB = new Point3(-1, 1, 1);
            const pointC = new Point3(1, -1, 1);
            const pointD = new Point3(1, 1, -1);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC, pointD);
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin).toEqual(new Point3(0, 0, 0));
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(3));
        });
    });
});