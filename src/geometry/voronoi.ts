import { rotateVector, vectorLength } from "@geometry/affine";
import { delaunayTriangulation, delaunayTriangulationConvex } from "@geometry/delaunay";
import { DualGraph, HalfEdgeForDualGraph } from "@geometry/dualgraph";
import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { calculateCentroidZeroZ, centroidFromPoints, PolarReference, quickHull, sortConvexPointsCCW } from "@geometry/topology";
import { PolygonEdge, PolygonShape, Triangle } from "@geometry/triangle";
import { createDebugDualGraphForTrianglesTraversalOrdered, createDebugPointCloud, DEBUG_COLORS, getDebugRandomColorBasicMaterial } from "@helpers/3DElements/Debug/debugVisualElements";
import { polygonIntersectsPolygon } from "geometric";
import { CanvasTexture, Color, ConeGeometry, Float32BufferAttribute, FrontSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { clip } from 'liang-barsky';

export class VoronoiCell extends PolygonShape {
    public seed: Point3;
    public centroid: Point3;
    public original: boolean = true;
    private static THRESHOLD_CONVERGENCE = 0.001;

    constructor(seed: Point3, points: Point3[], original: boolean = true) {
        super(points);
        this.seed = seed;
        this.centroid = calculateCentroidZeroZ([...points]);
        if (this.centroid.sub(this.seed).lengthSq() < VoronoiCell.THRESHOLD_CONVERGENCE) {
            this.centroid = this.seed.clone();
        }
        this.original = original;
    }

    public getEdges(): PolygonEdge[] {
        let ret: PolygonEdge[] = [];
        for (let i = 0; i < this.points.length; i++) {
            ret.push(new PolygonEdge(this.points[i], this.points[(i + 1) % this.points.length]));
        }
        return ret;
    }
}

export class VoronoiDiagram extends DualGraph<VoronoiCell> {
    public triangulationEdges: PolygonEdge[] = [];
    public getSeeds = () => {
        return this.shapes.flatMap(x => x.seed);
    }
    public isCentroidal = (): boolean => {
        return this.shapes.filter(x => x.original).every(x => x.seed.equals(x.centroid));
    }
    public getLloysRelaxationPoints = (): Point3[] => {
        const ret: Point3[] = [];
        const originals = this.shapes.filter(s => s.original);
        for (const cell of originals) {
            ret.push(cell.centroid);
        }
        return ret;
    }

    static buildFromDelaunayDualGraph = (dualGraph: DualGraph<Triangle>, proposedPolygon: Point3[], width: number = 8, height: number = 8) => {
        const ret = new VoronoiDiagram([]);

        const nodes = dualGraph.getTraversalOrdered();

        const seeds: Point3[] = [];

        for (const node of nodes) {

            let halfEdge: HalfEdgeForDualGraph<Triangle> | null = node.firstHalfEdge;

            do {
                const seed = halfEdge.vertex;
                if (!seeds.some(s => s.equals(seed))) {
                    seeds.push(seed);
                }
                for (let e of halfEdge.node.shape.getEdges()) {
                    if (!ret.triangulationEdges.some(te => te.equals(e))) {
                        ret.triangulationEdges.push(e);
                    }
                }
                halfEdge = halfEdge?.next;
            } while (halfEdge && halfEdge !== node.firstHalfEdge);

        }

        for (const seed of seeds) {
            const connectedTriangles = dualGraph.shapes.filter(x => x.points.some(p => p.equals(seed)));
            let points: Point3[] = [];
            for (const ct of connectedTriangles) {
                const circum = calcCircumcircle(ct.points[0], ct.points[1], ct.points[2]);
                points.push(circum.origin);
            }
            points = sortConvexPointsCCW(points);

            const newPoints: Point3[] = [];
            for (let i = 0; i < points.length; i++) {
                const start = points[i];
                const end = points[(i + 1) % points.length];
                let startClipped: [number, number] = [start.x, start.y];
                let endClipped: [number, number] = [end.x, end.y];
                let clipped = clip([start.x, start.y], [end.x, end.y], [-width, -height, width, height], startClipped, endClipped);
                if (clipped) {
                    newPoints.push(new Point3(startClipped[0], startClipped[1], 0))
                    newPoints.push(new Point3(endClipped[0], endClipped[1], 0))
                } else if (start.x < width && start.x > -width && start.y < height && start.y > -height) {
                    newPoints.push(start);
                }
            }
            points = newPoints; // Update points with the new clipped points for the next iteration
            let idxTopRight = points.findIndex((curr, idx) => {
                let next = points[(idx + 1) % points.length];
                return curr.y === height && next.x === width;
            });
            if (idxTopRight !== -1) {
                points.splice(idxTopRight + 1, 0, new Point3(width, height));
            }
            let idxTopLeft = points.findIndex((curr, idx) => {
                let next = points[(idx + 1) % points.length];
                return next.y === height && curr.x === -width;
            });
            if (idxTopLeft !== -1) {
                points.splice(idxTopLeft + 1, 0, new Point3(-width, height));
            }
            let idxBottomRight = points.findIndex((curr, idx) => {
                let next = points[(idx + 1) % points.length];
                return next.y === -height && curr.x === width;
            });
            if (idxBottomRight !== -1) {
                points.splice(idxBottomRight + 1, 0, new Point3(width, -height));
            }
            let idxBottomLeft = points.findIndex((curr, idx) => {
                let next = points[(idx + 1) % points.length];
                return curr.y === -height && next.x === -width;
            });
            if (idxBottomLeft !== -1) {
                points.splice(idxBottomLeft + 1, 0, new Point3(-width, -height));
            }
            const cell = new VoronoiCell(seed, points, proposedPolygon.some(p => p.equals(seed)));
            ret.addShape(cell);
        }

        return ret;
    }
}

export function voronoiDiagramFromDelaunay(proposedPolygon: Point3[], name: string = "voronoi-delaunay", width: number = 8, height: number = 8): VoronoiDiagram {
    const triangles: Triangle[] = delaunayTriangulationConvex([...proposedPolygon], name, true, width, height);
    const graph = new DualGraph(triangles);
    const ret = VoronoiDiagram.buildFromDelaunayDualGraph(graph, proposedPolygon, width, height);
    return ret;
}

export function buildVoronoiConesWithSeeds(diagram: VoronoiDiagram): Group {
    let ret = new Group();
    for (let i = 0; i < diagram.shapes.length; i++) {
        let c = diagram.shapes[i];
        if (c.original) {
            let cone = createCone(c.seed.toVector3(), i);
            ret.add(cone);
        }
    }
    return ret;
}

export function voronoiWithCones(proposedPolygon: Point3[], name: string = "voronoi-cones"): Group {
    const diagram: VoronoiDiagram = voronoiDiagramFromDelaunay(proposedPolygon, name);
    const ret = buildVoronoiConesWithSeeds(diagram);
    return ret;
}

const CONE_RADIUS_3D = 10;
const CONE_HEIGHT_3D = 80;

function createCone(centroid: Vector3, idx: number = 0): Group {
    const geometry = new ConeGeometry(CONE_RADIUS_3D, CONE_HEIGHT_3D, 32);
    const coneGroup = new Group();
    const material = new MeshBasicMaterial({
        color: DEBUG_COLORS[idx % DEBUG_COLORS.length],
        vertexColors: true,
    });
    const colors = [];
    const black = new Color(0xffffff);
    const baseColor = new Color(DEBUG_COLORS[idx % DEBUG_COLORS.length]);
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const y = geometry.attributes.position.getY(i);
        if (y > CONE_HEIGHT_3D * 0.49) {
            colors.push(black.r, black.g, black.b);
        } else {
            colors.push(baseColor.r, baseColor.g, baseColor.b);
        }
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const cone = new Mesh(geometry, material);
    cone.position.set(centroid.x, centroid.y, 0);
    cone.rotation.x = Math.PI / 2;
    coneGroup.add(cone);
    const plane = createDebugPointCloud([new Vector3(centroid.x, centroid.y, CONE_HEIGHT_3D + 1)], "black", 0.05);
    coneGroup.add(plane);
    return coneGroup;
}

export function generateVoronoiTexture(diagram: VoronoiDiagram, width: number = 512, height: number = 512, drawSeeds = true, drawCentroids = true, drawEdges = true, drawTriangulation = true, factor: number = 40): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const pixelRatio = 2;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawVoronoiLinesInCanvas(ctx, diagram, pixelRatio, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor);
    }

    return canvas;
}

