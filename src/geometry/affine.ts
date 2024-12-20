import { RADIAN } from "@geometry/constants";
import { normalizeVector } from "@geometry/euler";
import { Point3, TOLERANCE_EPSILON } from "@geometry/points";
import { arePointsCollinear } from "@geometry/topology";
import { useThree } from "@react-three/fiber";
import { Vector2, Vector3 } from "three";

// theta(1)
export function vectorSameDirection(v1 : Vector3, v2 : Vector3) : boolean {
    return vectorLength(crossProduct(v1, v2)) < TOLERANCE_EPSILON && dotProduct(v1, v2) >= 0;
};

// theta(1)
export function reflectVector(vector : Vector3|Point3, extlineBetween : Vector3|Point3) {
    let reflect = new Vector3();
    let v = new Vector3().copy(vector);
    let lineBetween = new Vector3(extlineBetween.x, extlineBetween.y, extlineBetween.z);
    reflect.copy(vector).add(lineBetween.multiplyScalar(-2 * v.dot(lineBetween)));
    return reflect;
};
// theta(1)
export function scaleVector(v1 : Vector3, n : number) : Vector3 {
    let ret = v1.clone();
    ret.x *= n;
    ret.y *= n;
    ret.z *= n;
    return ret;
}

// theta(1)
export function distanceBetweenPoints(p: Point3, q: Point3): number {
    const v = p.sub(q);
    return vectorLength(v);
}

// theta(1)
export function multiplyPointByScalar(v1 : Point3, n : number) : Point3 {
    let ret = v1.clone();
    ret.x *= n;
    ret.y *= n;
    ret.z *= n;
    return ret;
}

// theta(1)
// a rigor, tinha que ser o somatorio da multiplicação de todas as coordenadas em cada dimensão
// também tinha que estar em euler.ts por semantica, mas para nao gerar dependencia ciclica fica aqui
export function dotProduct(v1 : Vector3, v2 : Vector3) : number {
    return (v1.x * v2.x) + (v1.y * v2.y) + (v1.z * v2.z);
}

// theta(1)
export function crossProduct(v1: Vector3, v2: Vector3): Vector3 {
    const cross_x = v1.y * v2.z - v1.z * v2.y;
    const cross_y = v1.z * v2.x - v1.x * v2.z;
    const cross_z = v1.x * v2.y - v1.y * v2.x;
    return new Vector3(cross_x, cross_y, cross_z);
}

