import { addVectors, crossProduct, dotProduct, Point3, scaleVector } from "@geometry/affine";
import { distanceBetweenPoints, errorIfPointsColinear3 } from "@geometry/euler";
import { findFarthestPoints, PolarReference } from "@geometry/topology";
import { shuffleArray } from "@helpers/arrays";

export function isInSphere(c: PolarReference, p: Point3): boolean {
	return distanceBetweenPoints(p, c.origin) <= c.radius;
}

export function calcDiameter(a: Point3, b: Point3): PolarReference {
	const cx: number = (a.x + b.x) / 2;
	const cy: number = (a.y + b.y) / 2;
    const cz: number = (a.z + b.z) / 2;
    const c = new Point3(cx, cy, cz);
	const r0: number = distanceBetweenPoints(c, a);
	const r1: number = distanceBetweenPoints(c, b);
	return { origin: c, radius: Math.max(r0, r1) };
}

export function calcCircumsphere(p1: Point3, p2: Point3, p3: Point3): PolarReference {

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