function drawVoronoiLinesInCanvas(context: CanvasRenderingContext2D, diagram: VoronoiDiagram, pixelRatio: number, drawSeeds: boolean, drawCentroids : boolean, drawEdges : boolean, drawTriangulation : boolean, factor: number) {
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.fillStyle = 'black';

    if(drawTriangulation) {
        diagram.triangulationEdges.forEach((edge) => {
            context.strokeStyle = '#fae2e2';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo((context.canvas.width / 2 + (edge.start.x * factor)) / pixelRatio, (context.canvas.height / 2 - (edge.start.y * factor)) / pixelRatio);
            context.lineTo((context.canvas.width / 2 + (edge.end.x * factor)) / pixelRatio, (context.canvas.height / 2 - (edge.end.y * factor)) / pixelRatio);
            context.stroke();
        });
    }

    diagram.shapes.forEach((cell, idx) => {

        if(drawEdges) {

            cell.getEdges().forEach(edge => {

                context.fillStyle = 'black';

                context.beginPath();
                context.arc(((context.canvas.width / 2) + (factor * edge.end.x)) / pixelRatio, ((context.canvas.height / 2) - (factor * edge.end.y)) / pixelRatio, 2, 0, Math.PI * 2);
                context.fill();

                context.strokeStyle = 'black';

                context.beginPath();
                context.moveTo((context.canvas.width / 2 + (edge.start.x * factor)) / pixelRatio, (context.canvas.height / 2 - (edge.start.y * factor)) / pixelRatio);
                context.lineTo((context.canvas.width / 2 + (edge.end.x * factor)) / pixelRatio, (context.canvas.height / 2 - (edge.end.y * factor)) / pixelRatio);
                context.stroke();

            });

        }

        if(drawSeeds) {

            context.fillStyle = cell.original ? 'red' : 'green';

            context.beginPath();
            context.arc(((context.canvas.width / 2) + (factor * cell.seed.x)) / pixelRatio, ((context.canvas.height / 2) - (factor * cell.seed.y)) / pixelRatio, 2, 0, Math.PI * 2);
            context.fill();

        }

        if(drawCentroids) {

            context.fillStyle = '#5cfcff';

            context.beginPath();
            context.arc(((context.canvas.width / 2) + (factor * cell.centroid.x)) / pixelRatio, ((context.canvas.height / 2) - (factor * cell.centroid.y)) / pixelRatio, 2, 0, Math.PI * 2);
            context.fill();

        }

    });

} 