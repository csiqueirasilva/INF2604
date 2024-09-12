import { useThree, Vector3 } from "@react-three/fiber";
import * as THREE from "three";
import React, { useEffect, useRef, useState } from "react";
import { createCircleTexture } from "@helpers/canvas";
import { Html } from "@react-three/drei";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTrigger } from "@components/ui/dialog";
import { Button } from "@components/ui/button";

export interface PointProps {
    name?: string;
    position: THREE.Vector3;
    color?: THREE.ColorRepresentation;
    size?: number;
    additionalLabel?: string;
}

const RenderPoint: React.FC<PointProps> = ({ position, color = 'red', size = 0.1, additionalLabel = undefined, name = undefined }) => {
    const dotRef = useRef<THREE.Sprite>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (dotRef.current) {
            dotRef.current.scale.set(size, size, 1);
        }
    }, [ size ]);

    const spriteMaterial = new THREE.SpriteMaterial({
        color: color,
        map: new THREE.CanvasTexture(createCircleTexture(color)),
    });

    const handlePointerEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handlePointerLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 2000); // 2 seconds
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <group position={position}>
            <sprite
                ref={dotRef}
                material={spriteMaterial}
                onPointerOver={handlePointerEnter}
                onPointerOut={handlePointerLeave}
            />
            {isHovered && (
                <Html position={[ 0, 0, 0 ]}>
                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.5)',
                            margin: '5px 5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            pointerEvents: 'none',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                            zIndex: 10
                        }}
                    >   
                        {`${additionalLabel ? `${additionalLabel}: ` : ``}(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`}
                    </div>
                </Html>
            )}
            {name && (
                <Html position={[ 0, 0, 0 ]}>
                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.5)',
                            margin: '5px 5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            pointerEvents: 'none',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            userSelect: 'none'
                        }}
                    >   
                        {name}
                    </div>
                </Html>
            )}
        </group>
    )
};

export default RenderPoint