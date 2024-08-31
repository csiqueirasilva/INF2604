import { addVectors, distanceBetweenPoints, scaleVector, subVectors, vectorLength } from "@geometry/affine";
import { normalizeVector } from "@geometry/euler";
import { Point3 } from "@geometry/points";
import { BufferGeometry, Vector3 } from "three";

export function findClosestPoints(points: Point3[]): Point3[] {
    const n = points.length;

    // Base case: when the set is small enough, use brute force
    if (n <= 3) {
        return bruteForceClosestPair(points);
    }

    // Divide the set into two halves
    const mid = Math.floor(n / 2);
    const left = points.slice(0, mid);
    const right = points.slice(mid);

    // Recursively find the closest pair in each half
    const closestLeft = findClosestPoints(left);
    const closestRight = findClosestPoints(right);

    // Determine the smaller distance between the two halves
    let minPair = closestLeft;
    let minDist = distanceBetweenPoints(closestLeft[0], closestLeft[1]);

    const rightDist = distanceBetweenPoints(closestRight[0], closestRight[1]);
    if (rightDist < minDist) {
        minDist = rightDist;
        minPair = closestRight;
    }

    // Merge step: check points near the dividing line
    const strip = points.filter(point => Math.abs(point.x - points[mid].x) < minDist);
    const stripClosest = findClosestInStrip(strip, minDist);

    if (stripClosest) {
        minPair = stripClosest;
    }

    return minPair;
}

function bruteForceClosestPair(points: Point3[]): Point3[] {
    let minDist = Infinity;
    let minPair: Point3[] = [];

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dist = distanceBetweenPoints(points[i], points[j]);
            if (dist < minDist) {
                minDist = dist;
                minPair = [points[i], points[j]];
            }
        }
    }

    return minPair;
}

function findClosestInStrip(strip: Point3[], d: number): Point3[] | null {
    let minDist = d;
    let minPair: Point3[] | null = null;

    // Sort the strip by Y coordinate
    strip.sort((a, b) => a.y - b.y);

    for (let i = 0; i < strip.length; i++) {
        for (let j = i + 1; j < strip.length && (strip[j].y - strip[i].y) < minDist; j++) {
            const dist = distanceBetweenPoints(strip[i], strip[j]);
            if (dist < minDist) {
                minDist = dist;
                minPair = [strip[i], strip[j]];
            }
        }
    }

    return minPair;
}

interface PolarReferenceDebugStep {
    radius : number
    furtherstPoint: Point3
    center: Point3
}

export interface PolarReference {
    origin: Point3
    radius: number
}

export function boundingSphereInCloud(points: Point3[]): PolarReference {
    if (points.length === 0) {
        throw new Error("Point cloud is empty.");
    }

    let sumX = 0, sumY = 0, sumZ = 0;

    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
        sumZ += point.z;
    }

    const avgX = sumX / points.length;
    const avgY = sumY / points.length;
    const avgZ = sumZ / points.length;

    let center = new Point3(avgX, avgY, avgZ);

    let maxDistance = -Infinity;
    let furthestPoint: Point3 = points[0];

    for (const point of points) {
        const distance = distanceBetweenPoints(center, point);
        if (distance > maxDistance) {
            maxDistance = distance;
            furthestPoint = point;
        }
    }

    let radius = maxDistance;

    for (const point of points) {
        const vectorToCenter = point.sub(center);
        const distanceToPoint = vectorLength(vectorToCenter);
        const excessDistance = distanceToPoint - radius;

        if (excessDistance > 0) {
            const adjustment = scaleVector(normalizeVector(vectorToCenter), excessDistance / 2);
            center = Point3.fromVector3(addVectors(center.toVector3(), adjustment));
            radius += excessDistance / 2;
        }
    }

    return {
        origin: center,
        radius: radius
    };
}

// isso não faz sentido semanticamente, mas é uma função helper - os pontos são tratados como vetores
function crossProduct(p1: Point3, p2: Point3, p3: Point3): Point3 {
    const u1 = p2.x - p1.x;
    const u2 = p2.y - p1.y;
    const u3 = p2.z - p1.z;

    const v1 = p3.x - p1.x;
    const v2 = p3.y - p1.y;
    const v3 = p3.z - p1.z;

    return new Point3(
        u2 * v3 - u3 * v2,
        u3 * v1 - u1 * v3,
        u1 * v2 - u2 * v1
    );
}

// o plano é o formado pelos pontos p1, p2 e p3 - o ponto em questão é o p
export function distanceFromPlane(p1: Point3, p2: Point3, p3: Point3, p: Point3): number {
    const normal = crossProduct(p1, p2, p3);
    const d = -normal.x * p1.x - normal.y * p1.y - normal.z * p1.z;
    return Math.abs(normal.x * p.x + normal.y * p.y + normal.z * p.z + d) /
           Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
}

