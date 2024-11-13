import { Point3 } from "@geometry/points";
import { BoundingBox2d, PolygonShape, Triangle } from "@geometry/triangle";

export class Rectangle {
    constructor(
        public x: number, // Center x
        public y: number, // Center y
        public width: number, // Half width
        public height: number // Half height
    ) {}

    // Check if a point is within this rectangle
    contains(point: Point3): boolean {
        return (
            point.x >= this.x - this.width &&
            point.x <= this.x + this.width &&
            point.y >= this.y - this.height &&
            point.y <= this.y + this.height
        );
    }

    // Check if this rectangle intersects with another rectangle
    intersects(other: Rectangle): boolean {
        return !(
            other.x - other.width > this.x + this.width ||
            other.x + other.width < this.x - this.width ||
            other.y - other.height > this.y + this.height ||
            other.y + other.height < this.y - this.height
        );
    }

    // Check if this rectangle intersects with a BoundingBox2d
    intersectsBoundingBox(bbox: BoundingBox2d): boolean {
        const rectMinX = this.x - this.width;
        const rectMaxX = this.x + this.width;
        const rectMinY = this.y - this.height;
        const rectMaxY = this.y + this.height;

        return !(
            bbox.minX > rectMaxX ||
            bbox.maxX < rectMinX ||
            bbox.minY > rectMaxY ||
            bbox.maxY < rectMinY
        );
    }
}

export class Quadtree<T extends PolygonShape> {
    private shapes: { shape: T; active: boolean }[] = [];
    private divided = false;
    private northeast: Quadtree<T> | null = null;
    private northwest: Quadtree<T> | null = null;
    private southeast: Quadtree<T> | null = null;
    private southwest: Quadtree<T> | null = null;

    constructor(private boundary: Rectangle, private capacity: number) {}

    markShapeAsRemoved(shape: T) {
        const shapeEntry = this.shapes.find(entry => entry.shape === shape);
        if (shapeEntry) {
            shapeEntry.active = false;
        }
    }

    subdivide() {
        const { x, y, width, height } = this.boundary;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        this.northeast = new Quadtree<T>(new Rectangle(x + halfWidth, y - halfHeight, halfWidth, halfHeight), this.capacity);
        this.northwest = new Quadtree<T>(new Rectangle(x - halfWidth, y - halfHeight, halfWidth, halfHeight), this.capacity);
        this.southeast = new Quadtree<T>(new Rectangle(x + halfWidth, y + halfHeight, halfWidth, halfHeight), this.capacity);
        this.southwest = new Quadtree<T>(new Rectangle(x - halfWidth, y + halfHeight, halfWidth, halfHeight), this.capacity);

        this.divided = true;
    }

    insert(shape: T): boolean {
        const boundingBox = shape.getBoundingBox();

        if (!this.boundary.intersectsBoundingBox(boundingBox)) {
            return false;
        }

        if (this.shapes.length < this.capacity) {
            this.shapes.push({ shape, active: true });
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        return (
            this.northeast!.insert(shape) ||
            this.northwest!.insert(shape) ||
            this.southeast!.insert(shape) ||
            this.southwest!.insert(shape)
        );
    }

    query(range: Rectangle, found: T[] = []): T[] {
        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (const { shape, active } of this.shapes) {
            if (active && range.intersectsBoundingBox(shape.getBoundingBox())) {
                found.push(shape);
            }
        }

        if (this.divided) {
            this.northeast!.query(range, found);
            this.northwest!.query(range, found);
            this.southeast!.query(range, found);
            this.southwest!.query(range, found);
        }

        return found;
    }

    clearInactiveShapes() {
        this.shapes = this.shapes.filter(entry => entry.active);
        
        if (this.divided) {
            this.northeast!.clearInactiveShapes();
            this.northwest!.clearInactiveShapes();
            this.southeast!.clearInactiveShapes();
            this.southwest!.clearInactiveShapes();
        }
    }
}