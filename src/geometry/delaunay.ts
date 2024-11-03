import { det3x3, dotProduct, isPointPInTriangleABC, ordering2D, orientation2D, OrientationCase, vectorLength } from "@geometry/affine";
import { DualGraph, DualGraphNode, HalfEdgeForDualGraph } from "@geometry/dualgraph";
import { pseudoAngleAsSquarePerimeter } from "@geometry/euler";
import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { earClippingTriangulation } from "@geometry/polygon";
import { arePointsCollinear, centroidFromPoints, isPointInsideTriangle, quickHull } from "@geometry/topology";
import { PolygonEdge, Triangle } from "@geometry/triangle";
import { PushDebugObjects } from "@helpers/3DElements/Debug/DebugHelperExports";
import { createDebugArrow, createDebugCircle, createDebugDualGraphForTriangles, createDebugDualGraphForTrianglesTraversalOrdered, createDebugHalfEdge, createDebugHighlightPoint, createDebugLine, createDebugPointCloud, createDebugSphere, createDebugText, createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";
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

function flipTriangleNodeEdge(node : DualGraphNode<Triangle>, name : string, debug : boolean = false) {
    let flipped = false;
    let edge : HalfEdgeForDualGraph<Triangle> | null = node.firstHalfEdge;
    do {
        if (edge?.twin) {
            const p1 = edge.vertex;
            const p2 = edge.next?.vertex;
            const p3 = edge.next?.next?.vertex;
            const opposite = edge.twin.next?.next?.vertex;
            if(debug && p1 && p2 && p3 && opposite && !arePointsCollinear([ p1, p2 , p3 ])) {
                const circum = calcCircumcircle(p1, p2, p3);
                PushDebugObjects(name, 
                    createDebugCircle(circum.origin, circum.radius),
                    createDebugTriangulatedSurface(node.parentGraph.shapes),
                    createDebugHighlightPoint(p1.toVector3(), "black"),
                    createDebugHighlightPoint(p2.toVector3(), "black"),
                    createDebugHighlightPoint(p3.toVector3(), "black"),
                    createDebugHighlightPoint(opposite.toVector3(), "red"),
                    createDebugText(`${isPointPInTriangleABC(p1, p2, p3, opposite) ? "FLIP" : "NO FLIP"}`, new Vector3(0, 5, 0))
                )
            }
            if (isPointPInTriangleABC(p1, p2, p3, opposite)) {
                flipEdgeInDualGraph(edge);
                flipped = true;
                break;
            }
        }
        edge = edge.next;
    } while (edge && edge !== node.firstHalfEdge && !flipped);
    return flipped;
}

function iterativeDelaunay(graph: DualGraph<Triangle>, name : string, debug : boolean = false) {
    let flipped = true;
    while (flipped) {
        flipped = false;
        const nodes = graph.getTraversalOrdered();
        for (const node of nodes) {
            flipped = flipTriangleNodeEdge(node, name, debug);
            if(flipped) {
                break;
            }
        }
    }
}

function splitTriangleOnPoint(graph : DualGraph<Triangle>, shape : Triangle, point : Point3) : DualGraphNode<Triangle>[] {
    let ret : DualGraphNode<Triangle>[] = [];
    if(graph && shape) {
        graph.removeShape(shape);
        let triangle1 = new Triangle([ shape.points[0].clone(), shape.points[1].clone(), point.clone() ]);
        let n1 = graph.addShape(triangle1);
        let triangle2 = new Triangle([ shape.points[1].clone(), shape.points[2].clone(), point.clone() ]);
        let n2 = graph.addShape(triangle2);
        let triangle3 = new Triangle([ shape.points[2].clone(), shape.points[0].clone(), point.clone() ]);
        let n3 = graph.addShape(triangle3);
        ret.push(n1, n2, n3);
    }
    return ret;
}

function splitEdgeOnPoint(graph : DualGraph<Triangle>, shape : Triangle, point : Point3, e1 : Point3, e2: Point3) : DualGraphNode<Triangle>[] {
    let ret : DualGraphNode<Triangle>[] = [];
    if(graph && shape) {
        const node = graph.findNodeByShape(shape);
        const he = node.findHalfEdgeWithVertex(e1);
        const twin = he.twin;
        if(twin) {
            const opposite = he.findNextWithout(e1, e2);
            const twinOpposite = twin.findNextWithout(e1, e2);
            graph.removeShape(twin.node.shape);
            graph.removeShape(shape);
            const t1 = new Triangle([ opposite.vertex.clone(), e1.clone(), point.clone() ]);
            const t2 = new Triangle([ e2.clone(), opposite.vertex.clone(), point.clone() ]);
            const t3 = new Triangle([ e1.clone(), twinOpposite.vertex.clone(), point.clone() ]);
            const t4 = new Triangle([ twinOpposite.vertex.clone(), e2.clone(), point.clone() ]);
            let n1 = graph.addShape(t1);
            let n2 = graph.addShape(t2);
            let n3 = graph.addShape(t3);
            let n4 = graph.addShape(t4);
            ret.push(n1, n2, n3, n4);
        }
    }
    return ret;
}

function isOnEdgeOfTriangle(point : Point3, edgePoint1 : Point3, edgePoint2 : Point3) {
    return point.isBetween(edgePoint1, edgePoint2);
}

function iterativeDelaunayConvex(graph: DualGraph<Triangle>, points : Point3[], name : string, debug: boolean = true) {
    let shapes = graph.shapes;
    for(const point of points) {
        for (const shape of shapes) {
            let nodesToOperate : DualGraphNode<Triangle>[] = [];
            if(isPointInsideTriangle(point, shape.points[0], shape.points[1], shape.points[2])) {
                nodesToOperate = splitTriangleOnPoint(graph, shape, point);
            } else if (isOnEdgeOfTriangle(point, shape.points[0], shape.points[1])) {
                nodesToOperate = splitEdgeOnPoint(graph, shape, point, shape.points[0], shape.points[1]);
            } else if (isOnEdgeOfTriangle(point, shape.points[1], shape.points[2])) {
                nodesToOperate = splitEdgeOnPoint(graph, shape, point, shape.points[1], shape.points[2]);
            } else if (isOnEdgeOfTriangle(point, shape.points[2], shape.points[0])) {
                nodesToOperate = splitEdgeOnPoint(graph, shape, point, shape.points[2], shape.points[0]);
            }   
            if(nodesToOperate.length > 0) {
                shapes = graph.shapes;
                break;
            }
        }
        if(debug) {
            PushDebugObjects(name, createDebugTriangulatedSurface(shapes), createDebugText(`p`, point.toVector3()));
        }
    }
    iterativeDelaunay(graph, name);
}

export function delaunayTriangulation(proposedPolygon: Point3[], name : string = "delaunay"): Triangle[] {
    const triangles: Triangle[] = earClippingTriangulation(proposedPolygon, name);
    const graph = new DualGraph<Triangle>(triangles);
    const debugTriangulation = createDebugTriangulatedSurface(triangles);
    let acc : any = [ debugTriangulation, createDebugDualGraphForTriangles(graph, false, false, false) ]; 
    PushDebugObjects(name, ...acc);
    iterativeDelaunay(graph, name);
    PushDebugObjects(name, createDebugDualGraphForTriangles(graph, false, false, false));
    return triangles;
}

export function delaunayTriangulationConvex(proposedPolygon: Point3[], name : string = "delaunay", useBoundingBox: boolean = false, width : number = 8, height : number = 8, debug : boolean = true): Triangle[] {
    let boundingPoints : Point3[];
    if(proposedPolygon.length > 0 && proposedPolygon[proposedPolygon.length - 1].equals(proposedPolygon[0])) {
        proposedPolygon = proposedPolygon.slice(0, proposedPolygon.length - 1);
    }
    if(useBoundingBox) {
        boundingPoints = [ new Point3(width, height), new Point3(-width, height), new Point3(-width, -height), new Point3(width, -height) ];
    } else {
        boundingPoints = quickHull(proposedPolygon);
    }
    const triangles: Triangle[] = earClippingTriangulation(boundingPoints, name, debug);
    const graph = new DualGraph<Triangle>(triangles);
    if(debug) {
        const debugTriangulation = createDebugTriangulatedSurface(triangles);
        let acc : any = [ debugTriangulation, createDebugDualGraphForTriangles(graph, false, false, false) ]; 
        PushDebugObjects(name, ...acc);
    }
    let nonConvexHullPoints = proposedPolygon.filter(p => !boundingPoints.some(x => x.equals(p)));
    iterativeDelaunayConvex(graph, nonConvexHullPoints, name, debug);
    if(debug) {
        PushDebugObjects(name, createDebugDualGraphForTriangles(graph, false, false, false));
    }
    return graph.shapes;
}