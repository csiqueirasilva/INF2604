import React from "react";
import { Line } from "@react-three/drei";

interface SegmentedLineProps {
    start: [number, number, number]; // Starting point of the line
    end: [number, number, number];   // Ending point of the line
    dashSize?: number;               // Size of each dash
    gapSize?: number;                // Size of the gap between dashes
    color?: string;                  // Color of the line
    lineWidth?: number;              // Width of the line
}

const SegmentedLine: React.FC<SegmentedLineProps> = ({
    start,
    end,
    dashSize = 0.5,
    gapSize = 0.5,
    color = "black",
    lineWidth = 1
}) => {
    const segments = [];
    const axis = start[0] !== end[0] ? 'x' : start[1] !== end[1] ? 'y' : 'z';
    const totalLength = Math.abs(start[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] - end[axis === 'x' ? 0 : axis === 'y' ? 1 : 2]);
    const segmentCount = Math.floor(totalLength / (dashSize + gapSize));
    const direction = Math.sign(end[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] - start[axis === 'x' ? 0 : axis === 'y' ? 1 : 2]);

    for (let i = 0; i < segmentCount; i++) {
        const startOffset = i * (dashSize + gapSize);
        const endOffset = startOffset + dashSize;
        const segmentStart = [...start] as [number, number, number];
        const segmentEnd = [...start] as [number, number, number];

        segmentStart[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += startOffset * direction;
        segmentEnd[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += endOffset * direction;

        segments.push(
            <Line
                key={`segment-${axis}-${i}`}
                points={[segmentStart, segmentEnd]}
                color={color}
                lineWidth={lineWidth}
            />
        );
    }

    return <>{segments}</>;
};

export default SegmentedLine;
