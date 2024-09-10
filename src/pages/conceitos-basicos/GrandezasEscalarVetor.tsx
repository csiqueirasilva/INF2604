import HeaderWithBackButton from "@components/HeaderWithBackButton";
import ReadOnlyRenderVector from "@helpers/3DElements/ReadOnlyRenderVector";
import RenderVector from "@helpers/3DElements/RenderVector";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
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
            <ReadOnlyRenderVector name={`v1 x ${escala}`} value={soma} color={"black"} />
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