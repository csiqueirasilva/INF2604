import HeaderWithBackButton from "@components/HeaderWithBackButton";
import ProjetorBilinearRendering from "@helpers/3DElements/ProjetorBilinearRendering";
import RepresentacaoMalhaTriangulosRendering from "@helpers/3DElements/RepresentacaoMalhaTriangulosRendering";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
import React, {  } from "react";

function InternalRenderingComponent() {
    return (
        <>
            <ProjetorBilinearRendering />
        </>
    );
}

export default function RepresentacaoMalhaTriangulos() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Projetor bilinear" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}