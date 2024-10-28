import { delaunayTriangulation } from "@geometry/delaunay";
import { DualGraph, HalfEdgeForDualGraph } from "@geometry/dualgraph";
import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { centroidFromPoints, quickHull } from "@geometry/topology";
import { Triangle } from "@geometry/triangle";
import { getDebugRandomColorBasicMaterial } from "@helpers/3DElements/Debug/debugVisualElements";
import { CanvasTexture, ConeGeometry, FrontSide, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";

export class VoronoiEdge {
    public start: Point3;
    public end: Point3;

    constructor(start: Point3, end: Point3) {
        this.start = start;
        this.end = end;
    }
}

export class VoronoiCell {
    public centroid: Point3;
    public edges: VoronoiEdge[];

    constructor(centroid: Point3) {
        this.centroid = centroid;
        this.edges = [];
    }

    public addEdge(start: Point3, end: Point3) {
        this.edges.push(new VoronoiEdge(start, end));
    }

    public getEdges(): VoronoiEdge[] {
        return this.edges;
    }
}

export class VoronoiDiagram {
    public cells: VoronoiCell[] = [];
    public seeds : Set<Point3> = new Set<Point3>();
}

export function voronoiDiagramFromDelaunayDualGraph(dualGraph: DualGraph<Triangle>, canvasWidth : number = 1000, canvasHeight : number = 1000): VoronoiDiagram {
    const ret = new VoronoiDiagram();

    const traversal = dualGraph.getTraversalOrdered();

    for (const node of traversal) {
        const circumcenterA = node.shape.calcCircumcircle().origin;
        const voronoiCell = new VoronoiCell(circumcenterA);

        let halfEdge: HalfEdgeForDualGraph<Triangle> | null = node.firstHalfEdge;

        do {
            const twinEdge = halfEdge?.twin;
            if (twinEdge) {
                const neighborNode = twinEdge.node;
                const circumcenterB = neighborNode.shape.calcCircumcircle().origin;
                voronoiCell.addEdge(circumcenterA, circumcenterB);
            } else {
                const extendedPoint = extendEdgeToBoundary(circumcenterA, halfEdge.vertex, canvasWidth, canvasHeight);
                //voronoiCell.addEdge(circumcenterA, extendedPoint);
            }
            halfEdge = halfEdge?.next;
        } while (halfEdge && halfEdge !== node.firstHalfEdge);

        ret.cells.push(voronoiCell);
        ret.seeds.add(node.shape.points[0]);
        ret.seeds.add(node.shape.points[1]);
        ret.seeds.add(node.shape.points[2]);
    }

    return ret;
}

function extendEdgeToBoundary(circumcenter: Point3, vertex: Point3, canvasWidth: number, canvasHeight: number): Point3 {
    const halfWidth = canvasWidth / 2;
    const halfHeight = canvasHeight / 2;

    const directionX = vertex.x - circumcenter.x;
    const directionY = vertex.y - circumcenter.y;

    let scaleFactor = Infinity;

    if (directionX !== 0) {
        const leftIntersect = (-halfWidth - circumcenter.x) / directionX;
        const rightIntersect = (halfWidth - circumcenter.x) / directionX;
        scaleFactor = Math.min(scaleFactor, leftIntersect, rightIntersect);
    }

    if (directionY !== 0) {
        const topIntersect = (halfHeight - circumcenter.y) / directionY; 
        const bottomIntersect = (-halfHeight - circumcenter.y) / directionY;
        scaleFactor = Math.min(scaleFactor, topIntersect, bottomIntersect);
    }

    const extendedX = circumcenter.x + (directionX * scaleFactor);
    const extendedY = circumcenter.y + (directionY * scaleFactor);

    return new Point3(extendedX, extendedY, 0);
}

export function voronoiDiagramFromDelaunay(proposedPolygon: Point3[], name: string = "voronoi-delaunay"): VoronoiDiagram {
    const triangles: Triangle[] = delaunayTriangulation(proposedPolygon, name);
    const graph = new DualGraph(triangles);
    const ret = voronoiDiagramFromDelaunayDualGraph(graph);
    return ret;
}

export function voronoiWithCones(proposedPolygon: Point3[], name: string = "voronoi-cones"): Group {
    let ret = new Group();
    const diagram: VoronoiDiagram = voronoiDiagramFromDelaunay(proposedPolygon, name);
    const seeds = Array.from(diagram.seeds);
    for (let i = 0; i < seeds.length; i++) {
        let c = seeds[i];
        let cone = createCone(c.toVector3(), i);
        ret.add(cone);
    }
    return ret;
}

const CONE_RADIUS_3D = 100;
const CONE_HEIGHT_3D = 5;

function createCone(centroid: Vector3, idx: number = 0): Mesh {
    const geometry = new ConeGeometry(CONE_RADIUS_3D, CONE_HEIGHT_3D, 48);
    const material = getDebugRandomColorBasicMaterial(idx, FrontSide);
    const cone = new Mesh(geometry, material);
    cone.position.set(centroid.x, centroid.y, 0);
    cone.rotation.x = Math.PI / 2;
    return cone;
}

export function generateVoronoiTexture(diagram: VoronoiDiagram, width: number = 512, height: number = 512, factor: number = 80): CanvasTexture | null {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const pixelRatio = 2;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawVoronoiLinesInCanvas(ctx, diagram, pixelRatio, factor);

        return new CanvasTexture(canvas);
    }

    return null;
}

function drawVoronoiLinesInCanvas(context: CanvasRenderingContext2D, diagram: VoronoiDiagram, pixelRatio: number, factor: number) {
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.fillStyle = 'black';

    diagram.cells.forEach(cell => {
        
        cell.getEdges().forEach(edge => {
            context.beginPath();
            context.moveTo((context.canvas.width / 2 - (edge.start.x * factor)) / pixelRatio, (context.canvas.height / 2 - (edge.start.y * factor)) / pixelRatio);
            context.lineTo((context.canvas.width / 2 - (edge.end.x * factor)) / pixelRatio, (context.canvas.height / 2 - (edge.end.y * factor)) / pixelRatio);
            context.stroke();
        });

        context.beginPath();
        context.arc(((context.canvas.width / 2) - (factor * cell.centroid.x)) / pixelRatio, ((context.canvas.height / 2) - (factor * cell.centroid.y)) / pixelRatio, 2, 0, Math.PI * 2);
        context.fill();
    });

    diagram.seeds.forEach(seed => {
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(((context.canvas.width / 2) - (factor * seed.x)) / pixelRatio, ((context.canvas.height / 2) - (factor * seed.y)) / pixelRatio, 2, 0, Math.PI * 2);
        context.fill();
    });  

} 