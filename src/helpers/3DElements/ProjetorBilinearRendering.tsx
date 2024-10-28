import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogTitle } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { multiplyPointByScalar } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { createDebugLine } from "@helpers/3DElements/Debug/debugVisualElements";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { Html } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";

const curvas1 = `9
147  152
230  194
296  211
357  213
414  210
475  204
550  189
622  159
690  129
6
148  483
262  454
347  438
455  439
547  454
665  479
6
147  152
190  242
211  310
213  370
194  421
148  483
5
690  129
646  223
633  319
636  406
665  479
`;

const curvas2 = `2
144  158
643  161
10
136  530
202  466
255  432
313  406
371  398
436  397
502  402
553  422
590  448
622  490
7
144  158
77  240
48  309
50  380
62  436
89  488
136  530
6
643  161
695  228
712  286
702  364
671  429
622  490
`;

const curvas3 = `2
0  0
1000  0
2
0  1000
1000  1000
2
0  0
0  1000
2
1000  0
1000  1000
`;

const curvas4 = `2
0  0
1200  0
2
0  1000
1000  1000
2
0  0
0  1000
2
1200  0
1000  1000
`;

const curvas5 = `2
-200  0
1200  0
2
0  1000
1000  1000
2
-200  0
0  1000
2
1200  0
1000  1000
`;

const curvas6 = `2
0  0
1000  0
2
-200  1000
1200  1000
2
0  0
-200  1000
2
1000  0
1200  1000
`;

function parseCurvePoints(lines: string[], ini: number) {

    if (!/^\d+$/.test(lines[ini])) {
        throw new Error("Primeira linha deve conter número de pontos.");
    }

    const [nPontos] = lines[ini].split(' ').map(Number);

    const verticesLines = lines.slice(ini + 1, ini + nPontos + 1);

    const vertices: Point3[] = [];
    for (let i = 0; i < verticesLines.length; i++) {
        const vertexLine = verticesLines[i].trim();
        if (!/^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/.test(vertexLine)) {
            throw new Error(`Vértice na linha ${i} não está no formato esperado (dois números separados por espaço).`);
        }
        const [x, y] = vertexLine.split(/\s+/).map(Number);
        vertices.push(new Point3(x, y, 0));
    }

    return vertices;
}

function parseCurveTxt(input: string): [Point3[], Point3[], Point3[], Point3[]] {

    const lines = input.trim().split('\n');

    let bottomCurve = parseCurvePoints(lines, 0);
    let topCurve = parseCurvePoints(lines, bottomCurve.length + 1);
    let leftCurve = parseCurvePoints(lines, bottomCurve.length + 1 + topCurve.length + 1);
    let rightCurve = parseCurvePoints(lines, bottomCurve.length + 1 + topCurve.length + 1 + leftCurve.length + 1);

    return [bottomCurve, topCurve, leftCurve, rightCurve];
}

interface PropsImporter {
    importDialogOpen: boolean,
    setImportDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setBottomCurvePoints: (result: Point3[]) => void
    setTopCurvePoints: (result: Point3[]) => void
    setLeftCurvePoints: (result: Point3[]) => void
    setRightCurvePoints: (result: Point3[]) => void
}

function DataImporter(props: PropsImporter) {
    const [pointsAsText, setPointsAsText] = useState('');
    const [descriptionText, setDescriptionText] = useState('');
    useEffect(() => {
        if (props.importDialogOpen) {
            setPointsAsText('');
        }
        setDescriptionText('');
    }, [props.importDialogOpen]);

    return (
        <Dialog open={props.importDialogOpen}>
            <DialogOverlay />
            <DialogContent closeCb={() => props.setImportDialogOpen(false)}>
                <DialogHeader>
                    <DialogTitle>Import/Export data</DialogTitle>
                    <DialogDescription>
                        Definição das quatro curvas<br />
                        Cada uma das curvas é o número de pontos descritos seguido dos pontos<br />
                        A ordem é: curva inferior, curva superior, curva esquerda, curva direita
                    </DialogDescription>
                </DialogHeader>
                <div>{descriptionText}</div>
                <Textarea className={"h-[400px] resize-none"} defaultValue={pointsAsText} onChange={(ev) => setPointsAsText(ev.target.value)} />
                <Button onClick={() => {
                    try {
                        const generated = parseCurveTxt(pointsAsText);
                        props.setBottomCurvePoints(generated[0]);
                        props.setTopCurvePoints(generated[1]);
                        props.setLeftCurvePoints(generated[2]);
                        props.setRightCurvePoints(generated[3]);
                        props.setImportDialogOpen(false);
                    } catch (e) {
                        alert(e);
                    }
                }}>Update</Button>
            </DialogContent>
        </Dialog>
    )
}

interface Exercicio4Props {
    children?: (bottomCurvePoints: Point3[], topCurvePoints: Point3[], leftCurvePoints: Point3[], rightCurvePoints: Point3[], segments : number) => React.ReactNode;
    initialData?: [Point3[], Point3[], Point3[], Point3[]]
}

