import { Point3 } from "@geometry/affine";
import { minSphere } from "@geometry/minsphere";
import { boundingSphereInCloud, findClosestPoints, findFarthestPoints, PolarReference } from "@geometry/topology";
import HighlightSprite from "@helpers/HighlightSprite";
import RenderPoint from "@helpers/RenderPoint";
import RenderVector from "@helpers/RenderVector";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/RNGRenderPointCloud";
import SegmentedLine from "@helpers/SegmentedLine";
import { Line, Sphere } from "@react-three/drei";
import { folder, useControls } from "leva";
import { useEffect, useState } from "react";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const [ minimumSphere, setMinimumSphere ] = useState<PolarReference|undefined>(undefined)
    const [ boundingSphere, setBoundingSphere ] = useState<PolarReference|undefined>(undefined)
    
    useEffect(() => {
        if(points.length > 0) {
            const bs = boundingSphereInCloud(points);
            setBoundingSphere(bs);
            const ms = minSphere(points);
            setMinimumSphere(ms);
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
    })

    return (
        <>
        {
            values['visivel-m'] && minimumSphere &&
            <group>
                <Sphere args={[minimumSphere.radius, 16, 16]} position={[minimumSphere.origin.x, minimumSphere.origin.y, minimumSphere.origin.z]}>
                    <meshBasicMaterial opacity={0.5} color={values['cor-m']} transparent depthWrite={false} depthTest={false} />
                </Sphere>
                <RenderPoint position={minimumSphere.origin.toVector3()} color={values['cor-m']} additionalLabel="centro esfera mínima" />
            </group>
        }
        {
            values['visivel-b'] && boundingSphere &&
            <group>
                <Sphere args={[boundingSphere.radius, 16, 16]} position={[boundingSphere.origin.x, boundingSphere.origin.y, boundingSphere.origin.z]}>
                    <meshBasicMaterial opacity={0.5} color={values['cor-b']} transparent depthWrite={false} depthTest={false} />
                </Sphere>
                <RenderPoint position={boundingSphere.origin.toVector3()} color={values['cor-b']} additionalLabel="centro bounding sphere" />
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