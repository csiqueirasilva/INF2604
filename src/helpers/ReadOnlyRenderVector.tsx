import * as THREE from "three";
import BaseRenderVector from "./BaseRenderVector";
import { getRandomColorHex } from "@helpers/RNGUtils";

interface Props {
    name: string,
    origin?: THREE.Vector3,
    color?: THREE.ColorRepresentation
    showName?: boolean
    debug?: boolean
    value: THREE.Vector3
}

export default function ReadOnlyRenderVector({ 
    showName = true, 
    origin = new THREE.Vector3(0, 0, 0), 
    color = undefined, 
    debug = false, 
    value, ...props }: Props) {

    if (!color) {
        color = getRandomColorHex();
    } else if (color instanceof THREE.Color) {
        color = `#` + color.getHexString();
    }

    return (
        <BaseRenderVector 
            name={props.name}
            origin={origin}
            color={color.toString()}
            showName={showName}
            debug={debug}
            value={value}
        />
    );
}
