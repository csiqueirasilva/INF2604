import { addVectors, CollinearOrderingCase, crossProduct, distanceBetweenPoints, dotProduct, ordering2D, orientation1D, orientation2D, orientation3D, OrientationCase, reflectVector, reverseVector, rotateVector, scaleVector, subVectors, vectorLength, vectorSameDirection } from "@geometry/affine";
import { calculatePlaneNormal, normalizeVector } from "@geometry/euler";
import { invertMatrix3x3 } from "@geometry/math";
import { Point3, TOLERANCE_EPSILON } from "@geometry/points";
import { createDebugArrow, createDebugArrowSegments, createDebugHighlightPoint, createDebugLine, createDebugSphere, createDebugText } from "@helpers/3DElements/Debug/debugVisualElements";
import { BufferGeometry, Color, Object3D, Vector3 } from "three";
import { ConvexHull3D, Face } from "@geometry/quickhull3d";
import { normalize } from "three/src/math/MathUtils";
import { VECTOR3_ZERO } from "@helpers/ThreeUtils";
import { isLoaded } from "expo-font";
import { ClearDebugObject, ClearDebugObjects, PushDebugObject, PushDebugObjects } from "@helpers/3DElements/Debug/DebugHelperExports";

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
    radius: number
    furtherstPoint: Point3
    center: Point3
}

export interface PolarReference {
    origin: Point3
    radius: number
}

export function boundingSphereInCloud(points: Point3[], name = "BoundingSphere"): PolarReference {

    const dtStart = (new Date()).getTime();

    ClearDebugObject(name);

    if (points.length === 0) {
        throw new Error("Point cloud is empty.");
    }

    let maxDistance = -Infinity;
    let farthestPoint: Point3 = points[0];
    let farthestPoint2: Point3 = points[0];

    for (const point of points) {
        const distance = distanceBetweenPoints(points[0], point);
        if (distance > maxDistance) {
            maxDistance = distance;
            farthestPoint = point;
        }
    }

    maxDistance = -Infinity;

    for (const point of points) {
        const distance = distanceBetweenPoints(farthestPoint, point);
        if (distance > maxDistance) {
            maxDistance = distance;
            farthestPoint2 = point;
        }
    }

    let center = farthestPoint.medianPointTo(farthestPoint2);
    let radius = maxDistance / 2;

    PushDebugObjects(name,
        createDebugLine([center, farthestPoint], VECTOR3_ZERO, "black"),
        createDebugLine([center, farthestPoint2], VECTOR3_ZERO, "black"),
        createDebugText("Pontos mais distantes", farthestPoint.medianPointTo(farthestPoint2).toVector3()),
        createDebugSphere(center, radius)
    );

    for (const point of points) {
        const dirVector = point.sub(center);
        const normalizedDirVector = normalizeVector(dirVector);
        const radiusVector = scaleVector(normalizedDirVector, radius);
        const shouldAdjust = vectorLength(dirVector) > radius;

        if (shouldAdjust) {
            const differenceVector = subVectors(radiusVector, dirVector);
            const excessDistance = vectorLength(differenceVector);
            const newCenter = center.sub(Point3.fromVector3(differenceVector));

            let debugElements: any[] = [];

            debugElements.push(
                createDebugSphere(center, radius),
                createDebugArrow(center, dirVector.add(center), "red"),
                createDebugArrow(center, normalizedDirVector.add(center), "blue"),
                createDebugArrow(center, radiusVector.add(center), "green"),
                createDebugArrow(center, newCenter, "yellow")
            );

            radius += excessDistance / 2;
            center = Point3.fromVector3(newCenter);

            PushDebugObjects(name,
                ...debugElements
            );
        }

    }

    const dtFinish = (new Date()).getTime();

    PushDebugObject(name, createDebugText(`${name}: r ${radius.toFixed(2)}; c ${center.toString()}; ${(dtFinish - dtStart)}ms`, new Vector3(0, -6, 0)));

    return {
        origin: center,
        radius: radius
    };
}

