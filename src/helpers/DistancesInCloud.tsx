import { Point3 } from "@geometry/affine";
import { findClosestPoints, findFarthestPoints } from "@geometry/topology";
import HighlightSprite from "@helpers/HighlightSprite";
import RenderVector from "@helpers/RenderVector";
import RNGRenderPointCloud, { RenderPointCloudProps } from "@helpers/RNGRenderPointCloud";
import SegmentedLine from "@helpers/SegmentedLine";
import { Line } from "@react-three/drei";
import { useControls } from "leva";
import { useEffect, useState } from "react";

function InternalComponent({ points } : { points : Point3[] }) {
    
    const [ closestPoints, setClosestPoints ] = useState<Point3[]>([])
    const [ fartherstPoints, setFarthestPoints ] = useState<Point3[]>([])
    
    useEffect(() => {
        const closest = findClosestPoints(points);
        setClosestPoints(closest);
        if(points.length >= 4) {
            const furthest = findFarthestPoints(points);
            setFarthestPoints(furthest);
        } else {
            setFarthestPoints([]);
        }
    }, [ points ]);

    const values = useControls({
        'Pontos mais próximos': '#ff0000',
        'Pontos menos próximos': '#0000ff',
        'Marcar menor distância': true
    })

    return (
        <>
        {
            closestPoints.length === 2 && 
            <>
                {
                    values['Marcar menor distância'] && 
                    <HighlightSprite 
                        color={values['Pontos mais próximos']} 
                        position={closestPoints[0].medianPointTo(closestPoints[1]).toVector3()} />
                }
                <Line 
                    points={[ closestPoints[0].toVector3(), closestPoints[1].toVector3() ]} 
                    color={values['Pontos mais próximos']} 
                />
            </>
        }
        {
            fartherstPoints.length === 2 && 
            <Line 
                points={[ fartherstPoints[0].toVector3(), fartherstPoints[1].toVector3() ]} 
                color={values['Pontos menos próximos']} 
            />
        }
        </>
    )
}

interface Props extends RenderPointCloudProps {

}

export function DistancesInCloud(props : Props) {
    return (
        <RNGRenderPointCloud { ...props }>
            {
                (points) => <InternalComponent points={points} />
            }
        </RNGRenderPointCloud>
    )
}