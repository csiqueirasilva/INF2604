import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box, Html, isWebGL2Available, Loader, OrbitControls, OrthographicCamera, useProgress } from '@react-three/drei'
import { Leva, useControls } from "leva";
import { Platform, useWindowDimensions, View } from "react-native";
import { HEADER_HEIGHT } from "@components/HeaderWithBackButton";
import { createPortal } from "react-dom";
import { Camera } from "three";
import AxesHelper from "@helpers/3DElements/AxesHelper";
import AbsoluteBox from "@helpers/3DElements/AbsoluteBox";
import { CAMERA_INITIAL_POSITION, SceneWithControlsProvider, useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import DebugHelper from "@helpers/3DElements/Debug/DebugHelper";

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
                        {
                            ctx.errorMsg &&
                            <Html>
                                {
                                    createPortal(<div style={{ position: 'absolute', top: dims.height / 2, left: 0, width: dims.width, textAlign: 'center' }}>{ ctx.errorMsg }</div>, document.body)
                                }
                            </Html>
                        }
                        <group>
                            <group renderOrder={-100}>
                                <AxesHelper length={1000} />
                            </group>
                            <group renderOrder={0}>
                                <DebugHelper>
                                    {ctx.sceneLoaded && children}
                                </DebugHelper>
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
        <Canvas gl={{ logarithmicDepthBuffer: true }}>
            <SceneWithControlsProvider>
                <OrthographicCamera
                        makeDefault
                        position={CAMERA_INITIAL_POSITION}
                        zoom={50}
                        near={-1000}
                        far={1000}
                    />
                <InternalComponent {...props} />
            </SceneWithControlsProvider>
        </Canvas>
    )
}