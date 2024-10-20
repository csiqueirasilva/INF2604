import { Point3 } from "@geometry/points";
import { Triangle, PolygonEdge, PolygonShape } from "@geometry/triangle";

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

    private getHalfEdges(): HalfEdgeForDualGraph<T>[] {
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

}

export class DualGraph<T extends PolygonShape> {
    public nodes : DualGraphNode<T>[] = [];
    public shapes : T[] = [];

    constructor(shapes : T[]) {
        for(const t of shapes) {
            const node = new DualGraphNode<T>(this, t);
            let i = 0;
            for(const n of this.nodes) {
                if(n.connect(node) && ++i >= 3) {
                    break;
                }
            }
            this.nodes.push(node);
        }
        this.shapes = shapes;
    }

    public getShapes() : PolygonShape[] {
        const arr = Array.from(this.nodes);
        return arr.map(x => x.shape);
    }

    public getTraversalOrdered() : DualGraphNode<T>[] {
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
        if(nodes.length > 0) {
            recHelper(nodes[0]);
        }
        return visited;
    }

}