import { generateRNGPointCloudBasedOnStrategy, Point3, PointGenerationType } from "@geometry/points";
import { useValidColorHex } from "@helpers/useValidColorHex";
import { Html } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import React, { useCallback, useEffect, useState } from "react";
import { Color, ColorRepresentation } from "three";
import * as Clipboard from 'expo-clipboard';
import { exportPoints, importPoints, MAX_DATA_EXPORT } from "@helpers/export";
import InstancedRenderedPoint from "@helpers/3DElements/InstancedRenderedPoint";
import { useSceneWithControlsContext, VIEW_TYPE } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { getRandomColorHex } from "@helpers/RNGUtils";
import ImportExportPointCloudDialog from "@components/ImportExportPointCloudDialog";
import { createDebugArrowSegments, createDebugLine } from "@helpers/3DElements/Debug/debugVisualElements";
import { SAMPLE_POLYGONS } from "@geometry/samplePolygons";
import { useDebugHelper } from "@helpers/3DElements/Debug/DebugHelper";

export interface PolygonLoaderProps {
    name: string;
    color?: ColorRepresentation;
    children?: (points: Point3[]) => React.ReactNode;
    initialPoints?: Point3[],
    startVisible?: boolean
}

const PolygonLoader: React.FC<PolygonLoaderProps> = ({
    name,
    color = undefined,
    children = undefined,
    initialPoints = [],
    startVisible = true
}) => {

    if (!color) {
        color = getRandomColorHex();
    } else if (color instanceof Color) {
        color = `#` + color.getHexString();
    }

    const startColor = useValidColorHex(color);

    const ctx = useSceneWithControlsContext();

    useEffect(() => {
        ctx.setSampleOptions(SAMPLE_POLYGONS);
    }, [])

    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const [usedColor, setUsedColor] = useState<string>(startColor);
    const [points, setPoints] = useState<Point3[]>(initialPoints);

    const [values, setControls] = useControls(`Polígono ${name}`, () => {
        const ret: any = {}
        ret[`Polygon Outline-${name}`] = { value: startVisible };
        ret['Dados da vizualização'] = folder({
            'Export to clipboard': button(async () => {
                const str = await exportPoints(points);
                await Clipboard.setStringAsync(str);
                console.log("EXPORTED DATA", str);
            }, { disabled: points.length > MAX_DATA_EXPORT }),
            'Import': button(async () => {
                const str = prompt("IMPORT DATA:");
                if (str !== null) {
                    const p = await importPoints(str);
                    if (p.length <= MAX_DATA_EXPORT) {
                        setPoints(p);
                    } else {
                        alert(`Só é possível importar até ${MAX_DATA_EXPORT}`);
                    }
                }
            }),
            'Import/Export pontos': button(async () => {
                setImportDialogOpen(true);
            })
        })
        return ret;
    }, [ points, name, startColor, usedColor, ctx.viewType ]);

    return (
        <>
            {
                children instanceof Function && children(points)
            }
            { values[`Polygon Outline-${name}`] && points.length > 0 && <primitive object={createDebugLine(points)} /> }
            <Html>
                <ImportExportPointCloudDialog 
                    options={ctx.sampleOptions}
                    importDialogOpen={importDialogOpen} 
                    setImportDialogOpen={setImportDialogOpen} 
                    points={points} 
                    setPoints={setPoints} 
                />
            </Html>
        </>
    );
};

export default PolygonLoader;