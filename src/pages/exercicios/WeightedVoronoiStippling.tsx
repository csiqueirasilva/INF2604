import HeaderWithBackButton from "@components/HeaderWithBackButton";
import { multiplyPointByScalar } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { drawWeightedVoronoiStipplingTextureOnExistingCanvas, fromVoronoiCanvasStipple, toVoronoiCanvasStipple, VoronoiDiagram, voronoiDiagramFromD3Delaunay, voronoiDiagramFromDelaunay } from "@geometry/voronoi";
import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

function extractNonTransparentPoints(data : { width: number, height: number, pixels : Uint8ClampedArray }, targetWidth : number, targetHeight : number) {
    const points = [];
    
    const pointsToExtract = 1000;

    for(let i = 0; i < pointsToExtract; i++) {
        let x = Math.ceil(data.width * Math.random());
        let y = Math.ceil(data.height * Math.random());
        const index = (y * data.width + x) * 4;
        const r = data.pixels[index + 0];
        const g = data.pixels[index + 1];
        const b = data.pixels[index + 2];
        const brightness = (0.21 * r) + (0.72 * g) + (0.07) * b;
        if(brightness > 0.1) {
            const p = toVoronoiCanvasStipple(x, y, targetWidth, targetHeight, data.width, data.height);
            points.push(p);
        } else {
            i--;
        }
    }

    return points;
}

function getImagePixels(imagePath : string) : Promise<{ width: number, height: number, pixels : Uint8ClampedArray }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if(context) {

                canvas.width = img.width;
                canvas.height = img.height;

                context.drawImage(img, 0, 0);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                resolve({
                    width: canvas.width,
                    height: canvas.height,
                    pixels: imageData.data, 
                });

            }
        };

        img.onerror = (error) => {
            reject(new Error("Failed to load the image."));
        };

        img.src = imagePath;
    });
}

export default function WeightedVoronoiStippling() {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [ points, setPoints ] = useState<Point3[]>([]);
    const [ imageData, setImageData ] = useState<ImageData>();
    const [ voronoi, setVoronoi ] = useState<VoronoiDiagram>();

    const dims = useWindowDimensions();
    const marginTop = 60;
    const width = dims.width;
    const height = dims.height - marginTop;
    const myTargetSpace = 6;
    
    const values = useControls({
        'Voronoi': folder({
            'image': { image: '/logo.png' },
            'seeds': true,
            'centroids': true,
            'edges': true,
            'triangulation': true
        })
    })

    const drawImageOnCanvas = () => {
        let ctx = canvasRef.current?.getContext('2d', { alpha: false});
        if(ctx && imageData) {
            ctx.clearRect(0, 0, width, height);
            ctx.putImageData(imageData, 0, 0);
        }
    }

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        if(window.Worker) {
            let worker = new Worker('./voronoiWorker.js');
            worker.onmessage = (event) => {
                const { result } = event.data;
                const vd = VoronoiDiagram.fromPlainObject(result);
                setVoronoi(vd);
                if(vd && !vd.isCentroidal() && canvasRef.current && imageData) {
                    const aspect = imageData.width / imageData.height;
                    const voronoiWidth = myTargetSpace;
                    const voronoiHeight = myTargetSpace / aspect;
                    let pointsIt = vd.getWeightedVoronoiStipples(imageData, myTargetSpace);
                    workerRef.current?.postMessage({ points: pointsIt.map(point => ({ x: point.x, y: point.y })), width: voronoiWidth, height: voronoiHeight });
                }
            };
            workerRef.current = worker;
        }
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [ imageData ]);


    useEffect(() => {
        if(values['image']) {
            getImagePixels(values['image'])
                .then(data => {
                    const id = new ImageData(data.pixels, data.width, data.height);
                    setImageData(id);
                    const aspect = data.width / data.height;
                    const targetWidth = myTargetSpace;
                    const targetHeight = myTargetSpace / aspect;
                    let p = extractNonTransparentPoints(data, targetWidth, targetHeight);
                    setPoints(p);
                })
        }
    }, [ values['image'], width, height ]);

    useEffect(() => {
        try {
            if(canvasRef.current && imageData) {
                let setPoints = points;
                const aspect = imageData.width / imageData.height;
                const voronoiWidth = myTargetSpace;
                const voronoiHeight = myTargetSpace / aspect;
                let pointsIt = setPoints;
                workerRef.current?.postMessage({ points: pointsIt.map(point => ({ x: point.x, y: point.y })), width: voronoiWidth, height: voronoiHeight });
            }
        } catch (e) {
            console.error(e)
        }
    }, [ points, width, height ]);

    const offscreenCanvas = useMemo(() => canvasRef.current, [ canvasRef.current ]);
    const offscreenContext = useMemo(() => offscreenCanvas?.getContext('2d'), [ offscreenCanvas ]);

    useEffect(() => {
        if(canvasRef.current && offscreenContext && imageData && voronoi) {
            drawImageOnCanvas();     
            drawWeightedVoronoiStipplingTextureOnExistingCanvas(canvasRef.current, offscreenContext, imageData, myTargetSpace, voronoi, values['seeds'], values['centroids'], values['edges'], values['triangulation'], 40, false);
        }
    }, [ voronoi, values['seeds'], values['edges'], values['triangulation'], values['centroids'] ]);

    return (
        <>
            <HeaderWithBackButton title="Trabalho - Weighted Voronoi Stippling" />
            <canvas width={width} height={height} ref={canvasRef} />
        </>
    )
}