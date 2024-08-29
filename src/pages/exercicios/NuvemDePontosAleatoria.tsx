import HeaderWithBackButton from "@components/HeaderWithBackButton";
import DefaultSceneWithoutLightning from "@helpers/DefaultSceneWithoutLightning";
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
            <RNGRenderPointCloud name="A" />
        </>
    );
}

export default function NuvemDePontosAleatoria() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Núvem de pontos aleatória" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}