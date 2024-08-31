import { calcCircumcircle, calcCircumsphere, calcDiameter, minSphere } from "@geometry/minsphere";
import { Point3 } from "@geometry/points";
import { arePointsCollinear, arePointsCoplanar, boundingSphereInCloud, findClosestPoints, findExtremePoints, findFarthestPoints, PolarReference } from "@geometry/topology";
import HighlightSprite from "@helpers/HighlightSprite";
import RenderPoint from "@helpers/RenderPoint";
import RenderVector from "@helpers/RenderVector";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/RNGRenderPointCloud";
import { useSceneWithControlsContext } from "@helpers/SceneWithControlsContext";
import SegmentedLine from "@helpers/SegmentedLine";
import { Line, Sphere } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useEffect, useState } from "react";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const [ minimumSphere, setMinimumSphere ] = useState<PolarReference|undefined>(undefined)
    const [ boundingSphere, setBoundingSphere ] = useState<PolarReference|undefined>(undefined)
    const [ circumsphere, setCircumsphere ] = useState<PolarReference|undefined>(undefined)

    const ctx = useSceneWithControlsContext();

    useEffect(() => {
        if(points.length > 0) {
            try {
                ctx.setErrorMsg(undefined);
                const bs = boundingSphereInCloud(points);
                setBoundingSphere(bs);
                const ms = minSphere(points);
                setMinimumSphere(ms);
                const coplanar = arePointsCoplanar(points);
                const collinear = arePointsCollinear(points);
                if(collinear) {
                    const extremes = findExtremePoints(points);
                    const ms = calcDiameter(extremes[0], extremes[1]);
                    setCircumsphere(ms);
                } else if(coplanar && points.length === 3) {
                    const ms = calcCircumcircle(points[0], points[1], points[2]);
                    setCircumsphere(ms);
                } else if(!coplanar && points.length === 4) {
                    const ms = calcCircumsphere(points[0], points[1], points[2], points[3]);
                    setCircumsphere(ms);
                } else {
                    setCircumsphere(undefined);
                }
            } catch (error) {
                if(error instanceof Error) {
                    ctx.setErrorMsg(error.message);
                }
                setMinimumSphere(undefined);
                setBoundingSphere(undefined);
                setCircumsphere(undefined);
            }
        }
    }, [ points ]);

    const values = useControls({
        'Esfera mínima': folder({
            'cor-m': '#549fff',
            'visivel-m': true
        }),
        'Bounding sphere': folder({
            'cor-b': '#ff7676',
            'visivel-b': true
        }),
        'Circumsphere': folder({
            'cor-c': '#76ff76',
            'visivel-c': true
        })
    })

    return (
        <>
        {
            values['visivel-m'] && minimumSphere &&
            <group>
                <Sphere args={[minimumSphere.radius, 16, 16]} position={[minimumSphere.origin.x, minimumSphere.origin.y, minimumSphere.origin.z]}>
                    <meshBasicMaterial opacity={0.25} color={values['cor-m']} transparent depthWrite={false} depthTest={false} />
                </Sphere>
                <RenderPoint position={minimumSphere.origin.toVector3()} color={values['cor-m']} additionalLabel="centro esfera mínima" />
            </group>
        }
        {
            values['visivel-b'] && boundingSphere &&
            <group>
                <Sphere args={[boundingSphere.radius, 16, 16]} position={[boundingSphere.origin.x, boundingSphere.origin.y, boundingSphere.origin.z]}>
                    <meshBasicMaterial opacity={0.25} color={values['cor-b']} transparent depthWrite={false} depthTest={false} />
                </Sphere>
                <RenderPoint position={boundingSphere.origin.toVector3()} color={values['cor-b']} additionalLabel="centro bounding sphere" />
            </group>
        }
        {
            values['visivel-c'] && circumsphere &&
            <group>
                <Sphere args={[circumsphere.radius, 16, 16]} position={[circumsphere.origin.x, circumsphere.origin.y, circumsphere.origin.z]}>
                    <meshBasicMaterial opacity={0.25} color={values['cor-c']} transparent depthWrite={false} depthTest={false} />
                </Sphere>
                <RenderPoint position={circumsphere.origin.toVector3()} color={values['cor-c']} additionalLabel="centro circumsphere" />
            </group>
        }
        </>
    )
}

interface Props extends RenderPointCloudProps {
}

export function EsferaMinima(props : Props) {
    return (
        <RNGRenderPointCloud { ...props }>
            {
                (points) => <InternalComponent points={points} />
            }
        </RNGRenderPointCloud>
    )
}