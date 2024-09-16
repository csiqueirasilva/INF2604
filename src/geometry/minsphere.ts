import { addVectors, crossProduct, distanceBetweenPoints, dotProduct, scaleVector, vectorLength } from "@geometry/affine";
import { errorIfPointsColinear3, errorIfPointsColinear4 } from "@geometry/euler";
import { det4x4 } from "@geometry/math";
import { Point3, TOLERANCE_EPSILON } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, findExtremePoints, findFarthestPoints, PolarReference } from "@geometry/topology";
import { ClearDebugObject, PushDebugObject, PushDebugObjects } from "@helpers/3DElements/Debug/DebugHelperExports";
import { createDebugSphere, createDebugText } from "@helpers/3DElements/Debug/debugVisualElements";
import { shuffleArray } from "@helpers/arrays";
import * as THREE from 'three';

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
        throw new Error("Pontos colineares ou coplanares. Não existe esfera única.");
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

export function minSphere(points: Point3[], name : string = "MinSphere"): PolarReference {
    if (points.length < 2) {
        throw new Error("Não podemos calcular a esfera mínima sem ao menos dois pontos.");
    }

    ClearDebugObject(name);

    const dtStart = (new Date()).getTime();

    let c: PolarReference;

    const collinearCheck = arePointsCollinear(points);

    PushDebugObjects(name, 
        createDebugText(`${collinearCheck ? "Pontos colineares" : "Pontos não colineares"}`)
    );

    // Check if all points are collinear
    if (collinearCheck) {
        // Find the two extreme points (farthest apart)
        let extremePoints = findExtremePoints(points);
        // Calculate the sphere as the diameter of these points
        c = calcDiameter(extremePoints[0], extremePoints[1]);
        PushDebugObjects(name, 
            createDebugSphere(c.origin, c.radius)
        );
    } else {
        // Check if all points are coplanar
        const coplanar = arePointsCoplanar(points);
        // If points are neither collinear nor coplanar, proceed with 3D sphere calculation
        let shuffled = shuffleArray(points);
        c = calcDiameter(shuffled[0], shuffled[1]);
        PushDebugObjects(name, 
            createDebugSphere(c.origin, c.radius)
        );
        for (let i = 2; i < shuffled.length; i++) {
            const p = shuffled[i];
            if (!isInSphere(c, p)) {
                c = calcCircleWithAPoint(coplanar, shuffled.slice(0, i), p, name);
            }
        }
    }

    const dtFinish = (new Date()).getTime();

    if (c === null) {
        throw new Error("Não conseguiu gerar esfera mínima.");
    }

    PushDebugObject(name, createDebugText(`${name}: r ${c.radius.toFixed(2)}; c ${c.origin.toString()}; ${(dtFinish - dtStart)}ms`, new THREE.Vector3(0, 6, 0)));

    return c;
}


function calcCircleWithAPoint(coplanar : boolean, points: Point3[], q: Point3, name : string): PolarReference {
    let c: PolarReference = calcDiameter(points[0], q);
    PushDebugObjects(name, 
        createDebugSphere(c.origin, c.radius)
    );
    for (let j = 1; j < points.length; j++) {
        const pj = points[j];
        if (!isInSphere(c, pj)) {
            c = calcCircleWithTwoPoints(coplanar, points.slice(0, j), pj, q, name);
        }
    }
    return c;
}

function calcCircleWithTwoPoints(coplanar : boolean, points: Point3[], q1: Point3, q2: Point3, name : string): PolarReference {
    let c: PolarReference = calcDiameter(q1, q2);
    PushDebugObjects(name, 
        createDebugSphere(c.origin, c.radius)
    );
    for (let k = 0; k < points.length; k++) {
        const pk = points[k];
        if (!isInSphere(c, pk)) {
            c = calcCircleWithThreePoints(coplanar, points.slice(0, k), pk, q1, q2, name);
        }
    }
    return c;
}

function calcCircleWithThreePoints(coplanar : boolean, points: Point3[], q1: Point3, q2: Point3, q3: Point3, name : string): PolarReference {
    let c: PolarReference = calcCircumcircle(q1, q2, q3);
    PushDebugObjects(name, 
        createDebugSphere(c.origin, c.radius)
    );
    if(!coplanar) {
        for (let l = 0; l < points.length; l++) {
            const pl = points[l];
            if (!isInSphere(c, pl)) {
                c = calcCircumsphere(pl, q1, q2, q3);
                PushDebugObjects(name, 
                    createDebugSphere(c.origin, c.radius)
                );
            }
        }
    }
    return c;
}