import { Leva } from "leva";
import { createContext, ReactNode, useContext, useState } from "react";

export interface ISceneWithControlsContext {
    sceneLoaded : boolean,
    setSceneLoaded: React.Dispatch<React.SetStateAction<boolean>>
}

export function SceneWithControlsProvider({ children } : { children : ReactNode }) {

    const [ sceneLoaded, setSceneLoaded ] = useState(false);

    const o : ISceneWithControlsContext = {
        sceneLoaded, setSceneLoaded
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