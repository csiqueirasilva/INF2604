import { RADIAN } from "@geometry/constants";
import { distanceBetweenPoints } from "@geometry/euler";
import { useThree } from "@react-three/fiber";
import { Vector2, Vector3 } from "three";

export class Point3 {
    public x : number = 0
    public y : number = 0
    public z : number = 0
    // theta(1)
    public toVector3 = () => new Vector3(this.x, this.y, this.z)
    // theta(1)
    public clone = () => new Point3(this.x, this.y, this.z)
    // theta(1)
    public constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    // theta(1)
    public sub(p : Point3) : Vector3 {
        return subVectors(this.toVector3(), p.toVector3())
    }
    // theta(1)
    public add(p : Point3) : Vector3 {
        return addVectors(this.toVector3(), p.toVector3())
    }
    // theta(1)
    public distanceTo(p : Point3) : number {
        return distanceBetweenPoints(this, p)
    }
    // theta(1)
    public medianPointTo(p : Point3) : Point3 {
        return Point3.fromVector3(this.toVector3().add(p.toVector3().sub(this).multiplyScalar(0.5)));
    }
    // theta(n)
    static centroid(points: Point3[]): Point3 {
        const n = points.length;
        const sum = points.reduce(
            (acc, point) => {
                acc.x += point.x;
                acc.y += point.y;
                acc.z += point.z;
                return acc;
            },
            { x: 0, y: 0, z: 0 }
        );
        return new Point3(sum.x / n, sum.y / n, sum.z / n);
    }
    static fromVector3 = (v : Vector3) : Point3 => new Point3(v.x, v.y, v.z)
}

// theta(1)
export function scaleVector(v1 : Vector3, n : number) : Vector3 {
    let ret = v1.clone();
    ret.x *= n;
    ret.y *= n;
    ret.z *= n;
    return ret;
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
// a rigor tinha que estar em euler.ts por semantica, mas para nao gerar dependencia ciclica fica aqui
export function vectorLength(v : Vector3) {
    const dot = dotProduct(v, v);
    return Math.sqrt(dot);
}

// theta(1)
// a rigor tinha que estar em euler.ts por semantica, mas para nao gerar dependencia ciclica fica aqui
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
    return dotProduct(ABxAC, AD);
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
export function orientation3D(p1: Point3, p2: Point3, p3: Point3, p4: Point3): OrientationCase {
    const volume = signedVolume3D(p1, p2, p3, p4);

    if (volume === 0) {
        return OrientationCase.COLINEAR;
    }

    return volume > 0 ? OrientationCase.COUNTER_CLOCK_WISE : OrientationCase.CLOCK_WISE;
}