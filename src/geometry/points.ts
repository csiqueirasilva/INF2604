import { Point3 } from "@geometry/affine";

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