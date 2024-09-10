import React from "react";
import { Line } from "@react-three/drei";
import SegmentedLine from "./SegmentedLine";

interface Props {
    length?: number;
    lineWidth?: number;
    dashSize?: number;
    gapSize?: number;
}

const AxesHelper: React.FC<Props> = ({ length = 5, lineWidth = 0.5, dashSize = 0.5, gapSize = 0.5 }) => {
    return (
        <object3D renderOrder={-100}>
            {/* X-axis */}
            <SegmentedLine
                start={[-length, 0, 0]}
                end={[0, 0, 0]}
                dashSize={dashSize}
                gapSize={gapSize}
                color="red"
                lineWidth={lineWidth}
            />
            <Line
                points={[[0, 0, 0], [length, 0, 0]]} // Positive X-axis
                color="red"
                lineWidth={lineWidth}
            />
            
            {/* Y-axis */}
            <SegmentedLine
                start={[0, -length, 0]}
                end={[0, 0, 0]}
                dashSize={dashSize}
                gapSize={gapSize}
                color="green"
                lineWidth={lineWidth}
            />
            <Line
                points={[[0, 0, 0], [0, length, 0]]} // Positive Y-axis
                color="green"
                lineWidth={lineWidth}
            />
            
            {/* Z-axis */}
            <SegmentedLine
                start={[0, 0, -length]}
                end={[0, 0, 0]}
                dashSize={dashSize}
                gapSize={gapSize}
                color="blue"
                lineWidth={lineWidth}
            />
            <Line
                points={[[0, 0, 0], [0, 0, length]]} // Positive Z-axis
                color="blue"
                lineWidth={lineWidth}
            />
        </object3D>
    );
}

export default AxesHelper;