enum TipoCurvas {
    CURVAS_1 = 'CURVAS_1',
    CURVAS_2 = 'CURVAS_2',
    CURVAS_3 = 'CURVAS_3',
    CURVAS_4 = 'CURVAS_4',
    CURVAS_5 = 'CURVAS_5',
    CURVAS_6 = 'CURVAS_6',
    SENO_RNG = 'SENO_RNG'
}

const Exercicio4Loader: React.FC<Exercicio4Props> = ({
    children = undefined,
    initialData = [],
}) => {

    const ctx = useSceneWithControlsContext();

    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const [bottomCurvePoints, setBottomCurvePoints] = useState<Point3[]>(initialData[0] || []);
    const [topCurvePoints, setTopCurvePoints] = useState<Point3[]>(initialData[1] || []);
    const [leftCurvePoints, setLeftCurvePoints] = useState<Point3[]>(initialData[2] || []);
    const [rightCurvePoints, setRightCurvePoints] = useState<Point3[]>(initialData[3] || []);
    
    const [ paramT, setParamT ] = useState(0);
    const [ selected, setSelected ] = useState(TipoCurvas.CURVAS_1);
    const [ segments, setSegments ] = useState(16);

    const mapCurvas = {
        [TipoCurvas.CURVAS_1]: curvas1,
        [TipoCurvas.CURVAS_2]: curvas2,
        [TipoCurvas.CURVAS_3]: curvas3,
        [TipoCurvas.CURVAS_4]: curvas4,
        [TipoCurvas.CURVAS_5]: curvas5,
        [TipoCurvas.CURVAS_6]: curvas6
    };

    useEffect(() => {
        let int = setInterval(() => {
            setParamT(old => old + 0.05);
        }, 50);
        return () => clearInterval(int);
    }, []);

    const [values, setControls] = useControls(`Exercício 4`, () => {
        const ret: any = {}
        ret['Dados da vizualização'] = folder({
            'Import/Export pontos': button(async () => {
                setImportDialogOpen(true);
            })
        });
        const styles = Object.entries(TipoCurvas).map(x => x[1]).filter(x => typeof x === 'string');
        ret['Curvas'] = { value: selected, options: styles };
        return ret;
    }, [ctx.viewType, bottomCurvePoints, topCurvePoints, leftCurvePoints, rightCurvePoints]);

    useEffect(() => {
        const v = values['Curvas'] as TipoCurvas;
        if(selected !== v && v !== TipoCurvas.SENO_RNG) {
            const data = parseCurveTxt(mapCurvas[v]);
            setBottomCurvePoints(data[0]);
            setTopCurvePoints(data[1]);
            setLeftCurvePoints(data[2]);
            setRightCurvePoints(data[3]);
        } else if(v === TipoCurvas.SENO_RNG) {
            let topSinePoints : Point3[] = [];
            let bottomSinePoints : Point3[] = [];
            let leftPoints: Point3[] = [];
            let rightPoints: Point3[] = [];
            const sineSegments = segments + 1;
            const sineBufferSize = 100;
            let sineDiffs = Array.from({ length: sineSegments }, (_, idx) => (sineBufferSize * ((1 + Math.sin(paramT + idx)) / 2)));
            const maxSizeX = 1000;
            const maxSizeY = 1000;
            const segmentSize = 1000 / sineSegments;
            for(let i = 0; i < sineSegments; i++) {
                let x = (i + 1) * segmentSize;
                topSinePoints.push(new Point3(x, maxSizeY - sineDiffs[i], 0));
                bottomSinePoints.push(new Point3(x, 0 + sineDiffs[sineSegments - 1 - i], 0));
            }
            rightPoints.push(bottomSinePoints[sineSegments - 1].clone());
            leftPoints.push(bottomSinePoints[0].clone());
            for (let i = 1; i < (sineSegments - 1); i++) {
                let t = i / (sineSegments - 1);
                let rightX = bottomSinePoints[sineSegments - 1].x + sineDiffs[i] * 0.5;
                let rightY = bottomSinePoints[sineSegments - 1].y * (1 - t) + topSinePoints[sineSegments - 1].y * t;
                rightPoints.push(new Point3(rightX, rightY, 0));
                let leftX = bottomSinePoints[0].x - sineDiffs[i] * 0.5;
                let leftY = bottomSinePoints[0].y * (1 - t) + topSinePoints[0].y * t;
                leftPoints.push(new Point3(leftX, leftY, 0));
            }
            rightPoints.push(topSinePoints[sineSegments - 1].clone());
            leftPoints.push(topSinePoints[0].clone());
            setBottomCurvePoints(bottomSinePoints);
            setTopCurvePoints(topSinePoints);
            setLeftCurvePoints(leftPoints);
            setRightCurvePoints(rightPoints);
        }
        setSelected(v);
    }, [ values['Curvas'], paramT ]);

    return (
        <>
            {
                children instanceof Function && children(bottomCurvePoints, topCurvePoints, leftCurvePoints, rightCurvePoints, segments)
            }
            <Html>
                <DataImporter
                    importDialogOpen={importDialogOpen}
                    setImportDialogOpen={setImportDialogOpen}
                    setBottomCurvePoints={setBottomCurvePoints}
                    setTopCurvePoints={setTopCurvePoints}
                    setLeftCurvePoints={setLeftCurvePoints}
                    setRightCurvePoints={setRightCurvePoints}
                />
            </Html>
        </>
    );
};

