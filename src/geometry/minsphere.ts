import { addVectors, crossProduct, distanceBetweenPoints, dotProduct, scaleVector, vectorLength } from "@geometry/affine";
import { errorIfPointsColinear3, errorIfPointsColinear4 } from "@geometry/euler";
import { det4x4 } from "@geometry/math";
import { Point3, TOLERANCE_EPSILON } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, findExtremePoints, findFarthestPoints, PolarReference } from "@geometry/topology";
import { shuffleArray } from "@helpers/arrays";

export function startSphere(p: Point3): PolarReference {
    let c: PolarReference = { origin: p.clone(), radius: 0 };
    return c;
}

export function isInSphere(c: PolarReference, p: Point3): boolean {
    const dist = distanceBetweenPoints(p, c.origin);
    return dist <= (c.radius + TOLERANCE_EPSILON);
}

export function calcDiameter(a: Point3, b: Point3): PolarReference {
    const cx: number = (a.x + b.x) / 2;
    const cy: number = (a.y + b.y) / 2;
    const cz: number = (a.z + b.z) / 2;
    const c = new Point3(cx, cy, cz);
    const radius: number = distanceBetweenPoints(c, a);
    return { origin: c, radius };
}

export function calcCircumcircle(p1: Point3, p2: Point3, p3: Point3): PolarReference {

    errorIfPointsColinear3(p1, p2, p3);

    const mid1 = new Point3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
    const mid2 = new Point3((p2.x + p3.x) / 2, (p2.y + p3.y) / 2, (p2.z + p3.z) / 2);

    const dir1 = p2.sub(p1);
    const dir2 = p3.sub(p2);

    const normal = crossProduct(dir1, dir2);

    const bisectorDir1 = crossProduct(dir1, normal);
    const bisectorDir2 = crossProduct(dir2, normal);

    const determinant = dotProduct(crossProduct(bisectorDir1, bisectorDir2), normal);

    const t = dotProduct(crossProduct(mid2.sub(mid1), bisectorDir2), normal) / determinant;

    const center = addVectors(mid1.toVector3(), scaleVector(bisectorDir1, t));
    const radius = center.distanceTo(p1);

    return { origin: Point3.fromVector3(center), radius };
}

// export function calcCircumsphere(p1: Point3, p2: Point3, p3: Point3, p4: Point3): PolarReference {

//     errorIfPointsColinear4(p1, p2, p3, p4);

//     // Helper function to calculate determinant of a 4x4 matrix

//     const matrixA = [
//         [p1.x, p1.y, p1.z, 1],
//         [p2.x, p2.y, p2.z, 1],
//         [p3.x, p3.y, p3.z, 1],
//         [p4.x, p4.y, p4.z, 1],
//     ];

//     const p1LenSquared = (p1.x * p1.x) + (p1.y * p1.y) + (p1.z * p1.z);
//     const p2LenSquared = (p2.x * p2.x) + (p2.y * p2.y) + (p2.z * p2.z);
//     const p3LenSquared = (p3.x * p3.x) + (p3.y * p3.y) + (p3.z * p3.z);
//     const p4LenSquared = (p4.x * p4.x) + (p4.y * p4.y) + (p4.z * p4.z);

//     const matrixDx = [
//         [p1LenSquared, p1.y, p1.z, 1],
//         [p2LenSquared, p2.y, p2.z, 1],
//         [p3LenSquared, p3.y, p3.z, 1],
//         [p4LenSquared, p4.y, p4.z, 1],
//     ];

//     const matrixDy = [
//         [p1LenSquared, p1.x, p1.z, 1],
//         [p2LenSquared, p2.x, p2.z, 1],
//         [p3LenSquared, p3.x, p3.z, 1],
//         [p4LenSquared, p4.x, p4.z, 1],
//     ];

//     const matrixDz = [
//         [p1LenSquared, p1.x, p1.y, 1],
//         [p2LenSquared, p2.x, p2.y, 1],
//         [p3LenSquared, p3.x, p3.y, 1],
//         [p4LenSquared, p4.x, p4.y, 1],
//     ];

//     const matrixC = [
//         [p1LenSquared, p1.x, p1.y, p1.z],
//         [p2LenSquared, p2.x, p2.y, p2.z],
//         [p3LenSquared, p3.x, p3.y, p3.z],
//         [p4LenSquared, p4.x, p4.y, p4.z],
//     ];

