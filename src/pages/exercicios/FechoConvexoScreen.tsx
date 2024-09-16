import HeaderWithBackButton from "@components/HeaderWithBackButton";
import FechoConvexo from "@helpers/3DElements/FechoConvexo";
import DefaultSceneWithoutLightning from "@helpers/3DElements/Scenes/DefaultSceneWithoutLightning";
import React, {  } from "react";

function InternalRenderingComponent() {
    return (
        <>
            <FechoConvexo name="A" minNumberOfPoints={4} maxNumberOfPoints={20000} />
        </>
    );
}

export default function FechoConvexoScreen() {

    return (
        <>
            <HeaderWithBackButton title="Exercícios - Fecho convexo" />
            <DefaultSceneWithoutLightning>
                <InternalRenderingComponent />
            </DefaultSceneWithoutLightning>
        </>
    )
}