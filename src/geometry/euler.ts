import { dotProduct, scaleVector, subVectors, vector2dLength as vectorLength2d, vectorLength, orientation2D, orientation3D, crossProduct } from "@geometry/affine";
import { clamp, det4x4 } from "@geometry/math";
import { Point3 } from "@geometry/points";
import { useThree } from "@react-three/fiber";
import { Vector2, Vector3 } from "three";

export function normalizeVector(v: Vector3): Vector3 {
    const length = vectorLength(v);
    let ret = new Vector3(0, 0, 0);
    if(length !== 0) {
        ret = scaleVector(v, 1 / length);
    }
    return ret;
}

export function checkIfVectorsOrthogonal(v1: Vector3, v2: Vector3): boolean {
    return dotProduct(v1, v2) === 0;
}

export function errorIfZeroLength2d(v: Vector2, msg: string = "Operação ilegal para vetor de tamanho 0"): void {
    const lengthV = vectorLength2d(v);
    if (lengthV === 0) {
        throw new Error(msg);
    }
}

export function errorIfZeroLength(v: Vector3, msg: string = "Operação ilegal para vetor de tamanho 0"): void {
    const lengthV = vectorLength(v);
    if (lengthV === 0) {
        throw new Error(msg);
    }
}

export function projectVector(u: Vector3, v: Vector3): Vector3 {
    errorIfZeroLength(v);
    const unitV = normalizeVector(v);
    const dot = dotProduct(u, unitV);
    return scaleVector(unitV, dot);
}

export function findPerpendicularComponent(u: Vector3, v: Vector3): Vector3 {
    const u1 = projectVector(u, v);
    const u2 = subVectors(u, u1);
    return u2;
}

export function angleBetweenVectors(u: Vector3, v: Vector3): number {
    errorIfZeroLength(u);
    errorIfZeroLength(v);
    const dot = dotProduct(u, v);
    const magnitudeU = vectorLength(u);
    const magnitudeV = vectorLength(v);
    const cosTheta = dot / (magnitudeU * magnitudeV);
    // limitar a [ -1, 1 ] para melhorar a precisao numerica
    const clampedCosTheta = clamp(cosTheta, -1, 1);
    return Math.acos(clampedCosTheta);
}

export function pseudoAngleBetweenVectors(u: Vector3, v: Vector3): number {
    errorIfZeroLength(u);
    errorIfZeroLength(v);
    const unitU = normalizeVector(u);
    const unitV = normalizeVector(v);
    const dot = dotProduct(unitU, unitV);
    let ret = clamp(1 - dot, 0, 2); // apenas para melhorar a precisao numerica
    return ret;
}

// exercicio slide primeira aula
export function pseudoAngleAsSquarePerimeter(u: Vector2): number {
    // desconsiderar validacoes
    errorIfZeroLength2d(u);
    let acc = 0; // inicializacao apenas para usar o clamp corretamente
    // as comparacoes estao dispostas para ser ccw
    // foram adicionadas mais algumas somas para ficar mais próximo do enunciado do pseudoangulo fazer a imagem [0,8)
    if (u.y >= 0) {
        if (u.x >= 0) {
            acc = 2 * (u.y / (u.x + u.y));
        } else {
            acc = 2 + (2 * (-u.x / (u.y - u.x)));
        }
    } else {
        if (u.x <= 0) {
            acc = 4 + (2 * (-u.y / (-u.y - u.x)));
        } else {
            acc = 6 + (2 * (-u.x / (-u.x + u.y)));
        }
    }
    // desconsiderar clamp para melhorar precisao numerica
    let ret = clamp(acc, 0, 8); // apenas para melhorar a precisao numerica
    return ret;
}

export function fastCalcAreaTriangle2d(p: Point3, q: Point3, r: Point3): number {
    const orient = orientation2D(p, q, r);
    return orient / 2;
}

export function fastCalcAreaTriangle3d(p: Point3, q: Point3, r: Point3, t: Point3): number {
    const orient = orientation3D(p, q, r, t);
    return orient / 6; // 6 = d!
}

export function fastAnglePqr(p: Point3, q: Point3, r: Point3): number {
    const orient = orientation2D(p, q, r);
    const lenPQ = vectorLength(p.sub(q));
    const lenRQ = vectorLength(r.sub(q));
    const dot = lenPQ * lenRQ;
    const ret = Math.asin(orient / dot);
    return ret;
}

export function angleBetweenVectorsCross(u: Vector3, v: Vector3): number {
    const normalizedU = normalizeVector(u);
    const normalizedV = normalizeVector(v);
    const cross = crossProduct(normalizedU, normalizedV);
    const lengthCross = vectorLength(cross);
    const ret = Math.asin(lengthCross);
    return ret;
}

export interface Base3 {
    u: Vector3;
    v: Vector3;
    w: Vector3;
}

export function findOrthonormalBase(n: Vector3): Base3 {
    const w = normalizeVector(n);
    let v = crossProduct(w, new Vector3(1, 0, 0));
    // se w era paralelo com o eixo x, usamos o eixo y
    if (vectorLength(v) === 0) {
        v = crossProduct(w, new Vector3(0, 1, 0));
    }
    v = normalizeVector(v);
    const u = normalizeVector(crossProduct(v, w));
    const ret: Base3 = {
        u, v, w
    };
    return ret;
}

export function calculatePlaneNormal(p1: Point3, p2: Point3, p3: Point3): Vector3 {
    const v1 = p2.sub(p1);
    const v2 = p3.sub(p1);
    return normalizeVector(crossProduct(v1, v2));
}

export function errorIfPointsColinear3(p1: Point3, p2: Point3, p3: Point3): void {
    const a = p1.sub(p2);
    const b = p3.sub(p2);
    const cross = crossProduct(a, b);
    errorIfZeroLength(cross, `Operação ilegal: pontos colinerares; (${p1}; ${p2}; ${p3})`);
}

export function errorIfPointsColinear4(p1: Point3, p2: Point3, p3: Point3, p4: Point3): void {
    const matrixA = [
        [p1.x, p1.y, p1.z, 1],
        [p2.x, p2.y, p2.z, 1],
        [p3.x, p3.y, p3.z, 1],
        [p4.x, p4.y, p4.z, 1],
    ];
    const A = det4x4(matrixA);
    if(A === 0) {
        throw new Error(`Operação ilegal: pontos colinerares; (${p1}; ${p2}; ${p3}; ${p4})`);        
    }
}

// exercício
export function baricentricCoordsAtVectorField(v1: Point3, v2: Point3, v3: Point3): Point3 {
    // λ1 * v1 + λ2 * v2 + λ3 * v3 = 0
    // λ1 + λ2 + λ3 = 1
    // reescrevendo
    // λ1 * (v1 - v3) + λ2 * (v2 - v3) = v3

    const a = {
        x: v1.x - v3.x,
        y: v1.y - v3.y,
        z: v1.z - v3.z,
    };
    const b = {
        x: v2.x - v3.x,
        y: v2.y - v3.y,
        z: v2.z - v3.z,
    };
    const c = {
        x: v3.x,
        y: v3.y,
        z: v3.z,
    };

    const denominator = a.x * b.y - a.y * b.x;

    const lambda1 = (b.y * c.x - b.x * c.y) / denominator;
    const lambda2 = (-a.y * c.x + a.x * c.y) / denominator;
    const lambda3 = 1 - lambda1 - lambda2;

    const ret = new Point3(lambda1, lambda2, lambda3);

    return ret;
}