//     const A = det4x4(matrixA);
//     const Dx = det4x4(matrixDx);
//     const Dy = det4x4(matrixDy);
//     const Dz = det4x4(matrixDz);
//     const C = det4x4(matrixC);

//     const centerX = 0.5 * Dx / A;
//     const centerY = 0.5 * Dy / A;
//     const centerZ = 0.5 * Dz / A;
//     const radius = Math.sqrt(centerX * centerX + centerY * centerY + centerZ * centerZ - C / A);

//     return { origin: new Point3(centerX, centerY, centerZ), radius };
// }

import * as THREE from 'three';

export function calcCircumsphere(p1 :Point3, p2:Point3, p3:Point3, p4:Point3) : PolarReference {
    const a = new THREE.Vector3().copy(p1);
    const b = new THREE.Vector3().copy(p2);
    const c = new THREE.Vector3().copy(p3);
    const d = new THREE.Vector3().copy(p4);

    // Vector differences
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const ad = new THREE.Vector3().subVectors(d, a);

    // Calculate normal vectors
    const abXac = new THREE.Vector3().crossVectors(ab, ac);
    const abXad = new THREE.Vector3().crossVectors(ab, ad);
    const acXad = new THREE.Vector3().crossVectors(ac, ad);

    // Calculate the squared lengths
    const abSq = ab.lengthSq();
    const acSq = ac.lengthSq();
    const adSq = ad.lengthSq();

    // Calculate the determinant
    const det = ab.dot(acXad);
    if (det === 0) {
        throw new Error("The points are coplanar or collinear, no unique sphere exists.");
    }

    const center = new THREE.Vector3();
    center
        .addScaledVector(abXac, adSq)
        .addScaledVector(abXad, -acSq)
        .addScaledVector(acXad, abSq)
        .multiplyScalar(1 / (2 * det))
        .add(a);

    const radius = center.distanceTo(a);

    return { origin: Point3.fromVector3(center), radius };
}

export function minSphere(points: Point3[]): PolarReference {
    if (points.length < 2) {
        throw Error("Não podemos calcular a esfera mínima sem ao menos dois pontos.");
    }

    let c: PolarReference;

    // Check if all points are collinear
    if (arePointsCollinear(points)) {
        // Find the two extreme points (farthest apart)
        let extremePoints = findExtremePoints(points);
        // Calculate the sphere as the diameter of these points
        c = calcDiameter(extremePoints[0], extremePoints[1]);
    } else {
        // Check if all points are coplanar
        const coplanar = arePointsCoplanar(points);
        // If points are neither collinear nor coplanar, proceed with 3D sphere calculation
        let shuffled = shuffleArray(points);
        c = calcDiameter(shuffled[0], shuffled[1]);
        for (let i = 2; i < shuffled.length; i++) {
            const p = shuffled[i];
            if (!isInSphere(c, p)) {
                c = calcCircleWithAPoint(coplanar, shuffled.slice(0, i), p);
            }
        }
    }

    if (c === null) {
        throw Error("Não conseguiu gerar esfera mínima.");
    }

    if (c.radius > 10) {
        // console.log("Erro!");
        // console.log("calculado: ", c);
        // console.log("PONTOS:", points);
        // console.log("EMBARALHADO:", shuffled);
    }

    return c;
}


function calcCircleWithAPoint(coplanar : boolean, points: Point3[], q: Point3): PolarReference {
    let c: PolarReference = calcDiameter(points[0], q);
    for (let j = 1; j < points.length; j++) {
        const pj = points[j];
        if (!isInSphere(c, pj)) {
            c = calcCircleWithTwoPoints(coplanar, points.slice(0, j), pj, q);
        }
    }
    return c;
}

function calcCircleWithTwoPoints(coplanar : boolean, points: Point3[], q1: Point3, q2: Point3): PolarReference {
    let c: PolarReference = calcDiameter(q1, q2);
    for (let k = 0; k < points.length; k++) {
        const pk = points[k];
        if (!isInSphere(c, pk)) {
            c = calcCircleWithThreePoints(coplanar, points.slice(0, k), pk, q1, q2);
        }
    }
    return c;
}

function calcCircleWithThreePoints(coplanar : boolean, points: Point3[], q1: Point3, q2: Point3, q3: Point3): PolarReference {
    let c: PolarReference = calcCircumcircle(q1, q2, q3);
    if(!coplanar) {
        for (let l = 0; l < points.length; l++) {
            const pl = points[l];
            if (!isInSphere(c, pl)) {
                c = calcCircumsphere(pl, q1, q2, q3);
            }
        }
    }
    return c;
}