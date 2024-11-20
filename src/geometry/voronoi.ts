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
import { CompositionMode } from "@components/CanvasCompositionMode";
import { simulateHeatDiffusion } from "@components/heatdiffusion";
import { Rectangle } from "@geometry/quadtree";

export const VORONOI_DEFAULT_CANVAS_FACTOR = 40;

export enum VoronoiWeightMethod {
    FULL_WEIGHT = "full-weight",
    ZERO_WEIGHT = "zero-weight",
    SIMPLE_BRIGHTNESS = "simple-brightness",
    LUMINANCE = "luminance",
    ALPHA_PRIORITY = "alpha-priority",
    CONTRAST = "contrast",
    HUE = "hue",
    SATURATION = "saturation",
    DISTANCE_FROM_CENTER = "distance-from-center",
    INTENSITY = "intensity",
    GRADIENT_MAGNITUDE = "gradient-magnitude",
    SATURATION_AND_LUMINANCE = "saturation-and-luminance",
    ENTROPY = "entropy",
    RED_CHANNEL = "red-channel",
    GREEN_CHANNEL = "green-channel",
    BLUE_CHANNEL = "blue-channel",
    HEAT_DIFFUSION = "heat-diffusion"
}

function calculateVoronoiWeightByType(
    x : number, y : number, 
    r : number, g : number, b : number, a : number, 
    imageData : ImageData, 
    weightType : VoronoiWeightMethod = VoronoiWeightMethod.SIMPLE_BRIGHTNESS,
    heatmap : number[][]|undefined = undefined) {
    let ret = 0;
    switch (weightType) {
        case VoronoiWeightMethod.FULL_WEIGHT: {
            ret = 1;
            break;
        }
        case VoronoiWeightMethod.ZERO_WEIGHT: {
            ret = 0;
            break;
        }
        case VoronoiWeightMethod.SIMPLE_BRIGHTNESS: {
            const value = (r + g + b) / 3;
            ret = 1 - (value / 255);
            break;
        }
        case VoronoiWeightMethod.INTENSITY: {
            const intensity = (r + g + b) / 3;
            ret = intensity / 255;
            break;
        }
        case VoronoiWeightMethod.LUMINANCE: { 
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            ret = 1 - (luminance / 255);
            break;
        }
        case VoronoiWeightMethod.ALPHA_PRIORITY: { 
            ret = 1 - (a / 255);
            break;
        }
        case VoronoiWeightMethod.CONTRAST: {
            const contrast = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
            ret = contrast / 255;
            break;
        }
        case VoronoiWeightMethod.HUE: {
            const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * (r - g - b));
            ret = hue / (2 * Math.PI);
            break;
        }
        case VoronoiWeightMethod.SATURATION: {
            const maxVal = Math.max(r, g, b);
            const minVal = Math.min(r, g, b);
            const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;
            ret = saturation;
            break;
        }
        case VoronoiWeightMethod.DISTANCE_FROM_CENTER: {
            const centerX = imageData.width / 2;
            const centerY = imageData.height / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
            ret = distance / maxDistance;
            break;
        }
        case VoronoiWeightMethod.GRADIENT_MAGNITUDE: {
            const dx = Math.abs(r - g); // Example: Difference between two neighbors
            const dy = Math.abs(g - b);
            const gradient = Math.sqrt(dx ** 2 + dy ** 2);
            ret = gradient / 255;
            break;
        }
        case VoronoiWeightMethod.SATURATION_AND_LUMINANCE: {
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b);
            ret = 0.5 * (1 - luminance / 255) + 0.5 * saturation;
            break;
        }
        case VoronoiWeightMethod.ENTROPY: {
            ret = calculateLocalEntropy(x, y, imageData);
            break;
        }
        case VoronoiWeightMethod.RED_CHANNEL: {
            ret = r / 255;
            break;
        }
        case VoronoiWeightMethod.GREEN_CHANNEL: {
            ret = g / 255;
            break;
        }
        case VoronoiWeightMethod.BLUE_CHANNEL: {
            ret = b / 255;
            break;
        }
        case VoronoiWeightMethod.HEAT_DIFFUSION: {
            if(heatmap && typeof heatmap[y] !== "undefined" && typeof heatmap[y][x] !== "undefined") {
                const weight = heatmap[y][x];
                ret = Math.pow(1 - weight, 2);
            } else {
                ret = 0;
            }
            break;
        }
    }
    return ret;
}

function shouldDiscardWeightedVoronoiStipple(weight : number, alpha : number, threshold : number|undefined) : boolean {
    return alpha === 0 || (typeof threshold !== "undefined" && weight <= threshold);
}

