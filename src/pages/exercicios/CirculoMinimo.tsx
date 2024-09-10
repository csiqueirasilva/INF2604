import HeaderWithBackButton from "@components/HeaderWithBackButton";
import EsferaMinima from "@helpers/3DElements/EsferaMinima";
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
            <EsferaMinima name="A" minNumberOfPoints={2} />
        </>
    );
}

export default function PontosMaisProximos() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Círculo mínimo" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}