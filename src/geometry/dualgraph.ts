import { Point3 } from "@geometry/points";
import { Quadtree, Rectangle } from "@geometry/quadtree";
import { Triangle, PolygonEdge, PolygonShape, BoundingBox2d } from "@geometry/triangle";
import RBush from "rbush";

let ID_SEQUENCE = 0;

export class HalfEdge<T extends DualGraphNode<PolygonShape>> {
    public id : number;
    public next: this | null = null;    
    public twin: this | null = null;    
    public vertex: Point3;                  
    public node: T;  

    constructor(vertex: Point3, parentNode: T) {
        this.vertex = vertex;
        this.node = parentNode;
        this.id = ++ID_SEQUENCE;
    }
    
    public getIndex(): number {
        let ret = -1;
        if(this.next) {
            const pe = new PolygonEdge(this.vertex, this.next!.vertex);
            ret = this.node.shape.getEdgeIndex(pe);
        }
        return ret;
    }

    public findNextWithout(...notToBePoints : Point3[]) : HalfEdge<T> {
        let ref : HalfEdge<T> = this;
        let found : HalfEdge<T> = this;
        do {
            if(ref && !notToBePoints.some(p => p.equals(ref!.vertex))) {
                found = ref;
                break;
            }
            if(!ref.next) {
                console.warn(`Error: no next halfedge detected! The shape is wrong...`);
                break;
            }
            ref = ref.next; 
        } while (ref !== this);
    
        return found;
    }

    public findNextWith(...toBePoints : Point3[]) : HalfEdge<T> {
        let ref : HalfEdge<T> = this;
        let found : HalfEdge<T> = this;
        do {
            if(ref && toBePoints.some(p => p.equals(ref!.vertex))) {
                found = ref;
                break;
            }
            if(!ref.next) {
                console.warn(`Error: no next halfedge detected! The shape is wrong...`);
                break;
            }
            ref = ref.next; 
        } while (ref !== this);
    
        return found;
    }
}

export class HalfEdgeForDualGraph<T extends PolygonShape> extends HalfEdge<DualGraphNode<T>> {
    public parentGraph : DualGraph<T>
    
    constructor(parentGraph : DualGraph<T>, vertex: Point3, parentNode: DualGraphNode<T>) {
        super(vertex, parentNode);
        this.parentGraph = parentGraph;
    }
}

export class DualGraphNode<T extends PolygonShape> {

    public shape : T;
    public center : Point3 = new Point3();
    public firstHalfEdge: HalfEdgeForDualGraph<T>;
    public parentGraph : DualGraph<T>;

    constructor(parentGraph : DualGraph<T>, shape : T) {
        this.parentGraph = parentGraph;
        this.shape = shape;
        this.center = Point3.centroid([ ...shape.points ]);
        this.firstHalfEdge = this.buildHalfEdges();
    }

    public connect(node : DualGraphNode<T>) : boolean {
        let ret = false;
        if(this.shape.sharesEdgeWith(node.shape)) {
            this.linkHalfEdges(node);
            ret = true;
        }
        return ret;
    }

    private buildHalfEdges() : HalfEdgeForDualGraph<T> {
        
        const points = [ ...this.shape.points ];

        let firstEdge: HalfEdgeForDualGraph<T> | null = null;
        let prevEdge: HalfEdgeForDualGraph<T> | null = null;

        // todo: throw error if points.length === 0

        for (let i = 0; i < points.length; i++) {
            const edge = new HalfEdgeForDualGraph<T>(this.parentGraph, points[i], this);

            if (prevEdge) {
                prevEdge.next = edge;
            }

            if (!firstEdge) {
                firstEdge = edge;
            }

            prevEdge = edge;
        }

        if (prevEdge && firstEdge) {
            prevEdge.next = firstEdge;
        }

        return firstEdge as HalfEdgeForDualGraph<T>;
    }

    private linkHalfEdges(node: DualGraphNode<T>) {
        if (!this.firstHalfEdge || !node.firstHalfEdge) return;

        const thisEdges = this.getHalfEdges();
        const otherEdges = node.getHalfEdges();

        for (const thisEdge of thisEdges) {
            for (const otherEdge of otherEdges) {
                // check if thisedge is the beginning of otheredge or if thisedge is the end of otheredge
                if (otherEdge.next && thisEdge.vertex.equals(otherEdge.next?.vertex) && thisEdge.next?.vertex.equals(otherEdge.vertex)) {
                    thisEdge.twin = otherEdge;
                    otherEdge.twin = thisEdge;
                }
            }
        }
    }

