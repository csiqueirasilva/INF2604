import { useFrame, useThree } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export const CAMERA_INITIAL_POSITION = new Vector3( 0, 0, 20 );

export enum VIEW_TYPE {
    ORBIT_CONTROLS = "Orbit controls",
    PLANE_XY = "Fixed XY"
}

export interface ISceneWithControlsContext {
    sceneLoaded : boolean,
    setSceneLoaded: React.Dispatch<React.SetStateAction<boolean>>
    orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>
    viewType: VIEW_TYPE
}

export function SceneWithControlsProvider({ children } : { children : ReactNode }) {

    const [ sceneLoaded, setSceneLoaded ] = useState(false);
    const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
    const { camera } = useThree();

    const [values, setControls] = useControls(`Cena`, () => {
        const ret: any = {}
        const styles = Object.entries(VIEW_TYPE).filter(
            ([str, type], idx) => (type === VIEW_TYPE.ORBIT_CONTROLS && orbitControlsRef.current) || type !== VIEW_TYPE.ORBIT_CONTROLS? true : false
        ).map(x => x[1]);
        ret['Estilo câmera'] = { value: styles[0], options: styles };
        return ret;
    }, [ orbitControlsRef.current ]);

    const setupCameraInitialPosition = useCallback(() => {
        if(camera) {
            camera.position.copy(CAMERA_INITIAL_POSITION);
            camera.lookAt(0, 0, 0);
        }
    }, [ camera ]);

    useFrame(() => {
        if (orbitControlsRef.current?.enabled === false) {
            setupCameraInitialPosition();
            orbitControlsRef.current.target.set(0, 0, 0);
        }
    })

    useEffect(() => {
        if(orbitControlsRef.current) {
            orbitControlsRef.current.enabled = values['Estilo câmera'] === VIEW_TYPE.ORBIT_CONTROLS;
        }
    }, [ values['Estilo câmera'] ]);

    useEffect(() => {
        setupCameraInitialPosition();
    }, []);

    const o : ISceneWithControlsContext = {
        sceneLoaded, setSceneLoaded, orbitControlsRef, viewType: values['Estilo câmera']
    };

    return (
        <SceneWithControlsContext.Provider value={o}>
            {children}
        </SceneWithControlsContext.Provider>
    );
}

export const useSceneWithControlsContext = () => {
    const context = useContext(SceneWithControlsContext);
    if (context === undefined) {
        throw new Error('useSceneWithControlsContext must be used within a SceneWithControlsProvider');
    }
    return context;
};

const SceneWithControlsContext = createContext<ISceneWithControlsContext | undefined>(undefined);

export default SceneWithControlsContext;