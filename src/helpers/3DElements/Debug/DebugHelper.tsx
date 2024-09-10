import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useState } from "react";
import { Object3D, Vector3 } from "three";
import { ThreeElements, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei";

export interface DebugHelperObject {
    objects: Object3D[]
    id: string
}

let moduleSetter: React.Dispatch<React.SetStateAction<DebugHelperObject[]>> | undefined = undefined;

export default function DebugHelper() {
    const [debugObjects, setDebugObjects] = useState<DebugHelperObject[]>([]);
    const [values, setControls] = useControls("Debug", () => {
        const ret: any = {};
        debugObjects.map((obj) => {
            const name = obj.id;
            const fold = {} as any;
            fold[`${name}-debugSteps`] = { min: 0, max: obj.objects.length, value: 0, step: 1 };
            fold[`${name}-debugVisible`] = { value: true };
            fold[`${name}-showName`] = { value: true };
            ret[name] = folder(fold)
        })
        return ret;
    }, [debugObjects]);

    useEffect(() => {
        if (setDebugObjects instanceof Function) {
            moduleSetter = setDebugObjects;
        }
    }, [setDebugObjects]);

    useEffect(() => {
        debugObjects.forEach(el => {
            const key = `${el.id}-debugSteps`;
            setControls({ [key]: Math.max(values[key], el.objects.length) });
        })
    }, [debugObjects]);

    useEffect(() => {
        return () => {
            moduleSetter = undefined;
        };
    }, []);

    return (
        <>
            {
                debugObjects.map(
                    (debug, idx) =>
                        <React.Fragment key={idx}>
                            {
                                values[`${debug.id}-debugVisible`] &&
                                <primitive object={debug.objects[values[`${debug.id}-debugSteps`] - 1] || new Object3D()}>
                                    {
                                        values[`${debug.id}-showName`] &&
                                        <Html>
                                            <span>{debug.id}</span>
                                        </Html>
                                    }
                                </primitive>
                            }
                        </React.Fragment>
                )
            }
        </>
    );
}

export function PushDebugObjects(id: string, ...objects: Object3D[]) {
    const object = new Object3D();
    object.add(...objects);
    PushDebugObject(id, object);
}

export function PushDebugObject(id: string, object: Object3D) {
    if (moduleSetter instanceof Function) {
        moduleSetter((prev) => {
            const copy = [ ...prev ];
            const idx = copy.findIndex(x => x.id === id);
            if(idx !== -1) {
                copy[idx].objects.push(object);
            } else {
                copy.push({ id, objects: [ object ]});
            }
            return copy;
        });
    }
}

export function ClearDebugObjects() {
    if (moduleSetter instanceof Function) {
        moduleSetter([]);
    }
}

export function ClearDebugObject(id : string) {
    if (moduleSetter instanceof Function) {
        moduleSetter((prev) => {
            const copy = [ ...prev ];
            const idx = copy.findIndex(x => x.id === id);
            copy.splice(idx, 1);
            return copy;
        });
    }
}