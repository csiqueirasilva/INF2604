import { SampleModel } from "@geometry/sampleModel";
import { SAMPLE_POINT_CLOUDS } from "@geometry/samplePointClouds";
import { useFrame, useThree } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export const CAMERA_INITIAL_POSITION = new Vector3( 2.5, 0, 40 );
export const CAMERA_FIXED_LOOK_AT = new Vector3( 2.5, 0, 0 );
export const CAMERA_INITIAL_ZOOM = 80;

export enum VIEW_TYPE {
    ORBIT_CONTROLS = "Orbit controls",
    PLANE_XY = "Fixed XY"
}

export interface ISceneWithControlsContext {
    sceneLoaded : boolean,
    setSceneLoaded: React.Dispatch<React.SetStateAction<boolean>>
    errorMsg : string|undefined,
    setErrorMsg: React.Dispatch<React.SetStateAction<string|undefined>>
    orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>
    viewType: VIEW_TYPE
    sampleOptions: SampleModel[]
    setSampleOptions: React.Dispatch<React.SetStateAction<SampleModel[]>>
}

export function SceneWithControlsProvider({ children } : { children : ReactNode }) {

    const [ sampleOptions, setSampleOptions ] = useState(SAMPLE_POINT_CLOUDS);
    const [ sceneLoaded, setSceneLoaded ] = useState(false);
    const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
    const { camera } = useThree();
    const [ errorMsg, setErrorMsg ] = useState<string|undefined>(undefined);

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
            camera.lookAt(CAMERA_FIXED_LOOK_AT.x, CAMERA_FIXED_LOOK_AT.y, CAMERA_FIXED_LOOK_AT.z);
            camera.zoom = CAMERA_INITIAL_ZOOM;
            camera.updateProjectionMatrix();
        }
    }, [ camera ]);

    useFrame(() => {
        if (orbitControlsRef.current?.enabled === false) {
            setupCameraInitialPosition();
            orbitControlsRef.current.target.copy(CAMERA_FIXED_LOOK_AT);
            orbitControlsRef.current.update();
        }
    })

    useEffect(() => {
        if(orbitControlsRef.current) {
            orbitControlsRef.current.enabled = values['Estilo câmera'] === VIEW_TYPE.ORBIT_CONTROLS;
        }
    }, [ values['Estilo câmera'], camera ]);

    useEffect(() => {
        setupCameraInitialPosition();
    }, []);

    const o : ISceneWithControlsContext = {
        sceneLoaded, 
        setSceneLoaded, 
        orbitControlsRef, 
        viewType: values['Estilo câmera'],
        setErrorMsg,
        errorMsg,
        setSampleOptions,
        sampleOptions
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