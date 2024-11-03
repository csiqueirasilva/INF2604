import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { PolarReference } from "@geometry/topology";

export class BoundingBox2d {
    public minX : number = 0;
    public minY : number = 0;
    public maxX : number = 0;
    public maxY : number = 0;
}

export class PolygonEdge {
    public start : Point3 = new Point3()
    public end : Point3 = new Point3() 
    public isEqual (other : PolygonEdge) : boolean {
        return (other.start.equals(this.start) && other.end.equals(this.end)) || 
        (other.start.equals(this.end) && other.end.equals(this.start));
    }
    public equals (other : PolygonEdge) : boolean {
        return this.isEqual(other);
    }
    constructor(start: Point3 = new Point3(), end: Point3 = new Point3()) {
        this.start = start;
        this.end = end;
    }
    public connectsTo (possibility : Point3) : Point3|null {
        let ret : Point3|null = null;
        if(this.start.equals(possibility)) {
            ret = this.end;
        }
        if(this.end.equals(possibility)) {
            ret = this.start;
        }
        return ret;
    }
}

let POLYGON_SEQUENCE = 0;

export abstract class PolygonShape {

    id : number = ++POLYGON_SEQUENCE; 

    points: readonly Point3[] = []

    constructor(points : Point3[]) {
        this.points = points;
    }

    public abstract getEdges(): PolygonEdge[];

    sharesEdgeWith(other: PolygonShape): boolean {
        const thisEdges = this.getEdges();
        const otherEdges = other.getEdges();
        for (const thisEdge of thisEdges) {
            for (const otherEdge of otherEdges) {
                if (thisEdge.isEqual(otherEdge)) {
                    return true;
                }
            }
        }
        return false;
    }

    getEdgeIndex(edge: PolygonEdge): number {
        let ret = -1;
        
        if(edge && this.points.length > 1) {
            for (let i = 0; i < this.points.length; i++) {
                let nextIndex = (i + 1) % this.points.length;
                let polygonEdge = new PolygonEdge(this.points[i], this.points[nextIndex]);
                if (edge.isEqual(polygonEdge)) {
                    ret = i;
                    break;
                }
            }
        }
    
        return ret;
    }

    public isPointInside(x : number, y : number) {
        let inside = false;
        const polygon = this.points;
        const n = this.points.length;
    
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
    
            const intersect = ((yi > y) !== (yj > y)) &&
                              (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    
        return inside;
    }

    public getBoundingBox() : BoundingBox2d {
        const xs = this.points.map(point => point.x);
        const ys = this.points.map(point => point.y);
        
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    }
    

}

export class Triangle extends PolygonShape {
    constructor(points : [Point3, Point3, Point3]) {
        super(points)
    }

    public getEdges() : [PolygonEdge,PolygonEdge,PolygonEdge] {
        return [
            new PolygonEdge(this.points[0], this.points[1]),
            new PolygonEdge(this.points[1], this.points[2]),
            new PolygonEdge(this.points[2], this.points[0])
        ];
    }

    public calcCircumcircle() : PolarReference {
        let calc = calcCircumcircle(this.points[0], this.points[1], this.points[2]);
        return calc;
    }
}