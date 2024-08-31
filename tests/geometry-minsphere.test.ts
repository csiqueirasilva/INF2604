import { addVectors, crossProduct, dotProduct, scaleVector } from "@geometry/affine";
import { errorIfPointsColinear3 } from "@geometry/euler";
import { isInSphere, calcDiameter, calcCircumcircle, minSphere, calcCircumsphere } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";

describe('calcCircumcircle', () => {
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
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);
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

describe('calcCircumcircle using function', () => {
    it('should throw an error for collinear points', () => {
        const pointA = new Point3(0, 0, 0);
        const pointB = new Point3(1, 0, 0);
        const pointC = new Point3(2, 0, 0);
        expect(() => calcCircumcircle(pointA, pointB, pointC)).toThrow();
    });

    it('should correctly calculate the circumsphere for three non-collinear points', () => {
        const pointA = new Point3(0, 0, 0);
        const pointB = new Point3(1, 0, 0);
        const pointC = new Point3(0, 1, 0);
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);
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
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);
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
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);
        expect(circumsphere).not.toBeNull();
        expect(circumsphere?.origin.x).toBeCloseTo(0);
        expect(circumsphere?.origin.y).toBeCloseTo(0);
        expect(circumsphere?.origin.z).toEqual(-1);
        expect(circumsphere?.radius).toBeCloseTo(Math.sqrt(2));
    });
});

describe('calcCircumcircle more creative', () => {
    it('should return null for collinear points in 3D', () => {
        const pointA = new Point3(0, 0, 0);
        const pointB = new Point3(1, 1, 1);
        const pointC = new Point3(2, 2, 2);
        expect(() => calcCircumcircle(pointA, pointB, pointC)).toThrow();
    });

    it('should correctly calculate the circumsphere for three non-collinear points in 3D', () => {
        const pointA = new Point3(0, 0, 0);
        const pointB = new Point3(1, 0, 0);
        const pointC = new Point3(0, 1, 1);
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);

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
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);

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
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);

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
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);

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
        expect(() => calcCircumcircle(pointA, pointB, pointC)).toThrow();
    });

    it('should calculate a circumsphere for an obtuse triangle on z=0 plane', () => {
        const pointA = new Point3(0, 0, 0);
        const pointB = new Point3(2, 0, 0);
        const pointC = new Point3(1, 3, 0);
        const circumsphere = calcCircumcircle(pointA, pointB, pointC);

        expect(circumsphere).not.toBeNull();
        expect(circumsphere?.origin.x).toBeCloseTo(1);
        expect(circumsphere?.origin.y).toBeCloseTo(1.3333333333333333);
        expect(circumsphere?.origin.z).toBeCloseTo(0);
        expect(circumsphere?.radius).toBeCloseTo(1.6667);
    });
});


describe('calcCircumsphere', () => {
    test('calculates the correct sphere for a simple tetrahedron', () => {
        const p1 = new Point3(1, 0, 0);
        const p2 = new Point3(0, 1, 0);
        const p3 = new Point3(0, 0, 1);
        const p4 = new Point3(0, 0, 0);

        const { origin, radius } = calcCircumsphere(p1, p2, p3, p4);

        expect(origin.x).toBeCloseTo(0.5);
        expect(origin.y).toBeCloseTo(0.5);
        expect(origin.z).toBeCloseTo(0.5);
        expect(radius).toBeCloseTo(Math.sqrt(0.75));
    });

    test('throws an error for coplanar points', () => {
        const p1 = new Point3(1, 0, 0);
        const p2 = new Point3(0, 1, 0);
        const p3 = new Point3(1, 1, 0);
        const p4 = new Point3(0, 0, 0);

        expect(() => {
            calcCircumsphere(p1, p2, p3, p4);
        }).toThrow();
    });

    test('calculates the correct sphere for non-trivial tetrahedron', () => {
        const p1 = new Point3(1, 2, 3);
        const p2 = new Point3(2, 3, 4);
        const p3 = new Point3(3, 4, 5);
        const p4 = new Point3(4, 5, 6);

        expect(() => {
            calcCircumsphere(p1, p2, p3, p4);
        }).toThrow();
    });
});

// pedir exemplos ao professor
// describe('minSphere', () => {
//     it('should correctly calculate the minimum enclosing sphere', () => {
//         const points = [
//             new Point3(-3.5244896725141084, -1.4311068951479977, -3.535487223906173),
//             new Point3(-1.1497484301446126, -3.679556371037218, 1.2238739246149706),
//             new Point3(0.4268636761900124, 4.740537315995464, 2.737482439889563),
//             new Point3(-4.904329491597867, 2.615369354153019, 2.273861124267704),
//             new Point3(2.591657315379015, -1.0628281689460106, 1.7108500626341083),
//             new Point3(2.0449369930299692, -0.5108101038446611, 3.0666435146853726),
//             new Point3(0.6636144805925825, -1.1765143293239677, 4.411065587495152),
//             new Point3(-2.7697448055960505, -1.9935661320962583, -4.601356387821465),
//             new Point3(-0.3872857203581548, -3.1922908760623026, 2.0060717083142654),
//             new Point3(-3.072359951815391, -1.5841271475070928, 1.6858599195797126),
//             new Point3(-3.765076530262381, -0.29087448389634574, -3.809451491490903),
//             new Point3(4.167953190716604, -3.287102137389437, -3.0465341200596208),
//             new Point3(-2.8673205559032855, 2.785094696280799, -3.0648580176328366),
//             new Point3(-0.8787147734350986, -1.8899630401807221, 2.979525226878639),
//             new Point3(-2.3062219881309676, 4.084768742956783, -0.1094832209097607),
//             new Point3(-4.60440561402105, -3.8645572494002245, 3.534604074916949),
//             new Point3(-0.14893683017677084, 4.064216978597361, -2.0578838910008934),
//             new Point3(4.881763903599827, 2.06268312129459, 0.6245693927150597),
//             new Point3(-0.788921932716522, 1.7325178180702299, -3.4040404143770764),
//             new Point3(-2.5739780319768757, 1.2386328422485926, -2.453711179520659),
//             new Point3(2.2891585715216856, 0.1830750662122682, -0.9115906497000292),
//             new Point3(0.6900650154442678, 4.818736325829246, 4.622644915374998),
//             new Point3(-3.543788006981159, 4.031192307068245, 1.7277377020079054),
//             new Point3(-1.1223874599770567, -1.3101702134832727, -0.7599504956589449),
//             new Point3(-3.293624998463911, -1.616784251647434, 4.86264035814755)
//         ];

//         const expectedResult = {
//             origin: new Point3(-0.9578, 0.2187, 0.3885),
//             radius: 7.097
//         };

//         const result = minSphere(points);

//         // Assert that the result is close to the expected values
//         expect(result.origin.x).toBeCloseTo(expectedResult.origin.x);
//         expect(result.origin.y).toBeCloseTo(expectedResult.origin.y);
//         expect(result.origin.z).toBeCloseTo(expectedResult.origin.z);
//         expect(result.radius).toBeCloseTo(expectedResult.radius);
//     });
// });