// QuickHull foi implementado para encontrar os pontos mais distantes
export function quickHull(points: Point3[]): Point3[] {
    if (points.length < 4) {
        throw new Error("A convex hull cannot be formed with fewer than 4 points.");
    }

    let minXPoint = points[0];
    let maxXPoint = points[0];

    points.forEach(p => {
        if (p.x < minXPoint.x) minXPoint = p;
        if (p.x > maxXPoint.x) maxXPoint = p;
    });

    const initialHull: Point3[] = [minXPoint, maxXPoint];

    const leftSet : Point3[] = [];
    const rightSet : Point3[] = [];

    points.forEach(p => {
        const cp = crossProduct(minXPoint, maxXPoint, p);
        if (cp.z > 0) {
            leftSet.push(p);
        } else if (cp.z < 0) {
            rightSet.push(p);
        }
    });

    function addHullPoints(points: Point3[], p1: Point3, p2: Point3): void {
        if (points.length === 0) return;

        let furthestPoint = points[0];
        let maxDistance = -Infinity;

        points.forEach(p => {
            const distance = distanceFromPlane(p1, p2, furthestPoint, p);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestPoint = p;
            }
        });

        initialHull.push(furthestPoint);

        const points1 : Point3[] = [];
        const points2 : Point3[] = [];

        points.forEach(p => {
            const cp1 = crossProduct(p1, furthestPoint, p);
            const cp2 = crossProduct(furthestPoint, p2, p);

            if (cp1.z > 0) points1.push(p);
            if (cp2.z > 0) points2.push(p);
        });

        addHullPoints(points1, p1, furthestPoint);
        addHullPoints(points2, furthestPoint, p2);
    }

    addHullPoints(leftSet, minXPoint, maxXPoint);
    addHullPoints(rightSet, maxXPoint, minXPoint);

    return initialHull;
}

export function findFarthestPoints(points: Point3[]): [ Point3, Point3 ] {

    if (points.length < 2) {
        throw new Error("At least two points are required to calculate the farthest points.");
    }

    let maxDistance = -Infinity;

    let point1: Point3|null = null;
    let point2: Point3|null = null;

    if (points.length === 2) {
        point1 = points[0];
        point2 = points[1];
    } else /* 3 points or more */ {

        if(points.length > 3) {
            points = quickHull(points);
        }

        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const distance = points[i].distanceTo(points[j]);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    point1 = points[i];
                    point2 = points[j];
                }
            }
        }

    }

    if(point1 === null || point2 === null) {
        throw new Error("Impossible to calculate farthest point");
    }

    return [ point1, point2 ];
}

export function arePointsCollinear(points: Point3[]): boolean {
    if (points.length < 3) return true; // Any two points are always collinear

    const baseVector = points[1].sub(points[0]);

    for (let i = 2; i < points.length; i++) {
        const currentVector = points[i].sub(points[0]);
        const crossProduct = baseVector.cross(currentVector);

        if (!Point3.fromVector3(crossProduct).isZero()) {
            return false; // Found a non-zero cross product, points are not collinear
        }
    }

    return true; // All cross products are zero, points are collinear
}

export function arePointsCoplanar(points: Point3[]): boolean {
    if (points.length < 4) return true; // Any three points are always coplanar

    const baseVector1 = points[1].sub(points[0]);
    const baseVector2 = points[2].sub(points[0]);
    const normal = baseVector1.cross(baseVector2);

    for (let i = 3; i < points.length; i++) {
        const currentVector = points[i].sub(points[0]);
        const dotProduct = normal.dot(currentVector);

        if (dotProduct !== 0) {
            return false; // Found a non-zero dot product, points are not coplanar
        }
    }

    return true; // All dot products are zero, points are coplanar
}

export function findExtremePoints(points: Point3[]): [Point3, Point3] {
    if (points.length < 2) {
        throw new Error("At least two points are required to find extreme points.");
    }

    // Choose a direction vector using the first two points
    const direction = points[1].sub(points[0]);

    let minProjection = Infinity;
    let maxProjection = -Infinity;
    let minPoint = points[0];
    let maxPoint = points[0];

    for (let i = 0; i < points.length; i++) {
        // Project point onto the direction vector
        const projection = points[i].dot(Point3.fromVector3(direction));

        // Update min and max projections
        if (projection < minProjection) {
            minProjection = projection;
            minPoint = points[i];
        }
        if (projection > maxProjection) {
            maxProjection = projection;
            maxPoint = points[i];
        }
    }

    return [ minPoint, maxPoint ];
}