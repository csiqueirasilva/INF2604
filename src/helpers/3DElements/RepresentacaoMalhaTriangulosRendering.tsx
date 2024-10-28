import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogTitle } from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { orientation2D, OrientationCase } from "@geometry/affine";
import { DualGraph, HalfEdgeForDualGraph } from "@geometry/dualgraph";
import { Point3 } from "@geometry/points";
import { Triangle } from "@geometry/triangle";
import { createDebugDualGraphForTrianglesTraversalOrdered, createDebugTriangulatedSurface } from "@helpers/3DElements/Debug/debugVisualElements";
import { useSceneWithControlsContext } from "@helpers/3DElements/Scenes/SceneWithControlsContext";
import { Html } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { useEffect, useState } from "react";
import { Badge } from "react-native-paper";
import { Vector3 } from "three";

const malhaTxt = `13 20
100 400
50 50
1000 50
400 200
200 800
600 200
900 200
700 900
400 700
200 500
100 100
1000 1000
50 1000
0 1 10
1 0 12
0 3 9 
1 2 3 
3 2 5 
0 4 12
3 8 9 
3 5 8 
5 2 6 
5 6 7
4 7 12
5 7 8 
7 4 8 
4 0 9
8 4 9
1 3 10
3 0 10
6 2 11
7 6 11
7 11 12
`;

function parseMalhaTxt(input: string): [ Triangle[], Point3[] ] {
    const lines = input.trim().split('\n');

    if (!/^\d+\s+\d+$/.test(lines[0])) {
        throw new Error("Primeira linha deve conter número vértices e de triângulos respectivamente.");
    }

    const [numVertices, numTriangles] = lines[0].split(' ').map(Number);

    if (lines.length !== numVertices + numTriangles + 1) {
        throw new Error("Input não tem a quantidade de linhas para comportar o número de vértices mais o número de triângulos");
    }

    const vertices: Point3[] = [];
    for (let i = 1; i <= numVertices; i++) {
        const vertexLine = lines[i].trim();

        if (!/^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/.test(vertexLine)) {
            throw new Error(`Vértice na linha ${i} não está no formato esperado (dois números separados por espaço).`);
        }
        
        const [x, y] = vertexLine.split(' ').map(Number);
        vertices.push(new Point3(x, y, 0 ));
    }

    const triangles: Triangle[] = [];
    for (let i = numVertices + 1; i < numVertices + 1 + numTriangles; i++) {
        const triangleLine = lines[i].trim();
        
        if (!/^\d+\s+\d+\s+\d+$/.test(triangleLine)) {
            throw new Error(`Triângulo na linha ${i - numVertices} não está no formato esperado: três inteiros separados por espaço.`);
        }

        const [v1, v2, v3] = triangleLine.split(' ').map(Number);

        if (v1 >= numVertices || v2 >= numVertices || v3 >= numVertices) {
            throw new Error(`Triângulo na linha ${i - numVertices} tem vértices fora do intervalo esperado.`);
        } else if (orientation2D(vertices[v1], vertices[v2], vertices[v3]) !== OrientationCase.COUNTER_CLOCK_WISE) {
            throw new Error(`Triângulo na linha ${i - numVertices} não está em ordem anti-horária.`);
        }

        triangles.push(new Triangle([ vertices[v1], vertices[v2], vertices[v3] ]));
    }



    return [ triangles, vertices ];
}

interface PropsImporter {
    importDialogOpen: boolean,
    setImportDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setTriangles: (result : Triangle[]) => void  
    setVertices: (result : Point3[]) => void  
}

function DataImporter(props : PropsImporter) {
    const [ pointsAsText, setPointsAsText ] = useState('');
    const [ descriptionText, setDescriptionText ] = useState('');
    useEffect(() => {
        if(props.importDialogOpen) {
            setPointsAsText('');
        }
        setDescriptionText('');
    }, [ props.importDialogOpen ]);

    return (
        <Dialog open={props.importDialogOpen}>
            <DialogOverlay />
            <DialogContent closeCb={() => props.setImportDialogOpen(false)}>
                <DialogHeader>
                    <DialogTitle>Import/Export data</DialogTitle>
                    <DialogDescription>
                        Linha 1: Número de vértices e número de triângulos separado por espaço<br />
                        Linhas a seguir: Vértices no formato x y separados por espaço um em cada linha<br />
                        Linhas a seguir: Vértices dos triângulos no sentido anti horário, separados por espaço um em cada linha<br />
                    </DialogDescription>
                </DialogHeader>
                <div>{ descriptionText }</div>
                <Textarea className={"h-[400px] resize-none"} defaultValue={pointsAsText} onChange={(ev) => setPointsAsText(ev.target.value)} />
                <Button onClick={() => {
                    try {
                        const generated = parseMalhaTxt(pointsAsText);
                        props.setTriangles(generated[0]);
                        props.setVertices(generated[1]);
                        props.setImportDialogOpen(false);
                    } catch (e) {
                        alert(e);
                    }
                }}>Update</Button>
            </DialogContent>
        </Dialog>
    )
}

