import HeaderWithBackButton from "@components/HeaderWithBackButton";
import EsferaMinima from "@helpers/3DElements/EsferaMinima";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
import TriangulacaoDelaunay from "@helpers/3DElements/TriangulacaoDelaunay";
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
            <TriangulacaoDelaunay name="Polígono" />
        </>
    );
}

export default function TriangulacaoDelaunayScreen() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Triangulação Delaunay" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}