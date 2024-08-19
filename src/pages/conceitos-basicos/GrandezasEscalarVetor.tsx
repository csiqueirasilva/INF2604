import HeaderWithBackButton from "@components/HeaderWithBackButton";
import DefaultSceneWithoutLightning from "@helpers/DefaultSceneWithoutLightning";
import ReadOnlyRenderVector from "@helpers/ReadOnlyRenderVector";
import RenderVector from "@helpers/RenderVector";
import { useSceneWithControlsContext } from "@helpers/SceneWithControlsContext";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React, { useEffect, useState } from "react";
import * as THREE from "three";

function InternalRenderingComponent () {

    const [ v1, setV1 ] = useState(new THREE.Vector3(1, 0.5, 0));

    const { escala } = useControls({ 'escala' : 1 });

    const [ soma, setSoma ] = useState(new THREE.Vector3());

    useEffect(() => {
        setSoma(v1.clone().multiplyScalar(escala));
    }, [ v1, escala ]);
    
    return (
        <>
            <RenderVector name="v1" value={v1} setValue={setV1} />
            <ReadOnlyRenderVector name={`v1 x ${escala}`} value={soma} color={"yellow"} />
        </>
    );
}

export default function GrandezasEscalarVetor() {

    return (
        <>
            <HeaderWithBackButton title="Conceitos Básicos - Escalar vetor" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}