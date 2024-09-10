import { calcCircumcircle, calcCircumsphere, calcDiameter, minSphere } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, boundingSphereInCloud, findClosestPoints, findExtremePoints, findFarthestPoints, PolarReference, quickHull } from "@geometry/topology";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/3DElements/RNGRenderPointCloud";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { createSolidFromPoints } from "@helpers/ThreeUtils";
import { Line, Sphere } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useState } from "react";
import { BackSide, Color, FrontSide, Line3, LineBasicMaterial, LineSegments, Mesh } from "three";
import { ConvexGeometry, Geometry } from "three-stdlib";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const [ hullPoints, setHullPoints ] = useState<Point3[]>([])
    const [ coplanar, setCoplanar ] = useState(false);

    const ctx = useSceneWithControlsContext();

    useEffect(() => {
        try {
            const hp = quickHull(points);
            setHullPoints(hp)
            setCoplanar(arePointsCoplanar(hp));
        } catch (e) {
            console.log(e)
        }
    }, [ points, ctx.viewType ]);

    const colors = useMemo(() => {
        const colorArray : Color[] = [];
        const startColor = new Color(0xff00ff); // magenta
        const endColor = new Color(0xffff00); // yellow
    
        hullPoints.forEach((_, index, array) => {
          const color = startColor.clone().lerp(endColor, index / (array.length - 1));
          colorArray.push(new Color(color.r, color.g, color.b));
        });

        colorArray.push(new Color(0x00ffff));
    
        return colorArray;
      }, [hullPoints]);

    const renderPoints = hullPoints.map(x => x.toVector3());

    return (
        <>
            {
                hullPoints.length >= 2 && 
                (
                    coplanar ?
                    <Line 
                        points={renderPoints.concat([ hullPoints[0].toVector3() ])} 
                        lineWidth={2} 
                        vertexColors={colors} /> :
                    <mesh geometry={new ConvexGeometry(renderPoints)}>
                        <meshBasicMaterial color={0x00ff00} opacity={0.5} transparent side={BackSide} />
                    </mesh>
                )
            }
        </>
    )
}

interface Props extends RenderPointCloudProps {
}

export default function FechoConvexo(props : Props) {
    return (
        <RNGRenderPointCloud { ...props }>
            {
                (points) => <InternalComponent points={points} />
            }
        </RNGRenderPointCloud>
    )
}