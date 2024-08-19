import { getRandomColorHex } from "@helpers/RNGUtils";
import { folder, useControls } from "leva";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import BaseRenderVector from "./BaseRenderVector";

interface Props {
    name: string,
    color?: THREE.ColorRepresentation
    showName?: boolean
    debug?: boolean
    min?: number
    max?: number
    step?: number
    value?: THREE.Vector3
    setValue?: (v: THREE.Vector3) => void
    origin?: THREE.Vector3,
    setOrigin?: (v: THREE.Vector3) => void
}

export default function RenderVector({
    showName = true,
    origin = new THREE.Vector3(0, 0, 0),
    color = undefined,
    debug = false,
    min = -10,
    max = 10,
    step = 0.1,
    value = undefined,
    ...props }: Props) {

    if (!value) {
        value = new THREE.Vector3(0, 0, 0);
    }

    if (!color) {
        color = getRandomColorHex();
    } else if (color instanceof THREE.Color) {
        color = `#` + color.getHexString();
    }

    const [{ pos_x, pos_y, pos_z, ori_x, ori_y, ori_z, toggleShowName, toggleDebug, setColor }, setControls] = useControls(`Vetor ${props.name}`, () => {
        const ret: any = {}
        if (props.setValue instanceof Function) {
            ret['apontamento'] = folder({
                pos_x: { value: value.x, min: min, max: max, step: step },
                pos_y: { value: value.y, min: min, max: max, step: step },
                pos_z: { value: value.z, min: min, max: max, step: step },
            })
        }
        if (props.setOrigin instanceof Function) {
            ret['origem'] = folder({
                ori_x: { value: origin.x, min: min, max: max, step: step },
                ori_y: { value: origin.y, min: min, max: max, step: step },
                ori_z: { value: origin.z, min: min, max: max, step: step },
            })
        }
        ret['toggleDebug'] = debug;
        ret['toggleShowName'] = showName;
        ret['setColor'] = color.toString();
        return ret;
    }, [ props.setValue, props.setOrigin ]);

    const vector1 = props.setValue ? new THREE.Vector3(pos_x, pos_y, pos_z) : value.clone();
    const vOrigin = props.setOrigin ? new THREE.Vector3(ori_x, ori_y, ori_z) : origin.clone();

    const prevValueRef = useRef(value);

    useEffect(() => {
        if (props.setValue instanceof Function && !vector1.equals(prevValueRef.current)) {
            props.setValue(vector1.clone());
        }
    }, [vector1]);

    useEffect(() => {
        if (value && props.setValue) {
            setControls({ pos_x: value.x, pos_y: value.y, pos_z: value.z });
        }
        prevValueRef.current = value;
    }, [value]);

    const prevOriginRef = useRef(origin);

    useEffect(() => {
        if (props.setOrigin instanceof Function && !vOrigin.equals(prevOriginRef.current)) {
            props.setOrigin(vOrigin.clone());
        }
    }, [vOrigin]);

    useEffect(() => {
        if (origin && props.setOrigin) {
            setControls({ ori_x: origin.x, ori_y: origin.y, ori_z: origin.z });
        }
        prevOriginRef.current = value;
    }, [origin]);

    return (
        <BaseRenderVector
            name={props.name}
            origin={vOrigin}
            color={setColor.toString()}
            showName={toggleShowName}
            debug={toggleDebug}
            value={vector1}
        />
    );
}
