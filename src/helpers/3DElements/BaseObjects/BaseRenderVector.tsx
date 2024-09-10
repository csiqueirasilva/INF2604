import { Html } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
import { ColorRepresentation } from "three";

interface BaseProps {
    name: string;
    origin: THREE.Vector3;
    color: string;
    showName: boolean;
    debug: boolean;
    value: THREE.Vector3;
}

export default function BaseRenderVector({ 
    name, 
    origin, 
    color, 
    showName, 
    debug, 
    value
}: BaseProps) {
    const vector1 = value;
    const vOrigin = origin;
    const dirvector = vector1.clone().sub(vOrigin);
    const labelPos = vOrigin.clone().add(dirvector.clone().multiplyScalar(0.5));

    return (
        <object3D>
            <arrowHelper
                args={[dirvector.clone().normalize(), vOrigin, dirvector.length(), color]}
            />
            {
                debug && 
                <arrowHelper
                    args={[labelPos.clone().normalize(), new THREE.Vector3(0, 0, 0), labelPos.length(), color]}
                />
            }
            {
                showName && 
                <Html position={labelPos.clone()}>
                    <div 
                        style={{ display: 'inline-block', whiteSpace: 'nowrap', color: color.toString() }} 
                        className={`${debug ? 'border-black border-[1px] border-solid' : ''} select-none p-[0px] font-roboto-bold`}>{ name }</div>
                </Html>
            }
        </object3D>
    );
}
