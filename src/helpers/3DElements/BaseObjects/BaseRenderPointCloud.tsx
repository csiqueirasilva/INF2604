import { createCircleTexture } from "@helpers/canvas";
import { useMemo, useState, useRef, useEffect } from "react";
import { CanvasTexture, ColorRepresentation, SpriteMaterial, Vector3 } from "three";
import { Html } from "@react-three/drei"; // For displaying the tooltip
import RenderPoint, { PointProps } from "@helpers/3DElements/RenderPoint";

interface RenderPointCloudProps {
    points: PointProps[];
    color?: ColorRepresentation;
    size?: number;
}

const BaseRenderPointCloud: React.FC<RenderPointCloudProps> = ({ points, color = 'black', size = 0.1 }) => {
    const pointsPositions = useMemo(() => {
        return points.map(point => point.position);
    }, [points]);

    return (
        <>
            {pointsPositions.map((position, index) => (
                <RenderPoint key={index} position={position} color={color} size={size} />
            ))}
        </>
    );
};

export default BaseRenderPointCloud;
