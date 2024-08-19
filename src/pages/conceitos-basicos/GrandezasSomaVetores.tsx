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
    const [ v2, setV2 ] = useState(new THREE.Vector3(0, 0.5, 1));
    const [ soma, setSoma ] = useState(new THREE.Vector3());

    useEffect(() => {
        setSoma(v1.clone().add(v2.clone()));
    }, [ v1, v2 ]);
    
    return (
        <>
            <RenderVector name="v1" value={v1} setValue={setV1} />
            <RenderVector name="v2" value={v2} setValue={setV2} />
            <ReadOnlyRenderVector name="v1+v2" value={soma} color={"yellow"} />
        </>
    );
}

export default function GrandezasSomaVetores() {

    return (
        <>
            <HeaderWithBackButton title="Conceitos Básicos - Soma de vetores" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}