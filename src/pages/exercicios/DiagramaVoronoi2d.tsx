import HeaderWithBackButton from "@components/HeaderWithBackButton";
import DiagramaVoronoi from "@helpers/3DElements/DiagramaVoronoi";
import DiagramaVoronoi2d from "@helpers/3DElements/DiagramaVoronoi2d";
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
            <DiagramaVoronoi2d name="Diagrama de Voronoi" />
        </>
    );
}

export default function DiagramaVoronoi2dScreen() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Diagrama Voronoi (Relaxamento)" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}