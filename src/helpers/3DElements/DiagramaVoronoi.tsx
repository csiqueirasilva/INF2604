import { Point3 } from "@geometry/points";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader, { PolygonLoaderProps } from "@helpers/3DElements/PolygonLoader";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { folder, useControls } from "leva";
import { useEffect, useState } from "react";
import { createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";
import { createSnakePit, SAMPLE_POLYGONS } from "@geometry/samplePolygons";
import { importPointsFromMatrix } from "@helpers/export";
import { delaunayTriangulation } from "@geometry/delaunay";
import { Triangle } from "@geometry/triangle";
import { voronoiWithCones } from "@geometry/voronoi";
import { Group } from "three";
import { addDebugConfig } from "@helpers/3DElements/Debug/DebugHelperExports";

function InternalComponentDelaunay({ points } : { points : Point3[] }) {
    
    const ctx = useSceneWithControlsContext();
    const debugHelper = useDebugHelper();
    const [ voronoi, setVoronoi ] = useState<Group>(new Group());

    useEffect(() => {
        try {
            let t = voronoiWithCones(points);
            setVoronoi(t);
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
            {values['visivel-v'] && !debugHelper.controlValues[`voronoi-debugVisible`] && <primitive object={voronoi} />}
        </>
    )
}

interface Props extends PolygonLoaderProps {
}

export default function DigramaVoronoi(props : Props) {
    const { initialPoints: _, name: __, startVisible: ___, ...rest } = props;
    const [ initial, setInitial ] = useState<Point3[]>([]);
    
    useEffect(() => {
        let poly = SAMPLE_POLYGONS.find(x => x.name === "Star-Shaped Polygon")?.points;
        if(!poly) {
            poly = createSnakePit(10, 1, 4);
        }
        const points = importPointsFromMatrix(poly);
        setInitial(points);
        addDebugConfig('voronoi-cones', { debugVisible: false });
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