import { calcCircumcircle, calcCircumsphere, calcDiameter, minSphere } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, boundingSphereInCloud, findClosestPoints, findExtremePoints, findFarthestPoints, PolarReference, quickHull } from "@geometry/topology";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/3DElements/RNGRenderPointCloud";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { Line, Sphere } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useState } from "react";
import { Color, Line3, LineBasicMaterial, LineSegments } from "three";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const [ hullPoints, setHullPoints ] = useState<Point3[]>([])

    const ctx = useSceneWithControlsContext();

    useEffect(() => {
        try {
            const hp = quickHull(points);
            setHullPoints(hp)
            console.log(hp)
        } catch (e) {
            console.log(e)
        }
    }, [ points ]);

    // const values = useControls({
    //     'Esfera mínima': folder({
    //         'cor-m': '#549fff',
    //         'visivel-m': true
    //     }),
    //     'Bounding sphere': folder({
    //         'cor-b': '#ff7676',
    //         'visivel-b': true
    //     }),
    //     'Circumsphere': folder({
    //         'cor-c': '#76ff76',
    //         'visivel-c': true
    //     })
    // })

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

    return (
        <>
            {
                hullPoints.length >= 2 &&
                <Line 
                    points={hullPoints.map(x => x.toVector3()).concat([ hullPoints[0].toVector3() ]) } 
                    lineWidth={2} 
                    vertexColors={colors} />
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