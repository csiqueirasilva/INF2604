import { addVectors, Point3, scaleVector, subVectors, vectorLength } from "@geometry/affine";
import { distanceBetweenPoints, normalizeVector } from "@geometry/euler";
import { BufferGeometry, Vector3 } from "three";

export function findFarthestPoints(points: Point3[]): Point3[] {
    const n = points.length;

    // Base case: when the set is small enough, use brute force
    if (n <= 3) {
        return bruteForceFarthestPair(points);
    }

    // Divide the set into two halves
    const mid = Math.floor(n / 2);
    const left = points.slice(0, mid);
    const right = points.slice(mid);

    // Recursively find the closest pair in each half
    const farthestLeft = findFarthestPoints(left);
    const farthestRight = findFarthestPoints(right);

    // Determine the smaller distance between the two halves
    let minPair = farthestLeft;
    let maxDist = distanceBetweenPoints(farthestLeft[0], farthestLeft[1]);

    const rightDist = distanceBetweenPoints(farthestRight[0], farthestRight[1]);
    if (rightDist > maxDist) {
        maxDist = rightDist;
        minPair = farthestRight;
    }

    // Merge step: check points near the dividing line
    const strip = points.filter(point => Math.abs(point.x - points[mid].x) > maxDist);
    const stripClosest = findFarthestInStrip(strip, maxDist);

    if (stripClosest) {
        minPair = stripClosest;
    }

    return minPair;
}

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

export function minimumSphereInCloud(points: Point3[]): PolarReference {
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