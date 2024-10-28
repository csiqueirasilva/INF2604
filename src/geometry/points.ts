import { Vector3 } from "three";

export const TOLERANCE_EPSILON: number = 1e-14;

export class Point3 {
    public x : number = 0
    public y : number = 0
    public z : number = 0
    // theta(1)
    public constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    // theta(1)
    public toVector3 = () => new Vector3(this.x, this.y, this.z)
    // theta(1)
    public clone = () => new Point3(this.x, this.y, this.z)
    // theta(1)
    public equals(p: Point3): boolean {
        return this.x === p.x && this.y === p.y && this.z === p.z;
    }
    public set(p : Point3) : void {
        this.x = p.x;
        this.y = p.y;
        this.z = p.z;
    }
    // theta(1)
    public sub(p : Point3) : Vector3 {
        return this.toVector3().sub(p)
    }
    // theta(1)
    public add(p : Point3) : Vector3 {
        return this.toVector3().add(p)
    }
    // theta(1)
    public distanceTo(p : Point3) : number {
        const v = this.sub(p);
        return v.length();
    }
    // theta(1)
    public distanceToSq(p : Point3) : number {
        const v = this.sub(p);
        return v.lengthSq();
    }
    // theta(1)
    public medianPointTo(p : Point3, median : number = 0.5) : Point3 {
        return Point3.fromVector3(this.toVector3().add(p.toVector3().sub(this).multiplyScalar(median)));
    }
    // helper
    public cross(other: Point3): Point3 {
        return new Point3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }
    // helper    
    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
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
    // helper
    public dot(other: Point3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    static fromVector3 = (v : Vector3) : Point3 => new Point3(v.x, v.y, v.z)
    public toString = (precision = 2) : string => `(${this.x.toFixed(precision)},${this.y.toFixed(precision)},${this.z.toFixed(precision)})`
    static lerp(p0: Point3, p1: Point3, t: number): Point3 {
        if(t < 0 || t > 1) {
            throw new Error("Parameter t outside range 0 to 1 (inclusives)");
        }
        return new Point3(
          p0.x + (p1.x - p0.x) * t,
          p0.y + (p1.y - p0.y) * t,
          p0.z + (p1.z - p0.z) * t
        );
    }
}

export enum PointGenerationType {
    RANDOM_BRUTE_FORCE = "Random brute force",
    STRATIFIED_SAMPLING = "Stratified sampling"
}

export function generateRNGPointCloudBasedOnStrategy(
    nPoints : number, 
    strategy : PointGenerationType, 
    maxX : number, 
    minX : number, 
    maxY : number, 
    minY : number, 
    maxZ : number, 
    minZ : number) {
    let ret : Point3[] = [];
    switch(strategy) {
        case PointGenerationType.RANDOM_BRUTE_FORCE:
            ret = bruteForceRNGPointsInRange(nPoints, maxX, minX, maxY, minY, maxZ, minZ);
            break;
        case PointGenerationType.STRATIFIED_SAMPLING:
            ret = stratifiedRNGPointsInRange(nPoints, maxX, minX, maxY, minY, maxZ, minZ);
            break;
    }
    return ret;
}

export function bruteForceRNGPointsInRange(
    nPoints: number, 
    maxX: number, 
    minX: number, 
    maxY: number, 
    minY: number, 
    maxZ: number, 
    minZ: number): Point3[] {
            
    const generatedPoints: Point3[] = new Array(nPoints);

    for (let i = 0; i < nPoints; i++) {
        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;
        const z = Math.random() * (maxZ - minZ) + minZ;
        generatedPoints[i] = new Point3(x, y, z);
    }

    return generatedPoints;
}

export function stratifiedRNGPointsInRange(
    nPoints: number, 
    maxX: number, 
    minX: number, 
    maxY: number, 
    minY: number, 
    maxZ: number, 
    minZ: number, 
    strataX: number = 2, 
    strataY: number = 2, 
    strataZ: number = 2
): Point3[] {
    const generatedPoints: Point3[] = new Array(nPoints);

    const stepX = (maxX - minX) / strataX;
    const stepY = (maxY - minY) / strataY;
    const stepZ = (maxZ - minZ) / strataZ;

    let pointIndex = 0;

    for (let i = 0; i < strataX; i++) {
        for (let j = 0; j < strataY; j++) {
            for (let k = 0; k < strataZ; k++) {
                const pointsInStratum = Math.ceil(nPoints / (strataX * strataY * strataZ));
                
                for (let p = 0; p < pointsInStratum && pointIndex < nPoints; p++) {
                    const x = Math.random() * stepX + minX + i * stepX;
                    const y = Math.random() * stepY + minY + j * stepY;
                    const z = Math.random() * stepZ + minZ + k * stepZ;
                    generatedPoints[pointIndex++] = new Point3(x, y, z);
                }
            }
        }
    }

    return generatedPoints.slice(0, nPoints); 
}