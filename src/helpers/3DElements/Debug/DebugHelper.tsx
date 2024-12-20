import { button, folder, useControls } from "leva";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Object3D, Vector3 } from "three";
import { ThreeElements, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei";
import { estimateBytesUsed } from "three-stdlib";
import { DebugHelperObject, getDebugConfig, IDebugHelperContext, setModuleSetter } from "@helpers/3DElements/Debug/DebugHelperExports";

interface Props {
    children: React.ReactNode[] | React.ReactNode | undefined
}

const DebugHelperContext = createContext<IDebugHelperContext | undefined>(undefined);

export default function DebugHelper(props: Props) {

    const [debugObjects, setDebugObjects] = useState<DebugHelperObject[]>([]);
    const [playingDic, setPlayingDic] = useState<Record<string, boolean>>({});

    const [values, setControls] = useControls("Debug", () => {
        const ret: any = {};
        debugObjects.map((obj) => {
            const name = obj.id;
            const fold = {} as any;
            fold[`${name}-play`] = button(() => {
                if (!playingDic[name]) {
                    setPlayingDic({ ...playingDic, [name]: true });
                    setControls({ [`${name}-debugSteps`]: 0 });
                } else {
                    setPlayingDic({ ...playingDic, [name]: false });
                }
            });
            const cfg = getDebugConfig(name);
            fold[`${name}-debugSpeed`] = { min: 100, max: 2000, value: 1000, step: 100 };
            fold[`${name}-debugSteps`] = { min: cfg.minStep || 0, max: cfg.maxStep || obj.objects.length, value: 0, step: 1 };
            fold[`${name}-debugVisible`] = { value: cfg.debugVisible !== null ? cfg.debugVisible : true };
            fold[`${name}-showName`] = { value: false };
            ret[name] = folder(fold)
        })
        return ret;
    }, [debugObjects, playingDic]);

    useEffect(() => {
        const intervals: NodeJS.Timeout[] = [];
        Object.keys(playingDic).forEach((k) => {
            if (playingDic[k]) {
                const intLocal = setInterval(() => {
                    let copy = { ...playingDic };

                    let el = debugObjects.find(x => x.id === k);
                    const key = `${k}-debugSteps`;
                    if (el) {
                        if (values[key] < el.objects.length) {
                            setControls({ [key]: values[key] + 1 });
                        } else {
                            copy[k] = false;
                        }
                    }
                    setPlayingDic(copy);
                }, values[`${k}-debugSpeed`]);
                intervals.push(intLocal);
            }
        });
        return () => intervals.forEach(i => clearInterval(i));
    }, [ playingDic ]);

    useEffect(() => {
        if (setDebugObjects instanceof Function) {
            setModuleSetter(setDebugObjects);
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
            setModuleSetter(undefined);
        };
    }, []);

    return (
        <DebugHelperContext.Provider value={{ controlValues: values }}>
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
            {props.children}
        </DebugHelperContext.Provider>
    );
}

export const useDebugHelper = () => {
    const context = useContext(DebugHelperContext);
    if (context === undefined) {
        throw new Error('useDebugContext must be used within a DebugHelper');
    }
    return context;
};
