import HeaderWithBackButton from "@components/HeaderWithBackButton";
import RNGRenderPointCloud from "@helpers/3DElements/RNGRenderPointCloud";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
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