// isso não faz sentido semanticamente, mas é uma função helper - os pontos são tratados como vetores
function helperPointsCrossProduct(p1: Point3, p2: Point3, p3: Point3): Point3 {
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
    const normal = helperPointsCrossProduct(p1, p2, p3);
    const d = -normal.x * p1.x - normal.y * p1.y - normal.z * p1.z;
    return Math.abs(normal.x * p.x + normal.y * p.y + normal.z * p.z + d) /
        Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
}

export function distanceFromLine(point: Point3, a: Point3, b: Point3): number {
    const A = b.y - a.y;
    const B = a.x - b.x;
    const C = b.x * a.y - a.x * b.y;
    return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
}

// src: https://lexrent.eu/wp-content/uploads/torza/artikel_groep_sub_2_docs/BYZ_3_Polygon-Area-and-Centroid.pdf
// paul boorke
export function calculateCentroidZeroZ(vertices: Point3[]): Point3 {
    let centroidX = 0;
    let centroidY = 0;
    let signedArea = 0;
  
    const n = vertices.length;
    
    for (let i = 0; i < n; i++) {
      const x0 = vertices[i].x;
      const y0 = vertices[i].y;
      const x1 = vertices[(i + 1) % n].x;
      const y1 = vertices[(i + 1) % n].y;
  
      const cross = (x0 * y1) - (x1 * y0);
      signedArea += cross;
      centroidX += (x0 + x1) * cross;
      centroidY += (y0 + y1) * cross;
    }

    signedArea *= 0.5;
    centroidX /= 6 * signedArea;
    centroidY /= 6 * signedArea;
  
    return new Point3(centroidX, centroidY, 0);
}

export function centroidFromPoints(...points: Point3[]): Point3 {
    const centroid = new Point3(0, 0, 0);

    points.forEach((point) => {
        centroid.x += point.x;
        centroid.y += point.y;
        centroid.z += point.z;
    });

    const numberOfPoints = points.length;
    if (numberOfPoints > 0) {
        centroid.x /= numberOfPoints;
        centroid.y /= numberOfPoints;
        centroid.z /= numberOfPoints;
    }

    return centroid;
}

export function distinctPoints(points: Point3[]): Point3[] {
    const result: Point3[] = [];

    for (const point of points) {
        if (!result.some(p => p.x === point.x && p.y === point.y && p.z === point.z)) {
            result.push(point);
        }
    }

    return result;
}

export function sortConvexPointsCCW(points: Point3[]): Point3[] {
    let ret : Point3[] = [];

    if(points.length > 0 && arePointsCoplanar(points)) {

        const centroid = centroidFromPoints(...points);

        ret = points.slice().sort((a, b) => {
            const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
            const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
            let cmp = angleB - angleA;
            return cmp;
        });
        
    }

    return ret;
}

export function isNoPointInsideTriangle(points: Point3[], a: Point3, b: Point3, c: Point3): boolean {
    let ret = true;
    for (let i = 0; ret && i < points.length; i++) {
        const point = points[i];
        if (point === a || point === b || point === c) {
            continue;
        }
        if (isPointInsideTriangle(point, a, b, c)) {
            ret = false;
        }
    }
    return ret;
}

export function isPointInsideTriangle(p: Point3, a: Point3, b: Point3, c: Point3): boolean {
    const o1 = orientation2D(a, b, p);
    const o2 = orientation2D(b, c, p);
    const o3 = orientation2D(c, a, p);
    return (o1 === o2) && (o2 === o3);
}

