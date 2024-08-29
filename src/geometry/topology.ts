import { addVectors, Point3, scaleVector, subVectors, vectorLength } from "@geometry/affine";
import { distanceBetweenPoints, normalizeVector } from "@geometry/euler";
import { BufferGeometry, Vector3 } from "three";

function bruteForceFarthestPair(points: Point3[]): Point3[] {
    let maxDist = -Infinity;
    let maxPair: Point3[] = [];

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dist = distanceBetweenPoints(points[i], points[j]);
            if (dist > maxDist) {
                maxDist = dist;
                maxPair = [points[i], points[j]];
            }
        }
    }

    return maxPair;
}

function findFarthestInStrip(strip: Point3[], d: number): Point3[] | null {
    let maxDist = d;
    let maxPair: Point3[] | null = null;

    // Sort the strip by Y coordinate
    strip.sort((a, b) => a.y - b.y);

    for (let i = 0; i < strip.length; i++) {
        for (let j = i + 1; j < strip.length && (strip[j].y - strip[i].y) < maxDist; j++) {
            const dist = distanceBetweenPoints(strip[i], strip[j]);
            if (dist > maxDist) {
                maxDist = dist;
                maxPair = [strip[i], strip[j]];
            }
        }
    }

    return maxPair;
}

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
    debugSteps: PolarReferenceDebugStep[]
}

export function minimumSphereInCloudApproximation(points: Point3[]): PolarReference {
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

    const debugSteps: PolarReferenceDebugStep[] = [
        { center: center, furtherstPoint: furthestPoint, radius: radius }
    ];

    for (const point of points) {
        const vectorToCenter = point.sub(center);
        const distanceToPoint = vectorLength(vectorToCenter);
        const excessDistance = distanceToPoint - radius;

        if (excessDistance > 0) {
            const adjustment = scaleVector(normalizeVector(vectorToCenter), excessDistance / 2);
            center = Point3.fromVector3(addVectors(center.toVector3(), adjustment));
            radius += excessDistance / 2;
            debugSteps.push({ center: center, furtherstPoint: point, radius: radius });
        }
    }

    return {
        origin: center,
        radius: radius,
        debugSteps
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
    const hullPoints = quickHull(points);

    let maxDistance = -Infinity;

    let ret : Point3[] = [];

    let point1: Point3|null = null;
    let point2: Point3|null = null;

    for (let i = 0; i < hullPoints.length; i++) {
        for (let j = i + 1; j < hullPoints.length; j++) {
            const distance = hullPoints[i].distanceTo(hullPoints[j]);
            if (distance > maxDistance) {
                maxDistance = distance;
                point1 = hullPoints[i];
                point2 = hullPoints[j];
            }
        }
    }

    if(point1 === null || point2 === null) {
        throw new Error("Impossible to calculate farthest point");
    }

    return [ point1, point2 ];
}