import { calcCircumcircle, calcCircumsphere, calcDiameter, minSphere } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, boundingSphereInCloud, findClosestPoints, findExtremePoints, findFarthestPoints, PolarReference, quickHull } from "@geometry/topology";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader from "@helpers/3DElements/PolygonLoader";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/3DElements/RNGRenderPointCloud";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { createSolidFromPoints } from "@helpers/ThreeUtils";
import { Line, Sphere } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useState } from "react";
import { BackSide, Color, FrontSide, Line3, LineBasicMaterial, LineSegments, Mesh } from "three";
import { ConvexGeometry, Geometry } from "three-stdlib";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const ctx = useSceneWithControlsContext();
    const debugHelper = useDebugHelper();

    useEffect(() => {
        try {

        } catch (e) {
            console.log(e)
        }
    }, [ points, ctx.viewType ]);

//    const renderPoints = hullPoints.map(x => x.toVector3());

    return (
        <>
            {
                // hullPoints.length >= 2 && 
                // (
                //     coplanar ? (
                //         !debugHelper.controlValues["QuickHull-debugVisible"] &&
                //         <Line 
                //             points={renderPoints} 
                //             lineWidth={2} 
                //             vertexColors={colors} /> 
                //     ) :
                //     <mesh geometry={new ConvexGeometry(renderPoints)}>
                //         <meshBasicMaterial color={0x00ff00} opacity={0.5} transparent side={BackSide} />
                //     </mesh>
                // )
            }
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