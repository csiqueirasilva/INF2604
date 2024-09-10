import { Html } from "@react-three/drei";
import { ReactElement } from "react";
import { createPortal } from "react-dom";

interface Props {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
    children: ReactElement|ReactElement[];
    zIndex?: number;
    width?: number;
}

function AbsoluteBox ({ zIndex = 2000, ...props } : Props) {
    return (
        <Html>
            {
                createPortal(
                    <div style={{ position: 'absolute', top: props.top, right: props.right, left: props.left, bottom: props.bottom, width: props.width, zIndex }}>
                        { props.children }
                    </div>, document.body
                )
            }
        </Html>
    )
}

export default AbsoluteBox;