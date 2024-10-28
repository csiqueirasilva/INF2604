import { Point3 } from "@geometry/points";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader, { PolygonLoaderProps } from "@helpers/3DElements/PolygonLoader";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { folder, useControls } from "leva";
import { useEffect, useState } from "react";
import { Group, CanvasTexture, Mesh, PlaneGeometry, MeshBasicMaterial } from "three";
import { createSnakePit, SAMPLE_POLYGONS } from "@geometry/samplePolygons";
import { importPointsFromMatrix } from "@helpers/export";
import { generateVoronoiTexture, VoronoiCell, voronoiDiagramFromDelaunay, voronoiDiagramFromDelaunayDualGraph } from "@geometry/voronoi";
import { addDebugConfig } from "@helpers/3DElements/Debug/DebugHelperExports";
import { multiplyPointByScalar } from "@geometry/affine";

function InternalComponentDelaunay({ points } : { points : Point3[] }) {
    const debugHelper = useDebugHelper();
    const [ texture, setTexture ] = useState<CanvasTexture | null>(null);
    const width = 16 * 80;
    const height = 9 * 80;

    useEffect(() => {
        try {
            let t = voronoiDiagramFromDelaunay(points);
            const generatedTexture = generateVoronoiTexture(t, width, height);
            setTexture(generatedTexture);
        } catch (e) {
            console.error(e)
        }
    }, [ points ]);

    const values = useControls({
        'Voronoi': folder({
            'visivel-v': true
        })
    })
    
    return (
        <>
            {values['visivel-v'] && texture && !debugHelper.controlValues[`voronoi-debugVisible`] && (
                <mesh position={[ 0, 0, 1 ]}>
                    <planeGeometry args={[ 8, 4.5 ]} /> 
                    <meshBasicMaterial map={texture} />
                </mesh>
            )}
        </>
    );
}

interface Props extends PolygonLoaderProps {
}

export default function DiagramaVoronoi2d(props : Props) {
    const { initialPoints: _, name: __, startVisible: ___, ...rest } = props;
    const [ initial, setInitial ] = useState<Point3[]>([]);
    
    useEffect(() => {
        let poly = SAMPLE_POLYGONS.find(x => x.name === "Star-Shaped Polygon")?.points;
        if(!poly) {
            poly = createSnakePit(10, 1, 4);
        }
        const points = importPointsFromMatrix(poly);
        setInitial(points);
        addDebugConfig('voronoi-delaunay', { debugVisible: false });
    }, []);

    return (
        <>
            {
                initial.length > 0 && (
                    <>
                        <PolygonLoader startVisible={false} name="Voronoi" initialPoints={initial} { ...rest }>
                            {
                                (points) => <InternalComponentDelaunay points={points} />
                            }
                        </PolygonLoader>
                    </>
                )
            }
        </>
    )
}
