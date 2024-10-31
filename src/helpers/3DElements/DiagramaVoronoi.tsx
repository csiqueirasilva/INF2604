import { Point3 } from "@geometry/points";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader, { PolygonLoaderProps } from "@helpers/3DElements/PolygonLoader";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { folder, useControls } from "leva";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Group, CanvasTexture, Mesh, PlaneGeometry, MeshBasicMaterial } from "three";
import { createSnakePit, SAMPLE_POLYGONS } from "@geometry/samplePolygons";
import { importPointsFromMatrix } from "@helpers/export";
import { buildVoronoiConesWithSeeds, generateVoronoiTexture, VoronoiCell, voronoiDiagramFromDelaunay, voronoiWithCones } from "@geometry/voronoi";
import { addDebugConfig } from "@helpers/3DElements/Debug/DebugHelperExports";
import { multiplyPointByScalar } from "@geometry/affine";
import { Html } from "@react-three/drei";
import { createPortal } from "react-dom";
import { useWindowDimensions } from "react-native";

function InternalComponentDelaunay({ points } : { points : Point3[] }) {
    const debugHelper = useDebugHelper();
    const containerRef = useRef<HTMLDivElement>(null);
    const topMargin = 60;
    const dims = useWindowDimensions();
    const width = dims.width;
    const height = dims.height - topMargin;
    const [ cones, setCones ] = useState<Group>(new Group());

    useEffect(() => {
        try {
            const t = voronoiDiagramFromDelaunay(points);
            const generatedTexture = generateVoronoiTexture(t, width, height, true, false);
            containerRef.current?.appendChild(generatedTexture);
            const c = buildVoronoiConesWithSeeds(t);
            setCones(c);
            return () => { 
                try {
                    containerRef.current?.removeChild(generatedTexture);
                } catch (e) {
                    console.warn(e);
                }
            };
        } catch (e) {
            console.error(e)
        }
    }, [ points, containerRef.current, width, height ]);

    const values = useControls({
        'Voronoi': folder({
            'visivel-2d': true
        })
    })
    
    return (
        <>
            {!debugHelper.controlValues[`voronoi-debugVisible`] && <primitive object={cones} />}
            <Html>
                {
                    createPortal(
                        <div 
                            style={{ 
                                display: values['visivel-2d'] && !debugHelper.controlValues[`voronoi-debugVisible`] ? 'block' : 'none', 
                                position: 'absolute', 
                                top: topMargin, 
                                left: 0 
                            }} id="voronoi-canvas" ref={containerRef}></div>,
                        document.body
                    )
                }
                
            </Html>
        </>
    );
}

interface Props extends PolygonLoaderProps {
}

export default function DiagramaVoronoi(props : Props) {
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
