import { addVectors, crossProduct, dotProduct, Point3, scaleVector } from "@geometry/affine";
import { errorIfPointsColinear3 } from "@geometry/euler";
import { isInSphere, calcDiameter, calcCircumsphere } from "@geometry/minsphere";

describe('Geometry Functions', () => {
    
    describe('calcCircumsphere', () => {
        const pointA = new Point3(0, 0, 0);
        const pointB = new Point3(1, 0, 0);
        const pointC = new Point3(0, 1, 0);
    
        it('should check that points are not collinear', () => {
            expect(() => errorIfPointsColinear3(pointA, pointB, pointC)).not.toThrow();
        });
    
        it('should calculate the correct midpoints', () => {
            const mid1 = new Point3((pointA.x + pointB.x) / 2, (pointA.y + pointB.y) / 2, (pointA.z + pointB.z) / 2);
            const mid2 = new Point3((pointB.x + pointC.x) / 2, (pointB.y + pointC.y) / 2, (pointB.z + pointC.z) / 2);
    
            expect(mid1.x).toBeCloseTo(0.5);
            expect(mid1.y).toBeCloseTo(0);
            expect(mid1.z).toEqual(0);
            expect(mid2.x).toBeCloseTo(0.5);
            expect(mid2.y).toBeCloseTo(0.5);
            expect(mid2.z).toEqual(0);
        });
    
        it('should calculate the correct direction vectors', () => {
            const dir1 = pointB.sub(pointA);
            const dir2 = pointC.sub(pointB);
    
            expect(dir1.x).toEqual(1);
            expect(dir1.y).toEqual(0);
            expect(dir1.z).toEqual(0);
    
            expect(dir2.x).toEqual(-1);
            expect(dir2.y).toEqual(1);
            expect(dir2.z).toEqual(0);
        });
    
        it('should calculate the correct normal vector', () => {
            const dir1 = pointB.sub(pointA);
            const dir2 = pointC.sub(pointB);
            const normal = crossProduct(dir1, dir2);
    
            expect(normal.x).toBeCloseTo(0);
            expect(normal.y).toBeCloseTo(0);
            expect(normal.z).toBeCloseTo(1);
        });
    
        it('should calculate the correct bisector directions', () => {
            const dir1 = pointB.sub(pointA);
            const dir2 = pointC.sub(pointB);
            const normal = crossProduct(dir1, dir2);
    
            const bisectorDir1 = crossProduct(dir1, normal);
            const bisectorDir2 = crossProduct(dir2, normal);
    
            expect(bisectorDir1.x).toBeCloseTo(0);
            expect(bisectorDir1.y).toBeCloseTo(-1);
            expect(bisectorDir1.z).toBeCloseTo(0);
    
            expect(bisectorDir2.x).toBeCloseTo(1);
            expect(bisectorDir2.y).toBeCloseTo(1);
            expect(bisectorDir2.z).toBeCloseTo(0);
        });
    
        it('should calculate the correct determinant', () => {
            const dir1 = pointB.sub(pointA);
            const dir2 = pointC.sub(pointB);
            const normal = crossProduct(dir1, dir2);
    
            const bisectorDir1 = crossProduct(dir1, normal);
            const bisectorDir2 = crossProduct(dir2, normal);
    
            const determinant = dotProduct(crossProduct(bisectorDir1, bisectorDir2), normal);
    
            expect(determinant).toBeCloseTo(1);
        });
    
        it('should calculate the correct center of the circumsphere', () => {
            const mid1 = new Point3((pointA.x + pointB.x) / 2, (pointA.y + pointB.y) / 2, (pointA.z + pointB.z) / 2);
            const mid2 = new Point3((pointB.x + pointC.x) / 2, (pointB.y + pointC.y) / 2, (pointB.z + pointC.z) / 2);
            
            const dir1 = pointB.sub(pointA);
            const dir2 = pointC.sub(pointB);
            const normal = crossProduct(dir1, dir2);
    
            const bisectorDir1 = crossProduct(dir1, normal);
            const bisectorDir2 = crossProduct(dir2, normal);
            
            const determinant = dotProduct(crossProduct(bisectorDir1, bisectorDir2), normal);
    
            const t = dotProduct(crossProduct(mid2.sub(mid1), bisectorDir2), normal) / determinant;

            const center = addVectors(mid1.toVector3(), scaleVector(bisectorDir1, t));

            expect(center.x).toBeCloseTo(0.5);
            expect(center.y).toBeCloseTo(0.5);
            expect(center.z).toEqual(0);
        });
    
        it('should calculate the correct radius of the circumsphere', () => {
            const center = new Point3(0.5, 0.5, 0);
            const radius = center.distanceTo(pointA);
            expect(radius).toBeCloseTo(Math.sqrt(0.5));
        });
    
        it('should correctly return the circumsphere as a PolarReference object', () => {
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0.5);
            expect(circumsphere?.origin.y).toBeCloseTo(0.5);
            expect(circumsphere?.origin.z).toBeCloseTo(0);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(0.5));
        });
    });

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

    describe('calcCircumsphere using function', () => {
        it('should throw an error for collinear points', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(2, 0, 0);
            expect(() => calcCircumsphere(pointA, pointB, pointC)).toThrow();
        });
    
        it('should correctly calculate the circumsphere for three non-collinear points', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0, 1, 0);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0.5);
            expect(circumsphere?.origin.y).toBeCloseTo(0.5);
            expect(circumsphere?.origin.z).toEqual(0);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(0.5));
        });
    
        it('should correctly calculate the circumsphere for three points in a general position', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0, 0, 1);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0.5);
            expect(circumsphere?.origin.y).toEqual(0);
            expect(circumsphere?.origin.z).toBeCloseTo(0.5);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(0.5));
        });
    
        it('should correctly handle points with negative coordinates', () => {
            const pointA = new Point3(-1, -1, -1);
            const pointB = new Point3(1, -1, -1);
            const pointC = new Point3(-1, 1, -1);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0);
            expect(circumsphere?.origin.y).toBeCloseTo(0);
            expect(circumsphere?.origin.z).toEqual(-1);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(2));
        });
    });

    describe('calcCircumsphere more creative', () => {
        it('should return null for collinear points in 3D', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 1, 1);
            const pointC = new Point3(2, 2, 2);
            expect(() => calcCircumsphere(pointA, pointB, pointC)).toThrow();
        });
    
        it('should correctly calculate the circumsphere for three non-collinear points in 3D', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0, 1, 1);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
    
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0.5);
            expect(circumsphere?.origin.y).toBeCloseTo(0.5);
            expect(circumsphere?.origin.z).toBeCloseTo(0.5);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(0.75));
        });
    
        it('should calculate the correct circumsphere for a right-angled triangle in 3D', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0, 1, 0);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
    
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0.5);
            expect(circumsphere?.origin.y).toBeCloseTo(0.5);
            expect(circumsphere?.origin.z).toBeCloseTo(0);
            expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(0.5));
        });
    
        it('should correctly calculate the circumsphere for an equilateral triangle on z=0 plane', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(0.5, Math.sqrt(3) / 2, 0);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
    
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(0.5);
            expect(circumsphere?.origin.y).toBeCloseTo(Math.sqrt(3) / 6);
            expect(circumsphere?.origin.z).toBeCloseTo(0);
            expect(circumsphere?.radius).toBeCloseTo(1 / Math.sqrt(3));
        });
    
        it('should correctly calculate the circumsphere for a scalene triangle on z=0 plane', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(2, 0, 0);
            const pointC = new Point3(1, 2, 0);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
    
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(1);
            expect(circumsphere?.origin.y).toBeCloseTo(0.75);
            expect(circumsphere?.origin.z).toBeCloseTo(0);
            expect(circumsphere?.radius).toBeCloseTo(1.25);
        });
    
        it('should calculate a degenerate circumsphere for points forming a line on z=0 plane', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(1, 0, 0);
            const pointC = new Point3(2, 0, 0);
            expect(() => calcCircumsphere(pointA, pointB, pointC)).toThrow();
        });
    
        it('should calculate a circumsphere for an obtuse triangle on z=0 plane', () => {
            const pointA = new Point3(0, 0, 0);
            const pointB = new Point3(2, 0, 0);
            const pointC = new Point3(1, 3, 0);
            const circumsphere = calcCircumsphere(pointA, pointB, pointC);
    
            expect(circumsphere).not.toBeNull();
            expect(circumsphere?.origin.x).toBeCloseTo(1);
            expect(circumsphere?.origin.y).toBeCloseTo(1.3333333333333333);
            expect(circumsphere?.origin.z).toBeCloseTo(0);
            expect(circumsphere?.radius).toBeCloseTo(1.6667);
        });
    });    
    
});