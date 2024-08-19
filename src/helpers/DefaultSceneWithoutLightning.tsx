import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box, Html, Loader, OrbitControls, useProgress } from '@react-three/drei'
import AxesHelper from "@helpers/AxesHelper";
import { Leva } from "leva";
import { Platform, View } from "react-native";
import AbsoluteBox from "@helpers/AbsoluteBox";
import { HEADER_HEIGHT } from "@components/HeaderWithBackButton";
import { useSceneWithControlsContext } from "@helpers/SceneWithControlsContext";

interface Props {
    children?: React.ReactNode[]|React.ReactNode;
}

export default function DefaultSceneWithoutLightning({ children } : Props) {

    const ctx = useSceneWithControlsContext();
    useEffect(() => {
        const timeout = setTimeout(() => {
            ctx.setSceneLoaded(true);
            console.log('scene loaded')
        }, 750);
        return () => {
            clearTimeout(timeout)
            console.log('scene unloaded')
            ctx.setSceneLoaded(false);
        };
    }, []);
    
    return (
        <Canvas gl={{ logarithmicDepthBuffer: true }}>
            <group>
                <group renderOrder={-100}>
                    <AxesHelper length={1000} />
                </group>
                <group renderOrder={0}>
                    { ctx.sceneLoaded && children }
                </group>
            </group>
            <OrbitControls />
            {
                Platform.OS === "web" && /* todo: in the future split into ScreenControls.web.tsx and ScreenControls.tsx */ 
                <AbsoluteBox top={HEADER_HEIGHT + 5} right={5}>
                    <Leva hidden={!ctx.sceneLoaded} flat fill hideCopyButton titleBar={{ title: 'Controles', drag: false, filter: false }} />
                </AbsoluteBox>
            }
            <Loader />
        </Canvas>
    )
}