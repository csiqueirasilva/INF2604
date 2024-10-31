import { Point3 } from "@geometry/points";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";
import PolygonLoader, { PolygonLoaderProps } from "@helpers/3DElements/PolygonLoader";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { folder, useControls } from "leva";
import { useEffect, useState } from "react";
import { createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";
import { createSnakePit, SAMPLE_POLYGONS } from "@geometry/samplePolygons";
import { importPointsFromMatrix } from "@helpers/export";
import { delaunayTriangulation, delaunayTriangulationConvex } from "@geometry/delaunay";
import { Triangle } from "@geometry/triangle";

function InternalComponentDelaunay({ points } : { points : Point3[] }) {
    
    const ctx = useSceneWithControlsContext();
    const debugHelper = useDebugHelper();
    const [ trianglesDelaunay, setTrianglesDelaunay ] = useState<Triangle[]>([]);

    useEffect(() => {
        try {
            let t = delaunayTriangulationConvex(points, "delaunay");
            setTrianglesDelaunay(t);
        } catch (e) {
            console.error(e)
        }
    }, [ points ]);

    const values = useControls({
        'Delaunay': folder({
            'visivel-d': true
        })
    })
    
    return (
        <>
            {values['visivel-d'] && !debugHelper.controlValues[`delaunay-debugVisible`] && <primitive object={createDebugTriangulatedSurface(trianglesDelaunay)} />}
        </>
    )
}

interface Props extends PolygonLoaderProps {
}

export default function TriangulacaoDelaunayConvexo(props : Props) {
    const { initialPoints: _, name: __, startVisible: ___, ...rest } = props;
    const [ initial, setInitial ] = useState<Point3[]>([]);
    
    useEffect(() => {
        let poly = SAMPLE_POLYGONS.find(x => x.name === "Star-Shaped Polygon")?.points;
        if(!poly) {
            poly = createSnakePit(10, 1, 4);
        }
        const points = importPointsFromMatrix(poly);
        setInitial(points);
    }, []);

    return (
        <>
            {
                initial.length > 0 && (
                    <>
                        <PolygonLoader startVisible={true} name="Delaunay" initialPoints={initial} { ...rest }>
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