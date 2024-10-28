import HeaderWithBackButton from "@components/HeaderWithBackButton";
import RepresentacaoMalhaTriangulosRendering from "@helpers/3DElements/RepresentacaoMalhaTriangulosRendering";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
import React, {  } from "react";

function InternalRenderingComponent() {
    return (
        <>
            <RepresentacaoMalhaTriangulosRendering />
        </>
    );
}

export default function RepresentacaoMalhaTriangulos() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Representação Malha Triângulos" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}