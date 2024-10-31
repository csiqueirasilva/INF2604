import HeaderWithBackButton from "@components/HeaderWithBackButton";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
import TriangulacaoDelaunayConvexo from "@helpers/3DElements/TriangulacaoDelaunayConvexo";
import React, {  } from "react";

function InternalRenderingComponent() {
    return (
        <>
            <TriangulacaoDelaunayConvexo name="Polígono" />
        </>
    );
}

export default function TriangulacaoDelaunayScreenConvexo() {

    return (
        <>
            <HeaderWithBackButton title="Trabalhos - Triangulação Delaunay (Convexo)" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}