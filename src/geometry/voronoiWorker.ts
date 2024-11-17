import { Point3 } from "@geometry/points";
import { voronoiDiagramFromD3Delaunay, voronoiDiagramFromD3DelaunayPlainObject } from "@geometry/voronoi";

self.onmessage = (event) => {
    const { points, width, height } : { points : [number, number][], width : number, height : number } = event.data;
    const result = voronoiDiagramFromD3DelaunayPlainObject(points, width, height);
    self.postMessage({ result });
};