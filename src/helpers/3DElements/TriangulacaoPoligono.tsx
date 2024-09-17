import { calcCircumcircle, calcCircumsphere, calcDiameter, minSphere } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, boundingSphereInCloud, findClosestPoints, findExtremePoints, findFarthestPoints, PolarReference, quickHull, sortConvexPointsCCW } from "@geometry/topology";
import { earClippingTriangulation, Triangle } from "@geometry/polygon";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader from "@helpers/3DElements/PolygonLoader";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/3DElements/RNGRenderPointCloud";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { createSolidFromPoints } from "@helpers/ThreeUtils";
import { Line, Sphere } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useState } from "react";
import { BackSide, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, Line3, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial } from "three";
import { ConvexGeometry, Geometry } from "three-stdlib";
import { createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const ctx = useSceneWithControlsContext();
    const debugHelper = useDebugHelper();
    const [ triangles, setTriangles ] = useState<Triangle[]>([]);

    useEffect(() => {
        try {
            let t = earClippingTriangulation(points);
            setTriangles(t);
        } catch (e) {
            console.error(e)
        }
    }, [ points, ctx.viewType ]);

    

    const getRandomColor = () => {
        return new MeshBasicMaterial({ color: Math.random() * 0xffffff, side: DoubleSide });
    };

    return (
        <>
            {!debugHelper.controlValues[`earClipping-debugVisible`] && <primitive object={createDebugTriangulatedSurface(triangles)} />}
        </>
    )
}

interface Props extends RenderPointCloudProps {
}

export default function TriangulacaoPoligono(props : Props) {
    return (
        <PolygonLoader { ...props }>
            {
                (points) => <InternalComponent points={points} />
            }
        </PolygonLoader>
    )
}