const MAX_ENTROPY = 8;

function calculateLocalEntropy(x: number, y: number, imageData: ImageData): number {
    const neighborhoodSize = 3; // Size of the window (3x3)
    const halfSize = Math.floor(neighborhoodSize / 2);
    const grayscaleValues: number[] = [];
    const width = imageData.width;
    const height = imageData.height;

    // Extract the neighborhood
    for (let j = -halfSize; j <= halfSize; j++) {
        for (let i = -halfSize; i <= halfSize; i++) {
            const nx = x + i;
            const ny = y + j;

            // Skip out-of-bound pixels
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

            const { r, g, b } = getRGBAFromImageData(imageData, nx, ny);
            const grayscale = Math.round((r + g + b) / 3); // Convert to grayscale
            grayscaleValues.push(grayscale);
        }
    }

    // Calculate frequency of each grayscale value (bucketed by 16 levels)
    const bucketCount = 16; // Number of intensity buckets
    const histogram = new Array(bucketCount).fill(0);
    grayscaleValues.forEach(value => {
        const bucket = Math.floor((value / 255) * (bucketCount - 1)); // Map to bucket
        histogram[bucket]++;
    });

    // Calculate probabilities
    const totalPixels = grayscaleValues.length;
    const probabilities = histogram.map(count => count / totalPixels);

    // Calculate entropy
    let entropy = 0;
    probabilities.forEach(p => {
        if (p > 0) entropy -= p * Math.log2(p);
    });

    // Normalize entropy
    return entropy / MAX_ENTROPY; // Normalize to [0, 1]
}

export const CANVAS_VORONOI_PIXEL_RATIO = 2;
export const CANVAS_VORONOI_STIPPLE_SCALE = 2.25;

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

