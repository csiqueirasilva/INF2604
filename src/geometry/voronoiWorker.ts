import { Point3 } from "@geometry/points";
import { voronoiDiagramFromD3Delaunay, voronoiDiagramFromD3DelaunayPlainObject, VoronoiWeightMethod } from "@geometry/voronoi";

export interface VoronoiWorkerObject { 
    points : [number, number][], 
    width : number, 
    height : number
}

self.onmessage = (event) => {
    const { points, width, height } : VoronoiWorkerObject = event.data;
    const result = voronoiDiagramFromD3DelaunayPlainObject(points, width, height);
    self.postMessage({ result });
};