function addHullPoints(name: string, initialHull: Point3[], points: Point3[], p1: Point3, p2: Point3): void {
    if (points.length === 0) return;

    let farthestPoint = points[0];
    let maxDistance = -Infinity;

    points.forEach(p => {
        const distance = distanceFromLine(p, p1, p2);
        if (distance > maxDistance) {
            maxDistance = distance;
            farthestPoint = p;
        }
    });

    const idx1 = initialHull.indexOf(p1);
    const idx2 = initialHull.indexOf(p2);

    const minPos = Math.min(idx1, idx2);
    const maxPos = Math.max(idx1, idx2);

    if (minPos === 0 && maxPos === initialHull.length - 1) {
        initialHull.splice(0, 0, farthestPoint);
    } else {
        initialHull.splice(minPos + 1, 0, farthestPoint);
    }

    const midPoint = p2.medianPointTo(p1);

    const filteredPoints = points.filter(x => !isPointInsideTriangle(x, p1, p2, farthestPoint));

    let m1 = farthestPoint;
    let m2 = midPoint;

    const { leftSet, rightSet } = quickHullSplitPoints2d(filteredPoints, m2, m1);

    let a = p1;
    let b = farthestPoint;
    let c = p2;

    const midPointL = a.medianPointTo(farthestPoint);
    const midPointR = farthestPoint.medianPointTo(c);
    const leftLines = leftSet.map(x => createDebugLine([midPointL, x], VECTOR3_ZERO, "green", "orange", 1, 0.1));
    const rightLines = rightSet.map(x => createDebugLine([midPointR, x], VECTOR3_ZERO, "green", "violet", 1, 0.1));

    PushDebugObjects(
        name,
        createDebugLine([p1, p2], VECTOR3_ZERO, "pink", "pink", 2, 0.2),
        createDebugLine([p1, farthestPoint], VECTOR3_ZERO, "pink", "pink", 2, 0.2),
        createDebugLine([p2, farthestPoint], VECTOR3_ZERO, "pink", "pink", 2, 0.2),
        createDebugLine(initialHull),
        createDebugText(`p2 - ${a === p2 ? 'A' : 'C'}`, p2.toVector3()),
        createDebugText(`p1 - ${a === p1 ? 'A' : 'C'}`, p1.toVector3()),
        createDebugText(`F`, farthestPoint.toVector3()),
        createDebugLine([midPoint, farthestPoint], VECTOR3_ZERO, "green", "green", 1),
        ...leftLines,
        ...rightLines
    );

    addHullPoints(name, initialHull, leftSet, a, b);
    addHullPoints(name, initialHull, rightSet, b, c);
}

function quickHullSplitPoints2d(points: Point3[], a: Point3, b: Point3) {
    const leftSet: Point3[] = [];
    const rightSet: Point3[] = [];

    points.forEach(p => {
        const orientationAB = orientation2D(a, b, p);
        if (orientationAB === OrientationCase.COUNTER_CLOCK_WISE) {
            leftSet.push(p);
        } else if (orientationAB === OrientationCase.CLOCK_WISE) {
            rightSet.push(p);
        } /* ignore collinear here */
    });

    return { leftSet, rightSet };
}

const DEBUG_QUICKHULL_COLLINEAR = false;

function quickHull2dSolveCollinear(points: Point3[], hullPoints: Point3[]): void {
    for (let j = 0; j < points.length; j++) {
        const point = points[j];
        const notIncluded = hullPoints.indexOf(point) === -1;
        if (notIncluded) {
            for (let i = 1; i < hullPoints.length; i++) {
                const p1 = hullPoints[i - 1];
                let p2 = hullPoints[i];
                for (let k = i + 1;
                    k < hullPoints.length
                    ; k++) {
                    if (vectorLength(p1.sub(p2)) <= TOLERANCE_EPSILON) {
                        continue; /* if points are at same position keep checking */
                    }
                    const check = ordering2D(p2, hullPoints[k], point);
                    if (check === CollinearOrderingCase.AFTER) {
                        p2 = hullPoints[k];
                        i = k;
                    } else {
                        break;
                    }
                }
                const ordering2d = ordering2D(p1, p2, point);
                if (DEBUG_QUICKHULL_COLLINEAR) {
                    PushDebugObjects(
                        `QuickHull`,
                        ...createDebugArrowSegments(hullPoints),
                        createDebugHighlightPoint(p1, "green"),
                        createDebugHighlightPoint(p2, "blue"),
                        createDebugHighlightPoint(point, "red"),
                        createDebugText(`segment_dist=${vectorLength(p1.sub(p2))}; p1=${p1.toString()}; p2=${p2.toString()}; point=${point.toString()}; order=${ordering2d}`, new Vector3(0, 8, 0))
                    );
                }
                if (ordering2d !== CollinearOrderingCase.NOT_COLINEAR) {
                    let posInsert = ordering2d === CollinearOrderingCase.BEFORE ?
                        i - 1 : (ordering2d === CollinearOrderingCase.AFTER ? i + 1 : i);
                    if (posInsert <= 0) {
                        posInsert = hullPoints.length;
                    }
                    hullPoints.splice(posInsert, 0, point); // Insert the point between p1 and p2
                    if (DEBUG_QUICKHULL_COLLINEAR) {
                        PushDebugObjects(`QuickHull`, ...createDebugArrowSegments(hullPoints));
                    }
                    break;
                }
            }
        }
    }
}

