import * as THREE from "three";
import { getRandomColorHex } from "@helpers/RNGUtils";
import BaseRenderVector from "@helpers/3DElements/BaseObjects/BaseRenderVector";

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
