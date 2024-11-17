import { CompositionMode } from "@components/CanvasCompositionMode";
import HeaderWithBackButton from "@components/HeaderWithBackButton";
import { multiplyPointByScalar } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { CANVAS_VORONOI_STIPPLE_SCALE, drawWeightedVoronoiStipplingTextureOnExistingCanvas, fromVoronoiCanvasStipple, toVoronoiCanvasStipple, VoronoiDiagram, voronoiDiagramFromD3Delaunay, voronoiDiagramFromDelaunay, VoronoiPlainObject } from "@geometry/voronoi";
import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

function extractNonTransparentPoints(data : { width: number, height: number, pixels : Uint8ClampedArray }, targetWidth : number, targetHeight : number, numberOfPoints : number = 5000) {
    const points = [];
    
    const pointsToExtract = numberOfPoints;

    let retryLimit = pointsToExtract * 10;
    let retryCount = 0;

    for(let i = 0; i < pointsToExtract; i++) {
        let x = Math.ceil(data.width * Math.random());
        let y = Math.ceil(data.height * Math.random());
        const index = (y * data.width + x) * 4;
        const r = data.pixels[index + 0];
        const g = data.pixels[index + 1];
        const b = data.pixels[index + 2];
        const a = data.pixels[index + 3];
        const brightness = ((r + g + b) / 3) / 255;
        if(a !== 0 && Math.random() > brightness) {
            const p = toVoronoiCanvasStipple(x, y, targetWidth, targetHeight, data.width, data.height);
            points.push(p);
        } else if (++retryCount < retryLimit) {
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
            'triangulation': true,
            'fillEdge': false,
            'coloredStipples': true,
            'numberOfPoints': { min: 100, max: 20000, value: 1000 },
            'minDotSize': { min: 0.25, max: 3, value: 0.5, step: 0.05 },
            'maxDotSize': { min: 0.25, max: 3, value: 1.5, step: 0.05 },
            'lineWidth': { min: 0.15, max: 2, value: 0.15, step: 0.05 },
            'imageOpacity': { min: 0, max: 1, value: 0.15, step: 0.05 },
            'compositionMode': { options:  Object.entries(CompositionMode).map(x => x[1]), value: CompositionMode.Darken }
        })
    })

    const drawImageOnCanvas = (opacity = 0.5) => {
        let ctx = canvasRef.current?.getContext('2d', { alpha: true });
        if(ctx && imageData) {
            const srcCanvas = document.createElement('canvas');
            const srcCtx = srcCanvas.getContext('2d', { alpha: false });
            srcCanvas.width = imageData.width;
            srcCanvas.height = imageData.height;
            srcCtx?.putImageData(imageData, 0, 0);
            const aspect = imageData.width / imageData.height;
            const targetWidthSrc = myTargetSpace;
            const targetHeightSrc = myTargetSpace / aspect;
            const factor = 40 * CANVAS_VORONOI_STIPPLE_SCALE;
            const pixelRatio = 2;
            const targetWidth = factor * targetWidthSrc;
            const targetHeight = factor * targetHeightSrc;
            ctx.clearRect(0, 0, width, height);
            ctx.globalAlpha = opacity;
            ctx.drawImage(srcCanvas, (width / 2 - targetWidth / 2) / pixelRatio, (height / 2 - targetHeight / 2) / pixelRatio, targetWidth / pixelRatio, targetHeight / pixelRatio);
            ctx.globalAlpha = 1;
        }
    }

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        if(window.Worker) {
            let worker = new Worker('./voronoiWorker.js');
            worker.onmessage = (event) => {
                const { result } : { result : VoronoiPlainObject } = event.data;
                const vd = VoronoiDiagram.fromPlainObject(result);
                setVoronoi(vd);
                if(vd && canvasRef.current && imageData) {
                    let pointsIt = vd.getWeightedVoronoiStipples(imageData, myTargetSpace);
                    const seeds = result.shapes.map(x => x.seed);
                    const alreadyWeighted = pointsIt.every((x, idx) => ((seeds[idx].x - x.x) + (seeds[idx].y - seeds[idx].y)) <= 1E-8);
                    if(!alreadyWeighted) {
                        workerRef.current?.postMessage({ points: pointsIt.map(point => [ point.x, point.y ]), width: width, height: height });
                    }
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
                    let p = extractNonTransparentPoints(data, targetWidth, targetHeight, values['numberOfPoints']);
                    setPoints(p);
                })
        }
    }, [ values['image'], width, height, values['numberOfPoints'] ]);

    useEffect(() => {
        try {
            if(canvasRef.current && imageData) {
                let setPoints = points;
                let pointsIt = setPoints;
                workerRef.current?.postMessage({ points: pointsIt.map(point => [ point.x, point.y ]), width: width, height: height });
            }
        } catch (e) {
            console.error(e)
        }
    }, [ points, width, height ]);

    const offscreenCanvas = useMemo(() => canvasRef.current, [ canvasRef.current ]);
    const offscreenContext = useMemo(() => offscreenCanvas?.getContext('2d', { alpha: true }), [ offscreenCanvas ]);

    useEffect(() => {
        if(canvasRef.current && offscreenContext && imageData && voronoi) {
            drawImageOnCanvas(values['imageOpacity']);     
            drawWeightedVoronoiStipplingTextureOnExistingCanvas(
                canvasRef.current, 
                offscreenContext, 
                imageData, 
                myTargetSpace, 
                voronoi, 
                values['fillEdge'], 
                values['seeds'], 
                values['centroids'], 
                values['edges'], 
                values['triangulation'], 
                40, 
                false, 
                values['minDotSize'],
                values['maxDotSize'],
                values['lineWidth'],
                values['coloredStipples'],
                values['compositionMode']
            );
        }
    }, [ voronoi, values['fillEdge'], values['seeds'], values['edges'], values['triangulation'], values['centroids'], values['maxDotSize'], values['minDotSize'], values['lineWidth'], values['coloredStipples'], values['imageOpacity'], values['compositionMode'] ]);

    return (
        <>
            <HeaderWithBackButton title="Trabalho - Weighted Voronoi Stippling" />
            <canvas width={width} height={height} ref={canvasRef} />
        </>
    )
}