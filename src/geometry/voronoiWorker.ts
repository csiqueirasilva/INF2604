import { Point3 } from "@geometry/points";
import { voronoiDiagramFromD3Delaunay } from "@geometry/voronoi";

self.onmessage = (event) => {
    const { points, width, height } : { points : { x : number, y : number}[], width : number, height : number } = event.data;
    const rebuiltPoints = points.map(p => new Point3(p.x, p.y, 0));
    const result = voronoiDiagramFromD3Delaunay(rebuiltPoints, width, height).toPlainObject();
    self.postMessage({ result });
};