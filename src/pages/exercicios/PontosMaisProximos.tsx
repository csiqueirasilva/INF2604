import HeaderWithBackButton from "@components/HeaderWithBackButton";
import DefaultSceneWithoutLightning from "@helpers/DefaultSceneWithoutLightning";
import { DistancesInCloud } from "@helpers/DistancesInCloud";
import ReadOnlyRenderVector from "@helpers/ReadOnlyRenderVector";
import RenderVector from "@helpers/RenderVector";
import RNGRenderPointCloud from "@helpers/RNGRenderPointCloud";
import { useSceneWithControlsContext } from "@helpers/SceneWithControlsContext";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "react-native-paper";
import * as THREE from "three";

function InternalRenderingComponent() {
    return (
        <>
            <DistancesInCloud name="A" minNumberOfPoints={4} maxNumberOfPoints={4000} />
        </>
    );
}

export default function PontosMaisProximos() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Pontos mais próximos" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}