function quickHull2d(name: string, points: Point3[]): Point3[] {

    let minXPoint = points[0];
    let maxXPoint = points[0];

    // Find the points with minimum and maximum x coordinates, as these will always be part of the convex hull. If many points with the same minimum/maximum x exist, use the ones with the minimum/maximum y, respectively.
    // todo: if many points have same x, use y
    points.forEach(p => {
        if (p.x < minXPoint.x) minXPoint = p;
        if (p.x > maxXPoint.x) maxXPoint = p;
    });

    const initialHull: Point3[] = [minXPoint, maxXPoint];

    // Use the line formed by the two points to divide the set into two subsets of points, which will be processed recursively. We next describe how to determine the part of the hull above the line; the part of the hull below the line can be determined similarly.
    // build 2 subsets
    const { leftSet, rightSet } = quickHullSplitPoints2d(points, minXPoint, maxXPoint);

    PushDebugObjects(
        name,
        createDebugLine(initialHull),
        createDebugText("minXPoint", minXPoint.toVector3()),
        createDebugText("maxXPoint", maxXPoint.toVector3())
    );

    addHullPoints(name, initialHull, leftSet, minXPoint, maxXPoint);
    addHullPoints(name, initialHull, rightSet, maxXPoint, minXPoint);

    return initialHull;
}

function quickHull3d(points: Point3[]): Point3[] {
    let ch = new ConvexHull3D();
    ch.setFromPoints(points.map(x => x.toVector3()));
    ch.compute();
    function extractOrderedPointsFromFace(face: Face): Vector3[] {
        const orderedPoints: Vector3[] = [];

        let edge = face.edge; // Start at the first edge
        do {
            const vertex = edge.tail().point; // Assuming tail() gives us the vertex at the tail
            orderedPoints.push(new Vector3(vertex.x, vertex.y, vertex.z));
            edge = edge.next; // Move to the next edge
        } while (edge !== face.edge); // Stop when we've looped back to the starting edge

        return orderedPoints;
    }
    const ret = ch.faces.flatMap(f => extractOrderedPointsFromFace(f).map(v => Point3.fromVector3(v)));
    return ret;
}

// QuickHull foi implementado para encontrar os pontos mais distantes
export function quickHull(points: Point3[], name: string = "QuickHull"): Point3[] {

    let ret: Point3[] = [];

    ClearDebugObject(name);

    const dtStart = (new Date()).getTime();
    const coplanarCase = arePointsCoplanar(points);

    if (coplanarCase) {
        if (points.length >= 3) {
            // quickhull 2d
            const [rotatedPoints, rotationMatrix] = rotatePointsToZPlane(points);
            const hulledPoints = quickHull2d(name, rotatedPoints);
            // added step to check for collinear cases and solve them accordingly
            // O(n * h)
            quickHull2dSolveCollinear(rotatedPoints, hulledPoints);
            hulledPoints.push(hulledPoints[0]); // close loop
            PushDebugObjects(
                name,
                createDebugLine(hulledPoints)
            );
            ret = rotatePointsReverseRotation(hulledPoints, rotationMatrix);
        }
    } else {
        // quickhull 3d
        ret = quickHull3d(points);
    }

    const dtFinish = (new Date()).getTime();

    if (coplanarCase) {
        PushDebugObjects(name,
            createDebugText(`${name}: ${ret.length - 1} pontos; ${(dtFinish - dtStart)}ms`, new Vector3(0, 6, 0)),
            ...createDebugArrowSegments(ret)
        );
    }

    return ret;
}

