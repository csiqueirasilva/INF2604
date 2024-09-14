import { generateRNGPointCloudBasedOnStrategy, Point3, PointGenerationType } from "@geometry/points";
import { PolarReference } from "@geometry/topology";
import { useValidColorHex } from "@helpers/useValidColorHex";
import { Html, Line, Sphere } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import React, { useCallback, useEffect, useState } from "react";
import { Color, ColorRepresentation } from "three";
import * as Clipboard from 'expo-clipboard';
import { exportPoints, exportPointsAsText, importPoints, importPointsFromText, MAX_DATA_EXPORT } from "@helpers/export";
import InstancedRenderedPoint from "@helpers/3DElements/InstancedRenderedPoint";
import { useSceneWithControlsContext, VIEW_TYPE } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { getRandomColorHex } from "@helpers/RNGUtils";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogOverlay } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { SAMPLE_POINT_CLOUDS } from "@geometry/samplePointClouds";
import ImportExportPointCloudDialog from "@components/ImportExportPointCloudDialog";

export interface RenderPointCloudProps {
    name: string;
    color?: ColorRepresentation;
    size?: number;
    minNumberOfPoints?: number;
    maxNumberOfPoints?: number;
    minZ?: number;
    maxZ?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    children?: (points: Point3[]) => React.ReactNode;
}

const RNGRenderPointCloud: React.FC<RenderPointCloudProps> = ({
    name,
    color = undefined,
    size = 0.05,
    minNumberOfPoints = 1000,
    maxNumberOfPoints = 20000,
    minZ = -5,
    maxZ = 5,
    minX = -5,
    maxX = 5,
    minY = -5,
    maxY = 5,
    children = undefined
}) => {

    if (!color) {
        color = getRandomColorHex();
    } else if (color instanceof Color) {
        color = `#` + color.getHexString();
    }

    const startColor = useValidColorHex(color);

    const ctx = useSceneWithControlsContext();
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const [usedColor, setUsedColor] = useState<string>(startColor);
    const [points, setPoints] = useState<Point3[]>([]);
    const [nPoints, setNPoints] = useState<number>(2);
    const [rngType, setRNGType] = useState<PointGenerationType>(PointGenerationType.RANDOM_BRUTE_FORCE);

    const [values, setControls] = useControls(`Núvem de pontos ${name}`, () => {
        const ret: any = {}
        ret['Gerar núvem de pontos'] = button((get) => {
            genPoints();
        })
        ret['Pontos renderizados'] = { value: nPoints, min: minNumberOfPoints, max: maxNumberOfPoints, step: 1 };
        ret['Tipo RNG'] = { value: rngType, options: Object.values(PointGenerationType) };
        ret['Cor'] = { value: startColor };
        ret['Randomizar pontos'] = button((get) => {
            setControls({ 'Pontos renderizados': Math.floor(minNumberOfPoints) + Math.floor(Math.random() * (maxNumberOfPoints - minNumberOfPoints)) });
        })
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
    }, [nPoints, points, name, maxNumberOfPoints, minNumberOfPoints, startColor, rngType, usedColor, ctx.viewType]);

    const genPoints = useCallback(() => {
        if (nPoints >= 0) {
            const generatedPoints: Point3[] = generateRNGPointCloudBasedOnStrategy(nPoints, values['Tipo RNG'], maxX, minX, maxY, minY, ctx.viewType === VIEW_TYPE.PLANE_XY ? 0 : maxZ, ctx.viewType === VIEW_TYPE.PLANE_XY ? 0 : minZ);
            setPoints(generatedPoints);
        }
    }, [nPoints, values['Tipo RNG'], maxX, minX, maxY, minY, maxZ, minZ, ctx.viewType]);

    useEffect(() => {
        setNPoints(values['Pontos renderizados']);
    }, [values['Pontos renderizados']]);

    useEffect(() => {
        genPoints();
    }, [values['Tipo RNG'], nPoints, minX, maxX, minY, maxY, minZ, maxZ]);

    return (
        <>
            {
                children instanceof Function && children(points)
            }
            <InstancedRenderedPoint points={points.map(x => x.toVector3())} color={values['Cor'] || 'black'} size={size} />
            <Html>
                <ImportExportPointCloudDialog 
                    importDialogOpen={importDialogOpen} 
                    setImportDialogOpen={setImportDialogOpen} 
                    points={points} 
                    setPoints={setPoints} 
                />
            </Html>
        </>
    );
};

export default RNGRenderPointCloud;