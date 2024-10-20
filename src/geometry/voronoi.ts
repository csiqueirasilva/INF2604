import { delaunayTriangulation } from "@geometry/delaunay";
import { calcCircumcircle } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { centroidFromPoints } from "@geometry/topology";
import { Triangle } from "@geometry/triangle";
import { getDebugRandomColorBasicMaterial } from "@helpers/3DElements/Debug/debugVisualElements";
import { ConeGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";

export function voronoiWithCones(proposedPolygon: Point3[], name : string = "voronoi-cones"): Group {
    let ret = new Group();
    const triangles: Triangle[] = delaunayTriangulation(proposedPolygon, name);
    for(let triangle of triangles) {
        let circum = calcCircumcircle(triangle.points[0], triangle.points[1], triangle.points[2]);
        let cone = createCone(circum.origin.toVector3(), triangle.id);
        ret.add(cone);
    }
    return ret;
}

const CONE_RADIUS_3D = 1.5;
const CONE_HEIGHT_3D = 5;

function createCone(centroid: Vector3, idx : number = 0): Mesh {
    const geometry = new ConeGeometry(CONE_RADIUS_3D, CONE_HEIGHT_3D, 32);
    const material = getDebugRandomColorBasicMaterial(idx);
    const cone = new Mesh(geometry, material);
    cone.position.set(centroid.x, centroid.y, 0);
    cone.rotation.x = Math.PI / 2;
    return cone;
}