export function findFarthestPoints(points: Point3[]): [Point3, Point3] {

    if (points.length < 2) {
        throw new Error("At least two points are required to calculate the farthest points.");
    }

    let maxDistance = -Infinity;

    let point1: Point3 | null = null;
    let point2: Point3 | null = null;

    if (points.length === 2) {
        point1 = points[0];
        point2 = points[1];
    } else /* 3 points or more */ {

        if (points.length > 3) {
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

    if (point1 === null || point2 === null) {
        throw new Error("Impossible to calculate farthest point");
    }

    return [point1, point2];
}

export function arePointsCollinear(points: Point3[]): boolean {
    if (points.length < 3) return true; // Any two points are always collinear

    let baseVector: Vector3 | null = null;

    // Find the first non-zero baseVector by iterating through the points
    for (let i = 1; i < points.length; i++) {
        baseVector = points[i].sub(points[0]);
        if (baseVector.length() > TOLERANCE_EPSILON) {
            break; // Found a valid base vector
        }
    }

    // If we don't find a valid baseVector, it means all points are the same
    if (!baseVector || baseVector.length() <= TOLERANCE_EPSILON) {
        return true; // All points are coincident, trivially collinear
    }

    // Now check the rest of the points using the found baseVector
    for (let i = 2; i < points.length; i++) {
        const currentVector = points[i].sub(points[0]);
        const crossProductInt = crossProduct(baseVector, currentVector);
        // Check if the cross product is close to zero (meaning points are collinear)
        if (crossProductInt.length() > TOLERANCE_EPSILON) {
            return false; // Found a non-zero cross product, points are not collinear
        }
    }

    return true; // All cross products are zero, points are collinear
}

export function rotatePointsReverseRotation(points: Point3[], rotationMatrix: number[][]): Point3[] {
    const ret: Point3[] = [];

    // Invert the rotation matrix
    const inverseMatrix = invertMatrix3x3(rotationMatrix);

    // Apply the inverse matrix to each point
    for (const point of points) {
        const rotatedPoint = applyRotationMatrix(point.toVector3(), inverseMatrix);
        ret.push(Point3.fromVector3(rotatedPoint));
    }

    return ret;
}

export function applyRotationMatrix(vector: Vector3, rotationMatrix: number[][]): Vector3 {
    const newX = rotationMatrix[0][0] * vector.x + rotationMatrix[0][1] * vector.y + rotationMatrix[0][2] * vector.z;
    const newY = rotationMatrix[1][0] * vector.x + rotationMatrix[1][1] * vector.y + rotationMatrix[1][2] * vector.z;
    const newZ = rotationMatrix[2][0] * vector.x + rotationMatrix[2][1] * vector.y + rotationMatrix[2][2] * vector.z;

    return new Vector3(newX, newY, newZ);
}

export function calculateRotationMatrix(normal: Vector3, inputAxis: Vector3 = new Vector3(0, 0, 1)): number[][] {
    const normalizedNormal = normalizeVector(normal);
    inputAxis = normalizeVector(inputAxis);
    const axis = normalizeVector(crossProduct(normalizedNormal, inputAxis));

    if (normalizedNormal.equals(inputAxis) || vectorLength(axis) === 0) {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    const angle = Math.acos(normalizedNormal.dot(inputAxis));

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const oneMinusCosA = 1 - cosA;

    const ux = axis.x, uy = axis.y, uz = axis.z;

    const rotationMatrix = [
        [
            cosA + ux * ux * oneMinusCosA,
            ux * uy * oneMinusCosA - uz * sinA,
            ux * uz * oneMinusCosA + uy * sinA
        ],
        [
            uy * ux * oneMinusCosA + uz * sinA,
            cosA + uy * uy * oneMinusCosA,
            uy * uz * oneMinusCosA - ux * sinA
        ],
        [
            uz * ux * oneMinusCosA - uy * sinA,
            uz * uy * oneMinusCosA + ux * sinA,
            cosA + uz * uz * oneMinusCosA
        ]
    ];

    return rotationMatrix;
}

export function rotatePointsToZPlane(points: Point3[]): [Point3[], number[][]] {
    const ret: Point3[] = [];

    const normal = calculatePlaneNormal(points[0], points[1], points[2]);

    const rotationMatrix = calculateRotationMatrix(normal, new Vector3(0, 0, 1));

    for (const point of points) {
        const rotatedPoint = Point3.fromVector3(applyRotationMatrix(point.toVector3(), rotationMatrix));
        ret.push(rotatedPoint);
    }

    return [ret, rotationMatrix];
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

    return [minPoint, maxPoint];
}