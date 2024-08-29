import { Point3 } from "@geometry/affine";
import { distanceBetweenPoints } from "@geometry/euler";
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

export function calcCircumsphere(a: Point3, b: Point3, c: Point3, d: Point3): PolarReference | null {
    const ox: number = (Math.min(a.x, b.x, c.x, d.x) + Math.max(a.x, b.x, c.x, d.x)) / 2;
    const oy: number = (Math.min(a.y, b.y, c.y, d.y) + Math.max(a.y, b.y, c.y, d.y)) / 2;
    const oz: number = (Math.min(a.z, b.z, c.z, d.z) + Math.max(a.z, b.z, c.z, d.z)) / 2;

    const ax: number = a.x - ox;  const ay: number = a.y - oy;  const az: number = a.z - oz;
    const bx: number = b.x - ox;  const by: number = b.y - oy;  const bz: number = b.z - oz;
    const cx: number = c.x - ox;  const cy: number = c.y - oy;  const cz: number = c.z - oz;
    const dx: number = d.x - ox;  const dy: number = d.y - oy;  const dz: number = d.z - oz;

    const det: number = ax * (by * (cz * dz - dy * cz) + cy * (bz * dz - dz * bz) + dy * (bz * cz - bz * cz)) -
                        ay * (bx * (cz * dz - dy * cz) + cx * (bz * dz - dz * bz) + dx * (bz * cz - bz * cz)) +
                        az * (bx * (cy * dz - dy * cy) + cx * (by * dz - dy * by) + dx * (by * cy - by * cy)) -
                        az * (bx * (cy * dz - dy * cy) + cx * (by * dz - dy * by) + dx * (by * cy - by * cy));

    if (det === 0) {
        return null;
    }

    const x: number = ox + ((ax * ax + ay * ay + az * az) * (by * cz - cy * bz + dy * bz) +
                            (bx * bx + by * by + bz * bz) * (cy * dz - dy * cz + ay * cz) +
                            (cx * cx + cy * cy + cz * cz) * (dy * az - az * bz + bz * az)) / (2 * det);

    const y: number = oy + ((ax * ax + ay * ay + az * az) * (bz * dx - cz * bx + cz * dx) +
                            (bx * bx + by * by + bz * bz) * (cz * ax - dx * az + dx * az) +
                            (cx * cx + cy * cy + cz * cz) * (dx * bx - bx * az + az * bx)) / (2 * det);

    const z: number = oz + ((ax * ax + ay * ay + az * az) * (cy * dx - dy * bx + ay * dx) +
                            (bx * bx + by * by + bz * bz) * (dx * ax - bx * az + az * bx) +
                            (cx * cx + cy * cy + cz * cz) * (dy * az - az * bx + az * bx)) / (2 * det);

    const r: number = Math.sqrt((x - a.x) ** 2 + (y - a.y) ** 2 + (z - a.z) ** 2);

    return { origin: new Point3(x, y, z), radius: r };
}

// function makeCircleOnePoint(points: Point3[], p: Point3): PolarReference {
// 	let c: PolarReference = { origin: p.clone(), radius: 0 }
// 	points.forEach((q: Point3, i: number) => {
// 		if (!isInSphere(c, q)) {
// 			if (c.radius === 0)
// 				c = calcDiameter(p, q);
// 			else
// 				c = makeCircleTwoPoints(points.slice(0, i + 1), p, q);
// 		}
// 	});
// 	return c;
// }


// export function minSphere(points: Point3[]): PolarReference {
// 	let shuffled: Point3[] = shuffleArray(points);
	
// 	// Progressively add points to circle or recompute circle
// 	let ret : PolarReference|null = null;
// 	shuffled.forEach((p: Point3, i: number) => {
// 		if (ret === null || !isInSphere(ret, p))
// 			ret = makeCircleOnePoint(shuffled.slice(0, i + 1), p);
// 	});

//     if(ret === null) {
//         throw Error("Couldn't find the minimum sphere");
//     }

// 	return ret;
// }
