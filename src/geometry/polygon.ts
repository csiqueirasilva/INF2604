import { crossProduct, orientation2D, OrientationCase, vectorLength } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { arePointsCoplanar, centroidFromPoints, distinctPoints, isNoPointInsideTriangle, isPointInsideTriangle, rotatePointsReverseRotation, rotatePointsToZPlane, sortConvexPointsCCW } from "@geometry/topology";
import { ClearDebugObject, ClearDebugObjects, PushDebugObject, PushDebugObjects } from "@helpers/3DElements/Debug/DebugHelperExports";
import { createDebugArrowSegments, createDebugHighlightPoint, createDebugLine, createDebugSurface, createDebugText, createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";
import { VECTOR3_ZERO } from "@helpers/ThreeUtils";

export interface Triangle {
    points: Point3[]
}

function isMiddleAngleConvex(a: Point3, b: Point3, c: Point3): boolean {
    const v1 = b.sub(a);
    const v2 = c.sub(b);
    const cross = vectorLength(crossProduct(v1, v2));
    return orientation2D(a,b,c) === OrientationCase.COUNTER_CLOCK_WISE && cross > 0;
}

function isEar(polygon: Point3[], a: Point3, b: Point3, c: Point3): boolean {
    let ret = true;

    // tem que ser convexo
    if (!isMiddleAngleConvex(a, b, c)) {
        ret = false;
    } else {
        // checa se um outro ponto está dentro do triangulo
        for (let i = 0; ret && i < polygon.length; i++) {
            const p1 = polygon[i];
            if (isPointInsideTriangle(p1, a, b, c)) {
                ret = false; 
            }
        }
    }

    return ret;
}

export function earClippingTriangulation(proposedPolygon: Point3[], name : string = "earClipping"): Triangle[] {
    const triangles: Triangle[] = [];

    ClearDebugObject(name);

    if(proposedPolygon.length > 0 && arePointsCoplanar(proposedPolygon)) {

        proposedPolygon = distinctPoints(proposedPolygon);

        // to z=0 plane
        const [ rotate, rotationMatrix ] = rotatePointsToZPlane(proposedPolygon);

        // input deve estar na ordem correta, ou o clipping falhará
        const polygon = rotate;

        PushDebugObjects(name, ...createDebugArrowSegments(polygon), createDebugHighlightPoint(centroidFromPoints(...polygon)));

        const remainingPolygon = [...polygon]; // copy

        while (remainingPolygon.length >= 3) {
            let earFound = false;

            for (let i = 0; i < remainingPolygon.length; i++) {
                const prevIndex = (i - 1 + remainingPolygon.length) % remainingPolygon.length;
                const nextIndex = (i + 1) % remainingPolygon.length;
                const prev = remainingPolygon[prevIndex];
                const current = remainingPolygon[i];
                const next = remainingPolygon[nextIndex];

                if(isEar(remainingPolygon, prev, current, next)) {
                    const p = [prev, current, next];

                    triangles.push({ points: p });

                    // remove ela
                    remainingPolygon.splice(i, 1);

                    PushDebugObjects(name, 
                        createDebugTriangulatedSurface(triangles), 
                        createDebugSurface(p), 
                        ...createDebugArrowSegments(remainingPolygon)
                    );

                    earFound = true;
                }
            }

            // se nao achou orelha, o algoritmo falha
            if (!earFound) {
                throw new Error("Nenhuma orelha encontrada. Polígono pode ser complexo ou inválido.");
            }
        }

        // restore
        triangles.forEach(triangle => triangle.points = rotatePointsReverseRotation(triangle.points, rotationMatrix));

    }

    PushDebugObjects(name, createDebugTriangulatedSurface(triangles));

    return triangles;
}