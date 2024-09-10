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
    const [ v2, setV2 ] = useState(new THREE.Vector3(0, 0.5, 1));
    const [ soma, setSoma ] = useState(new THREE.Vector3());

    useEffect(() => {
        setSoma(v1.clone().sub(v2.clone()));
    }, [ v1, v2 ]);
    
    return (
        <>
            <RenderVector name="v1" value={v1} setValue={setV1} />
            <RenderVector name="v2" value={v2} setValue={setV2} />
            <ReadOnlyRenderVector name="v1-v2" value={soma} color={"black"} />
        </>
    );
}

export default function GrandezasSubtracaoDeVetores() {

    return (
        <>
            <HeaderWithBackButton title="Conceitos Básicos - Subtracão de vetores" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}