import { multiplyPointByScalar, rotateVector, vectorLength } from "@geometry/affine";
import { delaunayTriangulation, delaunayTriangulationConvex } from "@geometry/delaunay";
import { DualGraph, HalfEdgeForDualGraph } from "@geometry/dualgraph";
import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { calculateCentroidZeroZ, centroidFromPoints, PolarReference, quickHull, sortConvexPointsCCW } from "@geometry/topology";
import { PolygonEdge, PolygonShape, Triangle } from "@geometry/triangle";
import { createDebugDualGraphForTrianglesTraversalOrdered, createDebugPointCloud, DEBUG_COLORS, getDebugRandomColorBasicMaterial } from "@helpers/3DElements/Debug/debugVisualElements";
import { Point, polygonIntersectsPolygon } from "geometric";
import { CanvasTexture, Color, ColorRepresentation, ConeGeometry, Float32BufferAttribute, FrontSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { clip } from 'liang-barsky';
import { Delaunay, Voronoi } from "d3-delaunay";
import * as PIXI from 'pixi.js';

const CANVAS_VORONOI_STIPPLE_SCALE = 2.25;

export interface VoronoiPlainObject { 
    shapes : { 
        seed : { x : number, y : number }, 
        points: { x : number, y : number }[]
    }[], 
    edges: { 
        start: { x : number, y : number }, 
        end: { x : number, y : number } 
    }[] 
}

export function fromVoronoiCanvasStipple(x : number, y : number, targetWidth : number, targetHeight : number, canvasWidth : number, canvasHeight : number) : Point3 {
    x = x / CANVAS_VORONOI_STIPPLE_SCALE;
    y = y / CANVAS_VORONOI_STIPPLE_SCALE;
    const scaleX =  targetWidth / canvasWidth;
    const scaleY = targetHeight / canvasHeight;
    const w = -(canvasWidth / 2) * scaleX;
    const h = -(canvasHeight / 2) * scaleY;
    const scaledX = (x - w) / scaleX;
    const scaledY = (y - h) / scaleY;
    let p = new Point3(Math.round(scaledX), Math.round(scaledY), 0);
    return p;
}

export function toVoronoiCanvasStipple(x : number, y : number, targetWidth : number, targetHeight : number, canvasWidth : number, canvasHeight : number) : Point3 {
    const scaleX = targetWidth / canvasWidth;
    const scaleY = targetHeight / canvasHeight;
    const w = -(canvasWidth / 2) * scaleX;
    const h = -(canvasHeight / 2) * scaleX;
    const scaledX = w + (x * scaleX);
    const scaledY = h + (y * scaleY);
    let p = new Point3(scaledX, scaledY, 0);
    p = multiplyPointByScalar(p, CANVAS_VORONOI_STIPPLE_SCALE);
    return p;
}

export class WeightedVoronoiStipple extends Point3 {
    public radius : number;
    public color : string;
    constructor(x : number, y : number, radius : number, color : string) {
        super(x, y, 0)
        this.radius = radius;
        this.color = color;
    } 
}

export class VoronoiCell extends PolygonShape {
    public seed: Point3;
    public centroid: Point3;
    public original: boolean = true;
    public weightedCentroid : WeightedVoronoiStipple|null = null;
    private static THRESHOLD_CONVERGENCE = 0.0001;

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

    public getWeightedCentroidBasedOnImage = (imageData : ImageData, factor : number): WeightedVoronoiStipple|null => {
        if(this.weightedCentroid) return this.weightedCentroid;
        const aspect = imageData.width / imageData.height;
        const factorX = factor;
        const factorY = factor / aspect;
        const coordX = this.seed.x;
        const coordY = this.seed.y;
        let p = fromVoronoiCanvasStipple(this.seed.x, this.seed.y, factorX, factorY, imageData.width, imageData.height);
        const index = (p.y * imageData.width + p.x) * 4;
        const r = imageData.data[index + 0];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        const a = imageData.data[index + 3];
        const stippleColor = new Color(r / 255, g / 255, b / 255);
        const brightness = 1 - (((r+g+b)/3) / 255);
        const ret = a === 0 ? null : new WeightedVoronoiStipple(coordX, coordY, brightness, '#' + stippleColor.getHexString());
        this.weightedCentroid = ret;
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
    public getLloydRelaxationPoints = (): Point3[] => {
        const ret: Point3[] = [];
        const originals = this.shapes.filter(s => s.original);
        for (const cell of originals) {
            ret.push(cell.centroid);
        }
        return ret;
    }
    public getWeightedVoronoiStipples = (imageData : ImageData, factor : number): Point3[] => {
        const ret: Point3[] = [];
        const aspect = imageData.width / imageData.height;
        const factorX = factor;
        const factorY = factor / aspect;
        const points = this.getSeeds().map(x => { 
            const p = fromVoronoiCanvasStipple(x.x, x.y, factorX, factorY, imageData.width, imageData.height)
            return [ p.x, p.y ];
        }) as ArrayLike<Point>;
        const delaunay = Delaunay.from(points);
        const centroids = new Array(this.shapes.length);
        for(let i = 0; i < centroids.length; i++) {
            centroids[i] = new Point3(0, 0, 0);
        }
        const weights = new Array(this.shapes.length).fill(0);
        let delaunayIndex = 0;
        for(let i = 0; i < imageData.width; i++) {
            for(let j = 0; j < imageData.height; j++) {
                const index = (j * imageData.width + i) * 4;
                const a = imageData.data[index + 3];
                if(a !== 0) {
                    const r = imageData.data[index + 0];
                    const g = imageData.data[index + 1];
                    const b = imageData.data[index + 2];
                    const value = (r + g + b) / 3;
                    const weight = 1 - (value / 255);
                    delaunayIndex = delaunay.find(i, j, delaunayIndex);
                    centroids[delaunayIndex].x += i * weight;
                    centroids[delaunayIndex].y += j * weight;
                    weights[delaunayIndex] += weight;
                }
            }
        }
        for(let i = 0; i < centroids.length; i++) {
            let v : [ number, number ];
            if(weights[i] > 0) {
                v = [ centroids[i].x / weights[i], centroids[i].y / weights[i] ];
            } else {
                v = [ points[i][0], points[i][1] ];
            }
            let pushed = toVoronoiCanvasStipple(v[0], v[1], factorX, factorY, imageData.width, imageData.height);
            ret.push(pushed);
        }
        return ret;
    }
    public toPlainObject() : VoronoiPlainObject {
        return {
            shapes: this.shapes.map(shape => ({
                seed: { x: shape.seed.x, y: shape.seed.y },
                points: shape.points.map(p => ({ x: p.x, y: p.y }))
            })),
            edges: this.triangulationEdges.map(edge => ({
                start: ({ x: edge.start.x, y: edge.start.y }),
                end: ({ x: edge.end.x, y: edge.end.y })
            }))
        };
    }
    static fromPlainObject(plain : VoronoiPlainObject) : VoronoiDiagram {
        const ret = new VoronoiDiagram([]);
        ret.triangulationEdges = plain.edges.map(ed => new PolygonEdge( new Point3(ed.start.x, ed.start.y, 0), new Point3(ed.end.x, ed.end.y, 0) ));
        ret.shapes = plain.shapes.map(sp => new VoronoiCell( new Point3(sp.seed.x, sp.seed.y), sp.points.map(p => new Point3(p.x, p.y, 0)), true ));
        return ret;
    }
    static buildWithD3Delaunay = (proposedPolygon: Point3[], width: number = 8, height: number = 8) => {
        const delaunay = Delaunay.from(proposedPolygon.map(x => [ x.x, x.y ]));
        const ret = new VoronoiDiagram([]);
        const d3Voronoi = delaunay.voronoi([-width, -height, width, height ]);
        for (let i = 0; i < delaunay.points.length / 2; i++) {
            const seed = new Point3(delaunay.points[2 * i], delaunay.points[2 * i + 1], 0);
            const d3Cell = d3Voronoi.cellPolygon(i);
            if (!d3Cell) continue;
            const points = Array.from(d3Cell, ([x, y]) => new Point3(x, y, 0));
            const cell = new VoronoiCell(seed, points, true);
            ret.addShape(cell);
        }
        for (let t = 0; t < delaunay.triangles.length; t += 3) {
            const p0 = new Point3(delaunay.points[2 * delaunay.triangles[t]], delaunay.points[2 * delaunay.triangles[t] + 1], 0);
            const p1 = new Point3(delaunay.points[2 * delaunay.triangles[t + 1]], delaunay.points[2 * delaunay.triangles[t + 1] + 1], 0);
            const p2 = new Point3(delaunay.points[2 * delaunay.triangles[t + 2]], delaunay.points[2 * delaunay.triangles[t + 2] + 1], 0);
            const edges = [
                new PolygonEdge(p0, p1),
                new PolygonEdge(p1, p2),
                new PolygonEdge(p2, p0)
            ];
            for (const edge of edges) {
                if (!ret.triangulationEdges.some(e => e.equals(edge))) {
                    ret.triangulationEdges.push(edge);
                }
            }
        }
        return ret;
    }
    static buildWithD3DelaunayPlainObject = (proposedPolygon: [number, number][], width: number = 8, height: number = 8) : VoronoiPlainObject => {
        const delaunay = Delaunay.from(proposedPolygon);
        const ret : VoronoiPlainObject = {
            shapes: [],
            edges: []
        };
        const d3Voronoi = delaunay.voronoi([-width, -height, width, height ]);
        for (let i = 0; i < delaunay.points.length / 2; i++) {
            const seed = new Point3(delaunay.points[2 * i], delaunay.points[2 * i + 1], 0);
            const d3Cell = d3Voronoi.cellPolygon(i);
            if (!d3Cell) continue;
            const points = Array.from(d3Cell, ([x, y]) => new Point3(x, y, 0));
            ret.shapes.push({ seed: { x: seed.x, y: seed.y }, points: points.map(x => ({ x: x.x, y: x.y }))})
        }
        for (let t = 0; t < delaunay.triangles.length; t += 3) {
            const p0 = { x: delaunay.points[2 * delaunay.triangles[t]], y: delaunay.points[2 * delaunay.triangles[t] + 1] };
            const p1 = { x: delaunay.points[2 * delaunay.triangles[t + 1]], y: delaunay.points[2 * delaunay.triangles[t + 1] + 1] };
            const p2 = { x: delaunay.points[2 * delaunay.triangles[t + 2]], y: delaunay.points[2 * delaunay.triangles[t + 2] + 1] };
            ret.edges.push({ start: p0, end: p1 });
            ret.edges.push({ start: p1, end: p2 });
            ret.edges.push({ start: p2, end: p0 });
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
                try {
                    const circum = calcCircumcircle(ct.points[0], ct.points[1], ct.points[2]);
                    points.push(circum.origin);
                } catch (e) {
                }
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

export function voronoiDiagramFromD3DelaunayPlainObject(proposedPolygon: [number,number][], width: number = 8, height: number = 8): VoronoiPlainObject {
    return VoronoiDiagram.buildWithD3DelaunayPlainObject(proposedPolygon, width, height);
}

export function voronoiDiagramFromD3Delaunay(proposedPolygon: Point3[], width: number = 8, height: number = 8): VoronoiDiagram {
    return VoronoiDiagram.buildWithD3Delaunay(proposedPolygon, width, height);
}

export function voronoiDiagramFromDelaunay(proposedPolygon: Point3[], name: string = "voronoi-delaunay", width: number = 8, height: number = 8, debug = true): VoronoiDiagram {
    const triangles: Triangle[] = delaunayTriangulationConvex([...proposedPolygon], name, true, width, height, debug);
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

export function drawWeightedVoronoiStipplingTextureOnExistingCanvas(canvas : HTMLCanvasElement, ctx : CanvasRenderingContext2D, imageData : ImageData, imageToCanvasFactor : number, diagram: VoronoiDiagram, fillEdge = true, drawSeeds = true, drawCentroids = true, drawEdges = true, drawTriangulation = true, factor: number = 40, clear : boolean = true) {
    if (ctx) {
        const pixelRatio = 2;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if(clear) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawWeightedVoronoiStipplingLinesInCanvas(ctx, imageData, imageToCanvasFactor, diagram, pixelRatio, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor, fillEdge);
    }
}

export function drawVoronoiTextureOnExistingCanvas(canvas : HTMLCanvasElement, diagram: VoronoiDiagram, drawSeeds = true, drawCentroids = true, drawEdges = true, drawTriangulation = true, factor: number = 40, clear : boolean = true) {
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const pixelRatio = 2;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if(clear) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawVoronoiLinesInCanvas(ctx, diagram, pixelRatio, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor);
    }
}

export function generateVoronoiTexture(diagram: VoronoiDiagram, width: number = 512, height: number = 512, drawSeeds = true, drawCentroids = true, drawEdges = true, drawTriangulation = true, factor: number = 40): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    drawVoronoiTextureOnExistingCanvas(canvas, diagram, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor);
    return canvas;
}

function drawWeightedVoronoiStipplingLinesInCanvas(context: CanvasRenderingContext2D, imageData : ImageData, imageToCanvasFactor : number, diagram: VoronoiDiagram, pixelRatio: number, drawSeeds: boolean, drawCentroids : boolean, drawEdges : boolean, drawTriangulation : boolean, factor: number, fillEdge : boolean) {
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.fillStyle = 'black';

    if(drawTriangulation) {
        diagram.triangulationEdges.forEach((edge) => {
            context.strokeStyle = '#fae2e2';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo((context.canvas.width / 2 + (edge.start.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge.start.y * factor)) / pixelRatio);
            context.lineTo((context.canvas.width / 2 + (edge.end.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge.end.y * factor)) / pixelRatio);
            context.stroke();
        });
    }

    diagram.shapes.forEach((cell, idx) => {

        const stipple = cell.getWeightedCentroidBasedOnImage(imageData, imageToCanvasFactor);

        if(cell.original) {

            if(drawEdges) {

                // Begin the entire cell path
                context.beginPath();

                // Loop through each edge to create a continuous path
                cell.getEdges().forEach((edge, index) => {
                    // Move to the starting point of the first edge
                    if (index === 0) {
                        context.moveTo(
                            (context.canvas.width / 2 + edge.start.x * factor) / pixelRatio,
                            (context.canvas.height / 2 + edge.start.y * factor) / pixelRatio
                        );
                    }

                    // Draw a line to the end of each edge
                    context.lineTo(
                        (context.canvas.width / 2 + edge.end.x * factor) / pixelRatio,
                        (context.canvas.height / 2 + edge.end.y * factor) / pixelRatio
                    );
                });

                // Close the path to ensure it's a complete shape
                context.closePath();

                // Optionally, set stroke properties and outline the path if needed
                context.strokeStyle = 'black';
                context.stroke();

                // Apply stipple effect if needed
                if (stipple && fillEdge) {
                    context.fillStyle = stipple.color;
                    context.fill();
                }

            } 
            
            if(stipple && drawSeeds) {

                context.fillStyle = stipple.color;
                context.beginPath();
                context.arc(((context.canvas.width / 2) + (factor * cell.seed.x)) / pixelRatio, ((context.canvas.height / 2) + (factor * cell.seed.y)) / pixelRatio, Math.max(1, stipple.radius * 2), 0, Math.PI * 2);
                context.fill();

            }

            if(drawCentroids) {

                context.fillStyle = '#5cfcff';

                context.beginPath();
                context.arc(((context.canvas.width / 2) + (factor * cell.centroid.x)) / pixelRatio, ((context.canvas.height / 2) + (factor * cell.centroid.y)) / pixelRatio, 1, 0, Math.PI * 2);
                context.fill();

            }

        }

    });

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

export function drawWeightedVoronoiStipplingTextureOnExistingCanvasPixi(
    g : PIXI.Graphics,
    imageData: ImageData,
    imageToCanvasFactor: number,
    diagram: VoronoiDiagram,
    canvasWidth: number,
    canvasHeight: number,
    drawSeeds = true,
    drawCentroids = true,
    drawEdges = true,
    drawTriangulation = true,
    factor: number = 40
) {
    g.clear();
    drawWeightedVoronoiStipplingLinesInPIXI(g, imageData, imageToCanvasFactor, diagram, 1, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor, canvasWidth, canvasHeight);
}

function drawWeightedVoronoiStipplingLinesInPIXI(
    graphics: PIXI.Graphics,
    imageData: ImageData,
    imageToCanvasFactor: number,
    diagram: VoronoiDiagram,
    pixelRatio: number,
    drawSeeds: boolean,
    drawCentroids: boolean,
    drawEdges: boolean,
    drawTriangulation: boolean,
    factor: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    if (drawTriangulation) {
        graphics.lineStyle(1 / factor, 0xfae2e2); // Triangulation edges color
        diagram.triangulationEdges.forEach((edge: PolygonEdge) => {
            graphics.moveTo(
                (centerX + edge.start.x * factor) / pixelRatio,
                (centerY - edge.start.y * factor) / pixelRatio
            );
            graphics.lineTo(
                (centerX + edge.end.x * factor) / pixelRatio,
                (centerY - edge.end.y * factor) / pixelRatio
            );
        });
    }

    diagram.shapes.forEach((cell: VoronoiCell) => {
        if (cell.original) {
            const stipple = cell.getWeightedCentroidBasedOnImage(imageData, imageToCanvasFactor);

            if (drawEdges) {
                graphics.lineStyle(1 / factor, 0x000000); // Edges color
                cell.getEdges().forEach((edge: PolygonEdge) => {
                    graphics.moveTo(
                        (centerX + edge.start.x * factor) / pixelRatio,
                        (centerY - edge.start.y * factor) / pixelRatio
                    );
                    graphics.lineTo(
                        (centerX + edge.end.x * factor) / pixelRatio,
                        (centerY - edge.end.y * factor) / pixelRatio
                    );
                });
            }

            if (stipple && drawSeeds) {
                graphics.beginFill(stipple.color);
                graphics.drawCircle(
                    (centerX + cell.seed.x * factor) / pixelRatio,
                    (centerY - cell.seed.y * factor) / pixelRatio,
                    2 / pixelRatio
                );
                graphics.endFill();
            }

            if (drawCentroids) {
                graphics.beginFill(0x5cfcff); // Centroid color
                graphics.drawCircle(
                    (centerX + cell.centroid.x * factor) / pixelRatio,
                    (centerY - cell.centroid.y * factor) / pixelRatio,
                    2 / pixelRatio
                );
                graphics.endFill();
            }
        }
    });
}