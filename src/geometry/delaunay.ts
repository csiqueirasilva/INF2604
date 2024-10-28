import { det3x3, dotProduct, isPointPInTriangleABC, ordering2D, vectorLength } from "@geometry/affine";
import { DualGraph, DualGraphNode, HalfEdgeForDualGraph } from "@geometry/dualgraph";
import { pseudoAngleAsSquarePerimeter } from "@geometry/euler";
import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { earClippingTriangulation } from "@geometry/polygon";
import { centroidFromPoints, quickHull } from "@geometry/topology";
import { PolygonEdge, Triangle } from "@geometry/triangle";
import { PushDebugObjects } from "@helpers/3DElements/Debug/DebugHelperExports";
import { createDebugArrow, createDebugCircle, createDebugDualGraphForTriangles, createDebugHalfEdge, createDebugHighlightPoint, createDebugLine, createDebugPointCloud, createDebugSphere, createDebugText, createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";
import { VECTOR3_ZERO } from "@helpers/ThreeUtils";
import { ArrowHelper, FrontSide, Vector2, Vector3 } from "three";

export function calculateAngle(v1: Vector3, v2: Vector3): number {
    const dotProd = dotProduct(v1, v2);
    const magnitudes = vectorLength(v1) * vectorLength(v2);
    const cosTheta = dotProd / magnitudes;
    // Convert angle to degrees
    return Math.acos(cosTheta) * (180 / Math.PI);
}

export  function getTriangleAngles(triangle: Triangle): number[] {
    const [A, B, C] = triangle.points;
    
    const AB = B.sub(A);
    const AC = C.sub(A);
    const BC = C.sub(B);
    
    // Calculate each angle
    const angleA = calculateAngle(AB, AC);
    const angleB = calculateAngle(BC, AB);
    const angleC = calculateAngle(AC, BC);
    
    return [angleA, angleB, angleC];
}

function flipEdgeInDualGraph(edge: HalfEdgeForDualGraph<Triangle>) {

    const p1 = edge.vertex;
    const p2 = edge.next?.vertex;
    const p3 = edge.next?.next?.vertex;
    const opposite = edge.twin?.next?.next?.vertex;

    if (!p1 || !p2 || !p3 || !opposite || !edge.twin) {
        throw new Error("Invalid edge for flipping.");
    }

    const edgeIndex = edge.getIndex();
    const twinIndex = edge.twin.getIndex();

    const edge1 = edge;
    const edge2 = edge.next;
    const edge3 = edge.next?.next;

    const twin1 = edge.twin;
    const twin2 = edge.twin?.next;
    const twin3 = edge.twin?.next?.next;

    if (!edge2 || !edge3 || !twin2 || !twin3) {
        throw new Error("Invalid half-edge structure for flipping.");
    }

    const newEdge2 = edge2;
    newEdge2.vertex.set(opposite);
    const newTwin2 = twin2;
    newTwin2.vertex.set(p3);
    
    edge1.next = newEdge2;
    newEdge2.next = edge3;

    twin1.next = newTwin2;
    newTwin2.next = twin3;

    const oldEdge2Twin = edge2.twin;
    const oldTwin2Twin = twin2.twin;

    if(oldTwin2Twin) {
        oldTwin2Twin.twin = edge1;
        edge1.twin = oldTwin2Twin;
    } else {
        edge1.twin = null;
    }
    
    if(oldEdge2Twin) {
        oldEdge2Twin.twin = twin1;
        twin1.twin = oldEdge2Twin;
    } else {
        twin1.twin = null;
    }
     
    newEdge2.twin = newTwin2;
    newTwin2.twin = newEdge2;

    newEdge2.node.shape.points[(edgeIndex + 1) % 3].set(newEdge2.vertex);
    newTwin2.node.shape.points[(twinIndex + 1) % 3].set(newTwin2.vertex);

    newEdge2.node.center = centroidFromPoints(...newEdge2.node.shape.points);
    newTwin2.node.center = centroidFromPoints(...newTwin2.node.shape.points);
}

function iterativeDelaunay(graph: DualGraph<Triangle>) {
    let flipped = true;
    while (flipped) {
        flipped = false;
        const nodes = graph.getTraversalOrdered();
        for (const node of nodes) {
            let edge : HalfEdgeForDualGraph<Triangle> | null = node.firstHalfEdge;
            do {
                if (edge?.twin) {
                    const p1 = edge.vertex;
                    const p2 = edge.next?.vertex;
                    const p3 = edge.next?.next?.vertex;
                    const opposite = edge.twin.next?.next?.vertex;
                    if (isPointPInTriangleABC(p1, p2, p3, opposite)) {
                        flipEdgeInDualGraph(edge);
                        flipped = true;
                        break;
                    }
                }
                edge = edge.next;
            } while (edge && edge !== node.firstHalfEdge && !flipped);
            if(flipped) {
                break;
            }
        }
    }
}

export function delaunayTriangulation(proposedPolygon: Point3[], name : string = "delaunay"): Triangle[] {
    const triangles: Triangle[] = earClippingTriangulation(proposedPolygon, name);
    const graph = new DualGraph<Triangle>(triangles);
    const debugTriangulation = createDebugTriangulatedSurface(triangles);
    let acc : any = [ debugTriangulation, createDebugDualGraphForTriangles(graph, false, false, false) ]; 
    PushDebugObjects(name, ...acc);
    iterativeDelaunay(graph);
    PushDebugObjects(name, createDebugDualGraphForTriangles(graph, false, false, false));
    return triangles;
}