function getRGBAFromImageData(imageData : ImageData, x : number, y : number) : { r : number, g : number, b : number, a : number } {
    const index = (Math.min(y, imageData.height - 1) * imageData.width + Math.min(x, imageData.width - 1)) * 4;
    const r = imageData.data[index + 0];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const a = imageData.data[index + 3];
    return { r , g , b , a };
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

    public getWeightedCentroidBasedOnImage = (imageData : ImageData, factor : number, weightType : VoronoiWeightMethod = VoronoiWeightMethod.SIMPLE_BRIGHTNESS, discardThreshold: number|undefined = undefined, heatmap : undefined|number[][] = undefined): WeightedVoronoiStipple|null => {
        if(this.weightedCentroid) return this.weightedCentroid;
        const aspect = imageData.width / imageData.height;
        const factorX = factor;
        const factorY = factor / aspect;
        const coordX = this.seed.x;
        const coordY = this.seed.y;
        let p = fromVoronoiCanvasStipple(this.seed.x, this.seed.y, factorX, factorY, imageData.width, imageData.height);
        const { r, g, b, a } = getRGBAFromImageData(imageData, p.x, p.y);
        const stippleColor = new Color(r / 255, g / 255, b / 255);
        const weight = calculateVoronoiWeightByType(p.x, p.y, r, g, b, a, imageData, weightType, heatmap);
        const ret = shouldDiscardWeightedVoronoiStipple(weight, a, discardThreshold) ? null : new WeightedVoronoiStipple(coordX, coordY, weight, '#' + stippleColor.getHexString());
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
    public getWeightedVoronoiStipples = (imageData : ImageData, factor : number, weightType : VoronoiWeightMethod = VoronoiWeightMethod.SIMPLE_BRIGHTNESS, discardThreshold: number|undefined = undefined): Point3[] => {
        const ret: Point3[] = [];
        const aspect = imageData.width / imageData.height;
        const factorX = factor;
        const factorY = factor / aspect;
        const points = this.getSeeds().map(x => { 
            const p = fromVoronoiCanvasStipple(x.x, x.y, factorX, factorY, imageData.width, imageData.height)
            return [ p.x, p.y ];
        }) as ArrayLike<Point>;
        let heatmap : number[][]|undefined = undefined;
        if(weightType === VoronoiWeightMethod.HEAT_DIFFUSION) {
            heatmap = simulateHeatDiffusion(imageData, 10);
        }
        const delaunay = Delaunay.from(points);
        const centroids = new Array(this.shapes.length);
        for(let i = 0; i < centroids.length; i++) {
            centroids[i] = new Point3(0, 0, 0);
        }
        const weights = new Array(this.shapes.length).fill(0);
        let delaunayIndex = 0;
        for(let i = 0; i < imageData.width; i++) {
            for(let j = 0; j < imageData.height; j++) {
                const { r, g, b, a } = getRGBAFromImageData(imageData, i, j);
                const weight = calculateVoronoiWeightByType(i, j, r, g, b, a, imageData, weightType, heatmap);
                if(!shouldDiscardWeightedVoronoiStipple(weight, a, discardThreshold)) { 
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

export function drawWeightedVoronoiStipplingTextureOnExistingCanvas(
    canvas : HTMLCanvasElement, 
    ctx : CanvasRenderingContext2D, 
    imageData : ImageData, 
    imageToCanvasFactor : number, 
    diagram: VoronoiDiagram, 
    fillEdge = true, 
    drawSeeds = true, 
    drawCentroids = true, 
    drawEdges = true, 
    drawTriangulation = true, 
    factor: number = VORONOI_DEFAULT_CANVAS_FACTOR, 
    clear : boolean = true,
    minDotSize = 0.5,
    maxDotSize = 1.5,
    lineWidth = 1,
    coloredStipples = true,
    compositionMode : CompositionMode = CompositionMode.Darken,
    weightType : VoronoiWeightMethod = VoronoiWeightMethod.SIMPLE_BRIGHTNESS,
    discardThreshold : number|undefined = undefined,
    triangulationOpacity : number|undefined = 1,
    triangulationColor : string = "#ff0000",
    triangulationFill : boolean = false,
    triangulationSkipOpacity : number = 0.95,
    triangulationStroke : boolean = true
) {
    if (ctx) {
        const pixelRatio = CANVAS_VORONOI_PIXEL_RATIO;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if(clear) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawWeightedVoronoiStipplingLinesInCanvas(ctx, imageData, 
            imageToCanvasFactor, diagram, pixelRatio, 
            drawSeeds, drawCentroids, drawEdges, drawTriangulation, 
            factor, fillEdge, minDotSize, maxDotSize, lineWidth, coloredStipples, compositionMode, weightType, discardThreshold,
            triangulationOpacity, triangulationColor, triangulationFill, triangulationSkipOpacity, triangulationStroke);
    }
}

export function drawVoronoiTextureOnExistingCanvas(canvas : HTMLCanvasElement, diagram: VoronoiDiagram, drawSeeds = true, drawCentroids = true, drawEdges = true, drawTriangulation = true, factor: number = VORONOI_DEFAULT_CANVAS_FACTOR, clear : boolean = true) {
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const pixelRatio = CANVAS_VORONOI_PIXEL_RATIO;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if(clear) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawVoronoiLinesInCanvas(ctx, diagram, pixelRatio, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor);
    }
}

export function generateVoronoiTexture(diagram: VoronoiDiagram, width: number = 512, height: number = 512, drawSeeds = true, drawCentroids = true, drawEdges = true, drawTriangulation = true, factor: number = VORONOI_DEFAULT_CANVAS_FACTOR): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    drawVoronoiTextureOnExistingCanvas(canvas, diagram, drawSeeds, drawCentroids, drawEdges, drawTriangulation, factor);
    return canvas;
}

function drawGradientTriangleFromEdges(context : CanvasRenderingContext2D, imageData : ImageData, triangleEdges : [PolygonEdge,PolygonEdge,PolygonEdge], factor : number, imageToCanvasFactor : number, pixelRatio : number, shouldStroke : boolean = true, shouldFill : boolean = false, skipOpacityThreshold = 0.75) {
    const [edge1, edge2, edge3] = triangleEdges;

    const aspect = imageData.width / imageData.height;
    const factorX = imageToCanvasFactor;
    const factorY = imageToCanvasFactor / aspect;

    const pointA = fromVoronoiCanvasStipple(edge1.start.x, edge1.start.y, factorX, factorY, imageData.width, imageData.height);
    const pointB = fromVoronoiCanvasStipple(edge2.start.x, edge2.start.y, factorX, factorY, imageData.width, imageData.height);
    const pointC = fromVoronoiCanvasStipple(edge3.start.x, edge3.start.y, factorX, factorY, imageData.width, imageData.height);

    const barycenterColor = getRGBAFromImageData(imageData, Math.round((pointA.x + pointB.x + pointC.x) / 3), Math.round((pointA.y + pointB.y + pointC.y) / 3));

    if(barycenterColor.a <= (skipOpacityThreshold * 255)) {
        return;
    }
    
    context.beginPath();
    context.moveTo((context.canvas.width / 2 + (edge1.start.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge1.start.y * factor)) / pixelRatio);
    context.lineTo((context.canvas.width / 2 + (edge2.start.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge2.start.y * factor)) / pixelRatio);
    context.lineTo((context.canvas.width / 2 + (edge3.start.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge3.start.y * factor)) / pixelRatio);
    context.closePath();
    if(shouldStroke) {
        context.stroke();
    }
    if(shouldFill) {
        const colorA = getRGBAFromImageData(imageData, pointA.x, pointA.y);
        const colorB = getRGBAFromImageData(imageData, pointB.x, pointB.y);
        const colorC = getRGBAFromImageData(imageData, pointC.x, pointC.y);
        const averageColor = {
            r: Math.round((colorA.r + colorB.r + colorC.r) / 3),
            g: Math.round((colorA.g + colorB.g + colorC.g) / 3),
            b: Math.round((colorA.b + colorB.b + colorC.b) / 3),
            a: Math.round((colorA.a + colorB.a + colorC.a) / 3)
        };
        context.fillStyle = `rgba(${averageColor.r}, ${averageColor.g}, ${averageColor.b}, ${averageColor.a / 255})`;
        context.fill();
    }
}

function drawWeightedVoronoiStipplingLinesInCanvas(
    context: CanvasRenderingContext2D, 
    imageData : ImageData, 
    imageToCanvasFactor : number, 
    diagram: VoronoiDiagram, 
    pixelRatio: number, 
    drawSeeds: boolean, 
    drawCentroids : boolean, 
    drawEdges : boolean, 
    drawTriangulation : boolean, 
    factor: number, 
    fillEdge : boolean,
    minDotSize = 0.5,
    maxDotSize = 1.5,
    lineWidth = 1,
    coloredStipples = true,
    compositionMode : CompositionMode = CompositionMode.Darken,
    weightType : VoronoiWeightMethod = VoronoiWeightMethod.SIMPLE_BRIGHTNESS,
    discardThreshold : number|undefined = undefined,
    triangulationOpacity : number|undefined = 1,
    triangulationColor : string = "#ff0000",
    triangulationFill : boolean = false,
    triangulationSkipOpacity : number = 0.95,
    triangulationStroke : boolean = true
) {

    context.globalCompositeOperation = compositionMode;
    context.strokeStyle = 'black';
    context.lineWidth = lineWidth;
    context.fillStyle = 'black';

    if(drawTriangulation && triangulationOpacity > 0) {
        context.globalAlpha = triangulationOpacity;
        context.strokeStyle = triangulationColor;
        context.lineWidth = lineWidth;
        
        if(!triangulationFill) {
            
            if(triangulationStroke) {
                context.beginPath();
                diagram.triangulationEdges.forEach((edge) => {
                    context.moveTo((context.canvas.width / 2 + (edge.start.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge.start.y * factor)) / pixelRatio);
                    context.lineTo((context.canvas.width / 2 + (edge.end.x * factor)) / pixelRatio, (context.canvas.height / 2 + (edge.end.y * factor)) / pixelRatio);
                });
                context.stroke();
            }

        } else {

            for(let i = 0; i < diagram.triangulationEdges.length; i = i + 3) {
                const e1 = diagram.triangulationEdges[i];
                const e2 = diagram.triangulationEdges[i + 1];
                const e3 = diagram.triangulationEdges[i + 2];
                drawGradientTriangleFromEdges(context, imageData, [e1,e2,e3], factor, imageToCanvasFactor, pixelRatio, triangulationStroke, triangulationFill, triangulationSkipOpacity);
            }

        }

        context.globalAlpha = 1;
    }

    let heatmap : number[][]|undefined = undefined;
    if(weightType === VoronoiWeightMethod.HEAT_DIFFUSION) {
        heatmap = simulateHeatDiffusion(imageData, 10);
    }

    diagram.shapes.forEach((cell, idx) => {

        const stipple = cell.getWeightedCentroidBasedOnImage(imageData, imageToCanvasFactor, weightType, discardThreshold, heatmap);

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

                context.fillStyle = coloredStipples ? stipple.color : '#000000';
                context.beginPath();
                context.arc(((context.canvas.width / 2) + (factor * cell.seed.x)) / pixelRatio, ((context.canvas.height / 2) + (factor * cell.seed.y)) / pixelRatio, Math.max(minDotSize, stipple.radius * maxDotSize), 0, Math.PI * 2);
                context.fill();

            }

            if(drawCentroids) {

                context.fillStyle = '#5cfcff';

                context.beginPath();
                context.arc(((context.canvas.width / 2) + (factor * cell.centroid.x)) / pixelRatio, ((context.canvas.height / 2) + (factor * cell.centroid.y)) / pixelRatio, minDotSize, 0, Math.PI * 2);
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
    factor: number = VORONOI_DEFAULT_CANVAS_FACTOR
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