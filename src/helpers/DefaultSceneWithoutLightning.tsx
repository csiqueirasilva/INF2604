import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box, Html, isWebGL2Available, Loader, OrbitControls, useProgress } from '@react-three/drei'
import AxesHelper from "@helpers/AxesHelper";
import { Leva, useControls } from "leva";
import { Platform, useWindowDimensions, View } from "react-native";
import AbsoluteBox from "@helpers/AbsoluteBox";
import { HEADER_HEIGHT } from "@components/HeaderWithBackButton";
import { CAMERA_INITIAL_POSITION, SceneWithControlsProvider, useSceneWithControlsContext } from "@helpers/SceneWithControlsContext";
import { createPortal } from "react-dom";
import { Camera } from "three";

interface Props {
    children?: React.ReactNode[] | React.ReactNode;
}

function InternalComponent({ children }: Props) {

    const webGLok = isWebGL2Available();

    const ctx = useSceneWithControlsContext();

    useEffect(() => {
        const timeout = setTimeout(() => {
            ctx.setSceneLoaded(true);
            console.log('scene loaded')
        }, 300);
        return () => {
            clearTimeout(timeout)
            console.log('scene unloaded')
            ctx.setSceneLoaded(false);
        };
    }, []);

    const dims = useWindowDimensions();

    return (
        <>
            {
                !webGLok ?
                    <Html>
                        {
                            createPortal(<div style={{ position: 'absolute', top: dims.height / 2, left: 0, width: dims.width, textAlign: 'center' }}>WebGL deve estar ativo para visualizar esse conteúdo</div>, document.body)
                        }
                    </Html>
                    :
                    <>
                        <group>
                            <group renderOrder={-100}>
                                <AxesHelper length={1000} />
                            </group>
                            <group renderOrder={0}>
                                {ctx.sceneLoaded && children}
                            </group>
                        </group>
                        <OrbitControls ref={ctx.orbitControlsRef} />
                        {
                            Platform.OS === "web" && /* todo: in the future split into ScreenControls.web.tsx and ScreenControls.tsx */
                            <AbsoluteBox top={HEADER_HEIGHT + 5} right={5}>
                                <Leva hidden={!ctx.sceneLoaded} flat fill hideCopyButton titleBar={{ title: 'Controles', drag: false, filter: false }} theme={{
                                    sizes: {
                                        numberInputMinWidth: '100px'
                                    }
                                }} />
                            </AbsoluteBox>
                        }
                        <Loader />
                    </>
            }
        </>
    );
}

export default function DefaultSceneWithoutLightning(props: Props) {

    return (
        <Canvas gl={{ logarithmicDepthBuffer: true }} camera={{ fov: 50, position: CAMERA_INITIAL_POSITION }}>
            <SceneWithControlsProvider>
                <InternalComponent {...props} />
            </SceneWithControlsProvider>
        </Canvas>
    )
}