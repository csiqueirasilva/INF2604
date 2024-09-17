import HeaderWithBackButton from "@components/HeaderWithBackButton";
import EsferaMinima from "@helpers/3DElements/EsferaMinima";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
import TriangulacaoPoligono from "@helpers/3DElements/TriangulacaoPoligono";
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
            <TriangulacaoPoligono name="Polígono" />
        </>
    );
}

export default function TriangulacaoPoligonoScreen() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Triangulação de polígono" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}