import React from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createCircleBorderTexture } from '@helpers/canvas';

interface HighlightSpriteProps {
    position: THREE.Vector3;
    color?: THREE.ColorRepresentation;
    size?: number;
}

const HighlightSprite: React.FC<HighlightSpriteProps> = ({ position, color = 'yellow', size = 1 }) => {
    const spriteRef = React.useRef<THREE.Sprite>(null);

    const texture = React.useMemo(() => new THREE.CanvasTexture(createCircleBorderTexture(color)), [ color ]);

    return (
        <sprite ref={spriteRef} position={position} scale={[size, size, 1]}>
            <spriteMaterial map={texture} transparent />
        </sprite>
    );
};

export default HighlightSprite;