import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Dialog, DialogContent, DialogOverlay, DialogTrigger } from "@components/ui/dialog";
import { Button } from "@components/ui/button";

export interface InstancedRenderedPointProps {
    points: THREE.Vector3[];
    color?: THREE.ColorRepresentation;
    size?: number;
}

const InstancedRenderedPoint: React.FC<InstancedRenderedPointProps> = ({ points, color = 'red', size = 0.1 }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { camera } = useThree();

    useEffect(() => {
        if (meshRef.current) {
            const matrix = new THREE.Matrix4();
            points.forEach((point, i) => {
                matrix.setPosition(point.x, point.y, point.z);
                meshRef.current!.setMatrixAt(i, matrix);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [points]);

    useFrame(() => {
        if (meshRef.current) {
            const tempObject = new THREE.Object3D();
            for (let i = 0; i < points.length; i++) {
                tempObject.position.set(points[i].x, points[i].y, points[i].z);
                tempObject.lookAt(camera.position);
                tempObject.updateMatrix();
                meshRef.current!.setMatrixAt(i, tempObject.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial color={color} />
        </instancedMesh>
    );
};

export default InstancedRenderedPoint;
