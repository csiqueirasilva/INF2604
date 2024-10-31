import { Point3 } from "@geometry/points";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader, { PolygonLoaderProps } from "@helpers/3DElements/PolygonLoader";
import { folder, useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import { Group } from "three";
import { createSnakePit, SAMPLE_POLYGONS } from "@geometry/samplePolygons";
import { importPointsFromMatrix } from "@helpers/export";
import { buildVoronoiConesWithSeeds, generateVoronoiTexture, VoronoiDiagram, voronoiDiagramFromDelaunay } from "@geometry/voronoi";
import { addDebugConfig } from "@helpers/3DElements/Debug/DebugHelperExports";
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

    const values = useControls({
        'Voronoi': folder({
            'visivel-2d': true,
            'seeds': true,
            'centroids': true,
            'edges': true,
            'triangulation': true
        })
    })

    useEffect(() => {
        try {
            let setPoints = points;
            let t = voronoiDiagramFromDelaunay(setPoints.map(x => x.clone()));
            let generatedTexture = generateVoronoiTexture(t, width, height, values['seeds'], values['centroids'], values['edges'], values['triangulation']);
            containerRef.current?.appendChild(generatedTexture);
            let c = buildVoronoiConesWithSeeds(t);
            setCones(c);
            let pointsIt = setPoints;
            const int = setInterval(() => {
                if(!t.isCentroidal()) {
                    pointsIt = t.getLloysRelaxationPoints();
                    t = voronoiDiagramFromDelaunay(pointsIt.map(x => x.clone()));
                    c = buildVoronoiConesWithSeeds(t);
                    setCones(c);
                    try {
                        containerRef.current?.removeChild(generatedTexture);
                        generatedTexture = generateVoronoiTexture(t, width, height, values['seeds'], values['centroids'], values['edges'], values['triangulation']);
                        containerRef.current?.appendChild(generatedTexture);
                    } catch (e) {
                    }
                }
            }, 100);
            
            return () => { 
                try {
                    clearInterval(int);
                    containerRef.current?.removeChild(generatedTexture);
                } catch (e) {
                    console.warn(e);
                }
            };
        } catch (e) {
            console.error(e)
        }
    }, [ points, containerRef.current, width, height, values['seeds'], values['edges'], values['triangulation'], values['centroids'] ]);

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

export default function DiagramaVoronoi2d(props : Props) {
    const { initialPoints: _, name: __, startVisible: ___, ...rest } = props;
    const [ initial, setInitial ] = useState<Point3[]>([]);
    
    useEffect(() => {
        let poly = SAMPLE_POLYGONS.find(x => x.name === "Hexagon")?.points;
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