// theta(1)
export function addVectors(v1 : Vector3, v2 : Vector3) : Vector3 {
    return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

// theta(1)
export function reverseVector(v1 : Vector3) : Vector3 {
    return scaleVector(v1, -1);
}

// theta(1)
export function subVectors(v1 : Vector3, v2 : Vector3) : Vector3 {
    const reverse = scaleVector(v2, -1);
    return addVectors(v1, reverse);
}

// theta(1)
export function translatePoint(v1 : Point3, v2 : Vector3) : Point3 {
    return new Point3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

// O(n)
// Omega(1)
export function interpolatePoints(points: Point3[], scalars: number[]): Point3 {
    if (points.length !== scalars.length) {
        throw new Error("A quantidade de pontos e escalares de entrada deve ser a mesma");
    }

    let pointAcc = new Point3(0, 0, 0);

    for (let i = 0; i < points.length; i++) {
        let scaledPoint = multiplyPointByScalar(points[i], scalars[i])
        let incr = scaledPoint.toVector3()
        pointAcc = translatePoint(pointAcc, incr);
    }

    return pointAcc.clone();
}

// coordenadas homogenas serao implementadas, se necessario, via shaders
// no alto nivel temos classes THREE.Vector3 para vetores e uso nas renderizacoes e nossa propria classe Point3 para calculos envolvendo pontos

export enum OrientationCase {
    COLINEAR = 0,
    COUNTER_CLOCK_WISE = 1,
    CLOCK_WISE = -1
}

export enum CollinearOrderingCase {
    NOT_COLINEAR = 0,
    AFTER = 1,
    BEFORE = 2,
    BETWEEN = 3
}

// theta(1)
export function orientation1D(x1: number, x2: number): OrientationCase {
    // Calculando via diferença entre os números na dimensão
    const value = (x2 - x1);
    if (value === 0) {
        return OrientationCase.COLINEAR;
    }
    return value > 0 ? OrientationCase.COUNTER_CLOCK_WISE : OrientationCase.CLOCK_WISE;
}

// theta(1)
export function vectorLength(v : Vector3) {
    const dot = dotProduct(v, v);
    return Math.sqrt(dot);
}

// theta(1)
export function vector2dLength(v : Vector2) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
}

// theta(1)
export function rotateVector(vector: Vector3, angle: number, axis: Vector3 = new Vector3(0, 1, 0)): Vector3 {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    // Normalize the axis vector
    const normalizedAxis = axis.clone().normalize();
    
    // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
    const term1 = vector.clone().multiplyScalar(cosAngle);
    const term2 = normalizedAxis.clone().cross(vector.clone()).multiplyScalar(sinAngle);
    const term3 = normalizedAxis.clone().multiplyScalar(normalizedAxis.clone().dot(vector.clone()) * (1 - cosAngle));
    
    // Resultant rotated vector
    return term1.add(term2).add(term3);
}

// theta(1)
export function signedArea2D(p1: Point3, p2: Point3, p3: Point3): number {
    // determinante
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

// theta(1)
export function signedVolume3D(p1: Point3, p2: Point3, p3: Point3, p4: Point3): number {
    const AB = p2.sub(p1);
    const AC = p3.sub(p1);
    const AD = p4.sub(p1);
    const ABxAC = crossProduct(AB, AC);
    return dotProduct(ABxAC, AD) / 6; // dimensoes (3) fatorial
}

// theta(1)
export function orientation2D(p1: Point3, p2: Point3, p3: Point3): OrientationCase {
    const area = signedArea2D(p1, p2, p3);

    if (area === 0) {
        return OrientationCase.COLINEAR;
    }

    return area > 0 ? OrientationCase.COUNTER_CLOCK_WISE : OrientationCase.CLOCK_WISE;
}

// theta(1)
export function ordering2D(p1: Point3, p2: Point3, p3: Point3): CollinearOrderingCase {
    let ret = CollinearOrderingCase.NOT_COLINEAR;
    
    if (arePointsCollinear([ p1, p2, p3 ])) {

        const v1 = p2.sub(p1);
        const v2 = p3.sub(p1);
        const dot = dotProduct(v1, v2);
        const lenSq = v1.lengthSq();

        if(dot < 0) {
            ret = CollinearOrderingCase.BEFORE;            
        } else if (dot > lenSq) {
            ret = CollinearOrderingCase.AFTER;
        } else {
            ret = CollinearOrderingCase.BETWEEN;
        }

    }

    return ret;
}

// theta(1)
export function orientation3D(p1: Point3, p2: Point3, p3: Point3, p4: Point3): OrientationCase {
    const volume = signedVolume3D(p1, p2, p3, p4);

    if (volume === 0) {
        return OrientationCase.COLINEAR;
    }

    return volume > 0 ? OrientationCase.COUNTER_CLOCK_WISE : OrientationCase.CLOCK_WISE;
}

// theta(1)
export function det3x3(matrix: number[][]): number {
    const a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
    const d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];
    const g = matrix[2][0], h = matrix[2][1], i = matrix[2][2];

    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

// theta(1)
export function isPointPInTriangleABC(a: Point3|undefined|null, b: Point3|undefined|null, c: Point3|undefined|null, p: Point3|undefined|null): boolean {
    let ret = false;
    if(a && b && c && p && !arePointsCollinear([ a, b, c ])) {
        const matrix = [
            [a.x - p.x, a.y - p.y, (a.x * a.x + a.y * a.y) - (p.x * p.x + p.y * p.y)],
            [b.x - p.x, b.y - p.y, (b.x * b.x + b.y * b.y) - (p.x * p.x + p.y * p.y)],
            [c.x - p.x, c.y - p.y, (c.x * c.x + c.y * c.y) - (p.x * p.x + p.y * p.y)],
        ];
        const determinant = det3x3(matrix);
        const epsilon = 1E-10;
        ret = determinant > epsilon;
    }
    return ret;
}
