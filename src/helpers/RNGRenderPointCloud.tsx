import { Point3 } from "@geometry/affine";
import { generateRNGPointCloudBasedOnStrategy, PointGenerationType } from "@geometry/points";
import { PolarReference } from "@geometry/topology";
import BaseRenderPointCloud from "@helpers/BaseRenderPointCloud";
import InstancedRenderedPoint from "@helpers/InstancedRenderedPoint";
import RenderPoint from "@helpers/RenderPoint";
import RenderVector from "@helpers/RenderVector";
import { getRandomColorHex } from "@helpers/RNGUtils";
import { useSceneWithControlsContext, VIEW_TYPE } from "@helpers/SceneWithControlsContext";
import { useValidColorHex } from "@helpers/useValidColorHex";
import { Line, Sphere } from "@react-three/drei";
import { button, useControls } from "leva";
import React, { useCallback, useEffect, useState } from "react";
import { Color, ColorRepresentation } from "three";

export interface RenderPointCloudProps {
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
    children?: (points : Point3[]) => React.ReactNode;
}

const RNGRenderPointCloud: React.FC<RenderPointCloudProps> = ({ 
        name, 
        color = undefined, 
        size = 0.05, 
        minNumberOfPoints = 1000, 
        maxNumberOfPoints = 20000, 
        minZ = -5, 
        maxZ = 5, 
        minX = -5, 
        maxX = 5, 
        minY = -5, 
        maxY = 5,
        children = undefined
    }) => {

    if (!color) {
        color = getRandomColorHex();
    } else if (color instanceof Color) {
        color = `#` + color.getHexString();
    }

    const startColor = useValidColorHex(color);

    const camera = {  }
    const ctx = useSceneWithControlsContext();

    const [usedColor, setUsedColor] = useState<string>(startColor);
    const [points, setPoints] = useState<Point3[]>([]);
    const [nPoints, setNPoints] = useState<number>(2);
    const [closestPoints, setClosestPoints] = useState<Point3[]>([]);
    const [farthestPoints, setFarthestPoints] = useState<Point3[]>([]);
    const [minimumSphereRef, setMinimumSphereRef] = useState<PolarReference>();
    const [rngType, setRNGType] = useState<PointGenerationType>(PointGenerationType.RANDOM_BRUTE_FORCE);

    const [values, setControls] = useControls(`Núvem de pontos ${name}`, () => {
        const ret: any = {}
        ret['Gerar núvem de pontos'] = button((get) => {
            genPoints();
        })
        ret['Pontos renderizados'] = { value: nPoints, min: minNumberOfPoints, max: maxNumberOfPoints, step: 1 };
        ret['Tipo RNG'] = { value: rngType, options: Object.values(PointGenerationType) };
        ret['Cor'] = { value: startColor };
        ret['Randomizar pontos'] = button((get) => {
            setControls({ 'Pontos renderizados': Math.floor(minNumberOfPoints) + Math.floor(Math.random() * (maxNumberOfPoints - minNumberOfPoints)) });
        })
        return ret;
    }, [ nPoints, name, maxNumberOfPoints, minNumberOfPoints, startColor, rngType, usedColor, ctx.viewType ]);

    const genPoints = useCallback(() => {
        if(nPoints >= 0) {
            const generatedPoints: Point3[] = generateRNGPointCloudBasedOnStrategy(nPoints, values['Tipo RNG'], maxX, minX, maxY, minY, ctx.viewType === VIEW_TYPE.PLANE_XY ? 0 : maxZ, ctx.viewType === VIEW_TYPE.PLANE_XY ? 0 : minZ);
            setPoints(generatedPoints);
        }
    }, [ nPoints, values['Tipo RNG'], maxX, minX, maxY, minY, maxZ, minZ, ctx.viewType ]);

    useEffect(() => {
        setNPoints(values['Pontos renderizados']);
    }, [ values['Pontos renderizados'] ]);

    useEffect(() => {
        genPoints();
    }, [values['Tipo RNG'], nPoints, minX, maxX, minY, maxY, minZ, maxZ]);

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
                children instanceof Function && children(points)
            }
            <InstancedRenderedPoint points={points.map(x => x.toVector3())} color={values['Cor'] || 'black'} size={size} />
            {/* <BaseRenderPointCloud points={points.map((v, idx) => ({ 
                position: v.toVector3(),
                name: `${idx}`
            })) } color={color} size={size} /> */}
        </>
    );
};

export default RNGRenderPointCloud;