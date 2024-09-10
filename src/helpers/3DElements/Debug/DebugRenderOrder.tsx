import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

function DebugRenderOrder() {
    const { scene } = useThree();

    useEffect(() => {
        console.log('start')
        scene.traverse((object) => {
            console.log(`Object: ${object.name || object.type}, RenderOrder: ${object.renderOrder}`);
        });
        console.log('end')
    }, [scene]);

    return null;
}

export default DebugRenderOrder