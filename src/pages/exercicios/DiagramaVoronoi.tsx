import HeaderWithBackButton from "@components/HeaderWithBackButton";
import DiagramaVoronoi from "@helpers/3DElements/DiagramaVoronoi";
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
            <DiagramaVoronoi name="Polígono" />
        </>
    );
}

export default function DiagramaVoronoiScreen() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Diagrama Voronoi" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}