function pointsAsParametric(points: Point3[]): (t: number) => Point3 {
    return (t: number) => {
        const n = points.length - 1;
        const scaledT = t * n;
        const segment = Math.floor(scaledT);
        const localT = scaledT - segment;

        const p1 = points[segment];
        const p2 = points[Math.min(segment + 1, n)];

        return Point3.lerp(p1, p2, localT);
    };
}

function InternalProjetorBilinearRendering({ bottomCurvePoints, topCurvePoints, leftCurvePoints, rightCurvePoints, segments = 16 }:
    { bottomCurvePoints: Point3[], topCurvePoints: Point3[], leftCurvePoints: Point3[], rightCurvePoints: Point3[], segments?: number }) {

    const ctx = useSceneWithControlsContext();

    const bottomCurve = pointsAsParametric(bottomCurvePoints || []);
    const topCurve = pointsAsParametric(topCurvePoints || []);
    const leftCurve = pointsAsParametric(leftCurvePoints || []);
    const rightCurve = pointsAsParametric(rightCurvePoints || []);

    useEffect(() => {
        ctx.setCameraInitialPosition(new Vector3(500, 500, 9500));
        ctx.setCameraFixedLookAt(new Vector3(500, 500, 0));
        ctx.setCameraInitialZoom(0.75);
    }, []);

    const interpolacaoCurvaY = useCallback(
        (u: number, v: number) =>
            multiplyPointByScalar(leftCurve(u), (1 - v)).add(
                multiplyPointByScalar(rightCurve(u), (v))),
        [leftCurve, rightCurve]
    );

    const interpolacaoCurvaX = useCallback(
        (u: number, v: number) =>
            multiplyPointByScalar(bottomCurve(v), (1 - u)).add(
                multiplyPointByScalar(topCurve(v), (u))),
        [topCurve, bottomCurve]
    );
    
    const mapWithinXYSpace = (u: number, v: number) => {
        const bottomLeftX = interpolacaoCurvaX(0, 0);
        const bottomRightX = interpolacaoCurvaX(1, 0);
        const topRightX = interpolacaoCurvaX(1, 1);
        const topLeftX = interpolacaoCurvaX(0, 1);
        const term1 = multiplyPointByScalar(new Point3(bottomLeftX.x, bottomLeftX.y), (1 - u) * (1 - v));
        const term2 = multiplyPointByScalar(new Point3(bottomRightX.x, bottomRightX.y), u * (1 - v));
        const term3 = multiplyPointByScalar(new Point3(topRightX.x, topRightX.y), u * v);
        const term4 = multiplyPointByScalar(new Point3(topLeftX.x, topLeftX.y), (1 - u) * v);
        return term1.add(term2).add(term3).add(term4);
    };

    const calculateFinalPosition = (u : number, v : number) => 
        (
        interpolacaoCurvaX(u, v)
            .add(
                interpolacaoCurvaY(u, v)
            )
        ).sub(
            mapWithinXYSpace(u, v)
        );

    const step = 1 / segments;

    return (
        <>
            <primitive object={createDebugLine(bottomCurvePoints)} />
            <primitive object={createDebugLine(topCurvePoints)} />
            <primitive object={createDebugLine(leftCurvePoints)} />
            <primitive object={createDebugLine(rightCurvePoints)} />
            {Array.from({ length: segments - 1 }, (_, i) => {
                const u = (i + 1) * step;
                const linePoints = Array.from({ length: segments + 1 }, (_, j) => {
                    const v = j * step;
                    return calculateFinalPosition(u, v);
                });
                return <primitive key={`h-line-${i}`} object={createDebugLine(linePoints)} />;
            })}
            {Array.from({ length: segments - 1 }, (_, j) => {
                const v = (j + 1) * step;
                const linePoints = Array.from({ length: segments + 1 }, (_, i) => {
                    const u = i * step;
                    return calculateFinalPosition(u, v);
                });
                return <primitive key={`v-line-${j}`} object={createDebugLine(linePoints)} />;
            })}
        </>
    )
}

export default function ProjetorBilinearRendering() {
    const initialData = parseCurveTxt(curvas2);
    return (
        <>
            <Exercicio4Loader initialData={initialData}>
                {(c1, c2, c3, c4, segments) => 
                    <InternalProjetorBilinearRendering bottomCurvePoints={c1} topCurvePoints={c2} leftCurvePoints={c3} rightCurvePoints={c4} segments={segments} />}
            </Exercicio4Loader>
        </>
    )
}