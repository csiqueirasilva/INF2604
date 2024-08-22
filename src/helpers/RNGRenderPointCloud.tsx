import { Point3 } from "@geometry/affine";
import { findClosestPoints, findFarthestPoints, minimumSphereInCloud, PolarReference } from "@geometry/topology";
import BaseRenderPointCloud from "@helpers/BaseRenderPointCloud";
import { createCircleTexture } from "@helpers/canvas";
import RenderPoint from "@helpers/RenderPoint";
import RenderVector from "@helpers/RenderVector";
import { Line, Sphere } from "@react-three/drei";
import { button, useControls } from "leva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, ColorRepresentation, Group, SpriteMaterial } from "three";

interface RenderPointCloudProps {
    name: string;
    color?: ColorRepresentation;
    size?: number;
    minNumberOfPoints?: number;
    maxNumberOfPoints?: number;
    minZ?: number;
    maxZ?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}

const RNGRenderPointCloud: React.FC<RenderPointCloudProps> = ({ name, color = 'black', size = 0.1, minNumberOfPoints = 2, maxNumberOfPoints = 40, minZ = -5, maxZ = 5, minX = -5, maxX = 5, minY = -5, maxY = 5 }) => {

    const [points, setPoints] = useState<Point3[]>([]);
    const [nPoints, setNPoints] = useState<number>(2);
    const [closestPoints, setClosestPoints] = useState<Point3[]>([]);
    const [farthestPoints, setFarthestPoints] = useState<Point3[]>([]);
    const [minimumSphereRef, setMinimumSphereRef] = useState<PolarReference>();


    const [values, setControls] = useControls(`Núvem de pontos ${name}`, () => {
        const ret: any = {}
        ret['Gerar núvem de pontos'] = button((get) => setNPoints(Math.floor(minNumberOfPoints) + Math.floor(Math.random() * (maxNumberOfPoints - minNumberOfPoints))))
        ret['Pontos renderizados'] = { value: nPoints, min: minNumberOfPoints, max: maxNumberOfPoints, step: 1 };
        return ret;
    }, [ nPoints,  name, maxNumberOfPoints, minNumberOfPoints ]);

    useEffect(() => {
        setNPoints(values['Pontos renderizados']);
    }, [ values['Pontos renderizados'] ]);

    useEffect(() => {
        if (nPoints >= 0) {
            setControls({ 'Pontos renderizados': nPoints });
            const generatedPoints: Point3[] = [];

            for (let i = 0; i < nPoints; i++) {
                const x = Math.random() * (maxX - minX) + minX;
                const y = Math.random() * (maxY - minY) + minY;
                const z = Math.random() * (maxZ - minZ) + minZ;
                generatedPoints.push(new Point3(x, y, z));
            }

            setPoints(generatedPoints);
            const cp = findClosestPoints(generatedPoints);
            setClosestPoints(cp);
            const fp = findFarthestPoints(generatedPoints);
            setFarthestPoints(fp);
            const sr = minimumSphereInCloud(generatedPoints);
            setMinimumSphereRef(sr);
        }
    }, [nPoints, minX, maxX, minY, maxY, minZ, maxZ]);

    return (
        <>
            {
                minimumSphereRef &&
                <group>
                    <Sphere args={[minimumSphereRef.radius, 16, 16]} position={[minimumSphereRef.origin.x, minimumSphereRef.origin.y, minimumSphereRef.origin.z]}>
                        <meshBasicMaterial opacity={0.5} color="rgba(255, 255, 255)" transparent wireframe />
                    </Sphere>
                    <RenderPoint position={minimumSphereRef.origin.toVector3()} color="green" additionalLabel="centro" />
                    {
                        minimumSphereRef.debugSteps.map((( debug, idx ) => 
                            <RenderVector key={idx} name={`Step-${idx}`} origin={debug.center.toVector3()} value={debug.furtherstPoint.toVector3()} />
                        ))
                    }
                </group>
            }
            {
                closestPoints.length === 2 &&
                <Line
                    points={closestPoints.map(point => [ point.x, point.y, point.z ])}
                    color="blue"
                    lineWidth={1}
                />
            }
            {
                farthestPoints.length === 2 &&
                <Line
                    points={farthestPoints.map(point => [ point.x, point.y, point.z ])}
                    color="red"
                    lineWidth={1}
                />
            }
            <BaseRenderPointCloud points={points.map((v, idx) => ({ 
                position: v.toVector3(),
                name: `${idx}`
            })) } color={color} size={size} />
        </>
    );
};

export default RNGRenderPointCloud;