interface Exercicio3Props {
    children?: (points: Triangle[], vertices: Point3[]) => React.ReactNode;
    initialData?: [ Triangle[], Point3[] ]
}

const Exercicio3Loader: React.FC<Exercicio3Props> = ({
    children = undefined,
    initialData = [],
}) => {

    const ctx = useSceneWithControlsContext();

    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const [triangles, setTriangles] = useState<Triangle[]>(initialData[0] || []);
    const [vertices, setVertices] = useState<Point3[]>(initialData[1] || []);

    const [values, setControls] = useControls(`Exercício 3`, () => {
        const ret: any = {}
        ret['Dados da vizualização'] = folder({
            'Import/Export pontos': button(async () => {
                setImportDialogOpen(true);
            })
        })
        return ret;
    }, [ ctx.viewType, triangles, vertices ]);

    return (
        <>
            {
                children instanceof Function && children(triangles, vertices)
            }
            <Html>
                <DataImporter 
                    importDialogOpen={importDialogOpen} 
                    setImportDialogOpen={setImportDialogOpen} 
                    setTriangles={setTriangles} 
                    setVertices={setVertices}
                />
            </Html>
        </>
    );
};

function saveTextToFile(content: string, filename: string = 'malha_adj.txt'): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function InternalRepresentacaoMalhaTriangulosRendering({ triangles, vertices } : { triangles : Triangle[], vertices : Point3[] }) {

    const [ graph, setGraph ] = useState<DualGraph<Triangle>|undefined>(undefined);

    const ctx = useSceneWithControlsContext();

    useEffect(() => {
        ctx.setCameraInitialPosition(new Vector3(500, 500, 9500));
        ctx.setCameraFixedLookAt(new Vector3(500, 500, 0));
        ctx.setCameraInitialZoom(0.75);
    }, []);

    useEffect(() => {
        const g = new DualGraph<Triangle>(triangles);
        setGraph(g);
    }, [ triangles ]);

    const traversalOrder = graph?.getTraversalOrdered();

    const values = useControls({
        'Salvar saída do exercício': button(async () => {
            let acc = "";
            const numberOfVertices = vertices.length;
            const numberOfTriangles = triangles.length;
            acc += `${numberOfVertices} ${numberOfTriangles}\n`;
            if(traversalOrder) {
                let edgeAcc = '';
                const shapes = traversalOrder.map(n => n.shape);
                for(const node of traversalOrder) {
                    const nodeTriangleIdx = shapes.indexOf(node.shape);
                    acc += `${node.shape.points[0].x} ${node.shape.points[0].y} ${nodeTriangleIdx}\n`;
                    let he = node.firstHalfEdge;
                    const accIdxVertex : number[] = [];
                    const accIdxTwin : number[] = [];
                    do {
                        const idx1 = vertices.indexOf(he.vertex);
                        accIdxVertex.push(idx1);
                        accIdxTwin.push(he.twin ? shapes.indexOf(he.twin.node.shape) : -1);
                        he = he.next as HalfEdgeForDualGraph<Triangle>;
                    } while (he !== node.firstHalfEdge);
                    edgeAcc += `${accIdxVertex.join(' ')} ${accIdxTwin.join(' ')}\n`;
                }
                acc += edgeAcc;
                acc = acc.trim();
            }
            console.log(acc);
            saveTextToFile(acc);
        })
    }, [ triangles, vertices ])

    return (
        <>
            <primitive object={createDebugTriangulatedSurface(triangles)} />
            { graph && traversalOrder && 
                <>
                    <primitive object={createDebugDualGraphForTrianglesTraversalOrdered(graph)} />
                    { traversalOrder.map(( x, idx ) => 
                        <Html key={idx} position={x.center.toVector3()}>
                            <Badge style={{ paddingVertical: 1, paddingHorizontal: 2, backgroundColor: 'white', color: 'black', marginLeft: -10 }}>{ idx }</Badge>
                        </Html>
                    )}
                    { vertices.map(( x, idx ) => 
                        <Html key={idx} position={x.toVector3()}>
                            <Badge style={{ paddingVertical: 4, paddingHorizontal: 6, backgroundColor: 'white', color: 'red', borderColor: 'red', borderWidth: 2, marginLeft: -10 }}>{ idx }</Badge>
                        </Html>
                    )}
                </>
            }
        </>
    )
}

export default function RepresentacaoMalhaTriangulosRendering() {
    const initialData = parseMalhaTxt(malhaTxt);
    return (
        <>
            <Exercicio3Loader initialData={initialData} >
                { (triangles, vertices) => <InternalRepresentacaoMalhaTriangulosRendering triangles={triangles} vertices={vertices} /> }
            </Exercicio3Loader>
        </>
    )
}