    public getHalfEdges(): HalfEdgeForDualGraph<T>[] {
        const edges: HalfEdgeForDualGraph<T>[] = [];
        let edge : HalfEdgeForDualGraph<T> | null = this.firstHalfEdge;

        do {
            if (edge) {
                edges.push(edge);
                edge = edge.next;
            }
        } while (edge && edge !== this.firstHalfEdge);

        return edges;
    }

    public findHalfEdgeWithVertex(p : Point3) : HalfEdgeForDualGraph<T> {
        const hes = this.getHalfEdges();
        const he = hes.find(x => x.vertex.equals(p));
        if(!he) {
            throw new Error(`Half-edge for point ${p.toString()} not found`);
        }
        return he;
    }

}

const DEFAULT_RADIUS_SCALING = 1;

class MyRBush<T extends PolygonShape> extends RBush<T> {
    toBBox(a : T) { return a.getBoundingBox(); }
    compareMinX(a : any, b : any) { return a.x - b.x; }
    compareMinY(a : any, b : any) { return a.y - b.y; }
}

export class DualGraph<T extends PolygonShape> {
    public nodes : DualGraphNode<T>[] = [];
    public shapes : T[] = [];
    private tree: MyRBush<T>;

    constructor(shapes : T[]) {
        this.tree = new MyRBush<T>();
        for(const t of shapes) {
            this.addShape(t);
        }
    }

    public getShapes() : PolygonShape[] {
        const arr = Array.from(this.nodes);
        return arr.map(x => x.shape);
    }

    public getTraversalOrdered(startingIdx : number = 0) : DualGraphNode<T>[] {
        const visited : DualGraphNode<T>[] = [];
        const nodes = Array.from(this.nodes);
        function recHelper(node : DualGraphNode<T>) {
            visited.push(node);
            let edge : HalfEdgeForDualGraph<T> | null = node.firstHalfEdge;
            do {
                if(edge.twin?.node && !visited.includes(edge.twin?.node)) {
                    recHelper(edge.twin.node);
                }
                edge = edge.next;
            } while (edge && edge !== node.firstHalfEdge);
        }
        if(nodes.length > startingIdx) {
            recHelper(nodes[startingIdx]);
        }
        return visited;
    }

    public addShape(shape : T) : DualGraphNode<T> {
        const node = new DualGraphNode<T>(this, shape);
        let i = 0;
        let edges = shape.getEdges();
        for(const n of this.nodes) {
            if(n.connect(node) && ++i >= edges.length) {
                break;
            }
        }
        this.tree.insert(shape);
        this.nodes.push(node);
        this.shapes.push(shape);
        return node;
    }

    public clearInactiveQuadtreeShapes() {
        this.tree.clear();
    }

    public queryNearbyShapes(point: Point3, radiusScaling = DEFAULT_RADIUS_SCALING): T[] {
        const rangeSizeX = Math.abs(point.x * radiusScaling);
        const rangeSizeY = Math.abs(point.y * radiusScaling);
        const range = new BoundingBox2d(-rangeSizeX, -rangeSizeY, rangeSizeX, rangeSizeY);
        return this.tree.search(range);
    }

    public removeShape(shape : T) {
        const shapeIdx = this.shapes.indexOf(shape);
        if(shapeIdx !== -1) {
            const node = this.nodes.find(node => node.shape === shape);
            if(node) {
                const nodeIdx = this.nodes.indexOf(node);
                let edge : HalfEdgeForDualGraph<T> | null = node.firstHalfEdge;
                do {
                    if(edge.twin) {
                        edge.twin.twin = null;
                    }
                    edge = edge.next;
                } while (edge && edge !== node.firstHalfEdge);
                this.nodes.splice(nodeIdx, 1);
                this.shapes.splice(shapeIdx, 1);
                this.tree.remove(shape);
            }
        }
    }

    public findNodeByShape(shape : T) : DualGraphNode<T> {
        let ret = this.nodes.find(n => n.shape === shape);
        if(!ret) {
            throw new Error(`Shape ${shape.id} not found in graph`);
        }
        return ret;
    }

}