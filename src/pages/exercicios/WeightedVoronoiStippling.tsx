import { CompositionMode } from "@components/CanvasCompositionMode";
import HeaderWithBackButton from "@components/HeaderWithBackButton";
import { multiplyPointByScalar } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { CANVAS_VORONOI_PIXEL_RATIO, CANVAS_VORONOI_STIPPLE_SCALE, drawWeightedVoronoiStipplingTextureOnExistingCanvas, fromVoronoiCanvasStipple, toVoronoiCanvasStipple, VORONOI_DEFAULT_CANVAS_FACTOR, VoronoiDiagram, VoronoiPlainObject, VoronoiWeightMethod } from "@geometry/voronoi";
import { VoronoiWorkerObject } from "@geometry/voronoiWorker";
import { folder, useControls } from "leva";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

const WEIGHT_THRESHOLD_FACTOR = 1000;

function extractNonTransparentPoints(data : { width: number, height: number, pixels : Uint8ClampedArray }, targetWidth : number, targetHeight : number, skipUnclearPoints : boolean, numberOfPoints : number = 5000) {
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
        if(!skipUnclearPoints || (a !== 0 && Math.random() > brightness)) {
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
    const [ imagePath, setImagePath ] = useState<string|undefined>("logo.png");

    const [ discardLowWeight, setDiscardLowWeight ] = useState(false);

    const dims = useWindowDimensions();
    const marginTop = 60;
    const width = dims.width;
    const height = dims.height - marginTop;
    const myTargetSpace = 6;
    
    const [ values, setControls ] = useControls("Weighted Voronoi Stippling", () => ({
        'image': { image: imagePath },
        'image-preset': { options: [
            "checkboard.avif",
            "gradient-1.jpg",
            "color-wheel.png",
            "pattern-wave.avif",
            "radial-gradient.jpg",
            "Silvio-Santos-2.png",
            "sombrero-galaxy.jpg",
            "pillars_of_creation.webp",
            "enterprise.png",
            "zebra.jpg",
            "brad.png",
            "hands.png",
            "hands2.jpg",
            "japanese.jpg",
            "logo-blur1.png",
            "logo-blur2.png",
            "logo-blur3.png",
            "logo.png",
            "mark.png",
            "polar-bear.png",
            "smiley.jpeg",
            "spock-removebg.png",
            "spock.png",
            "woman.png"
        ], value: 'logo.png' },
        'numberOfPoints': { min: 3, max: 20000, value: 1000 },
        'minDotSize': { min: 0, max: 3, value: 0.5, step: 0.01 },
        'maxDotSize': { min: 0, max: 3, value: 1.5, step: 0.01 },
        'image-opts': folder({
            'i-visible': { value: true },
            'compositionMode': { options:  Object.entries(CompositionMode).map(x => x[1]), value: CompositionMode.Darken },
            'imageOpacity': { min: 0, max: 1, value: 0.15, step: 0.05 },
        }),
        'voronoi-opts': folder({
            'seeds': true,
            'centroids': false,
            'edges': false,
            'fillEdge': false,
            'coloredStipples': false,
            'skipUnclearPoints': false,

        }),
        'triangulation-opts': folder({
            't-visible': false,
            't-opacity': { min: 0, max: 1, value: 0.5, step: 0.01 },
            't-color': { value: '#ff0000' },
            't-skip-with-alpha': { min: 0, max: 1, value: 0.95, step: 0.01 },
            't-fill': { value: false },
            't-stroke': { value: true },
            'lineWidth': { min: 0.15, max: 2, value: 0.15, step: 0.05 },
        }),
        'weight-opts': folder({
            'weightType': { options:  Object.entries(VoronoiWeightMethod).map(x => x[1]), value: VoronoiWeightMethod.SIMPLE_BRIGHTNESS },
            'discardLowWeight': discardLowWeight,
            'discardThreshold': { min: 0, max: WEIGHT_THRESHOLD_FACTOR, value: 0.125 * WEIGHT_THRESHOLD_FACTOR, step: 0.001 * WEIGHT_THRESHOLD_FACTOR, disabled: !discardLowWeight }                
        })
    }), [ discardLowWeight, imagePath ]);

    useEffect(() => {
        setImagePath(values['image']);
    }, [ values['image'] ]);

    useEffect(() => {
        setImagePath(values['image-preset']);
    }, [ values['image-preset'] ]);

    useEffect(() => {
        setDiscardLowWeight(values['discardLowWeight']);
    }, [ values['discardLowWeight'] ]);

    const [ cachedResizedImage, setCachedResizedImage ] = useState<HTMLCanvasElement|null>(null);

    const drawImageOnCanvas = useCallback((opacity = 0.5) => {
        let ctx = canvasRef.current?.getContext('2d', { alpha: true });
        if(ctx && imageData && cachedResizedImage && width && height) {
            const pixelRatio = CANVAS_VORONOI_PIXEL_RATIO;
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            ctx.clearRect(0, 0, width, height);
            if(opacity > 0) {
                const aspect = imageData.width / imageData.height;
                const targetWidthSrc = myTargetSpace;
                const targetHeightSrc = myTargetSpace / aspect;
                const factor = VORONOI_DEFAULT_CANVAS_FACTOR * CANVAS_VORONOI_STIPPLE_SCALE;
                const targetWidth = factor * targetWidthSrc;
                const targetHeight = factor * targetHeightSrc;   
                ctx.globalAlpha = opacity;
                ctx.drawImage(cachedResizedImage, (width / 2 - targetWidth / 2) / pixelRatio, (height / 2 - targetHeight / 2) / pixelRatio, targetWidth / pixelRatio, targetHeight / pixelRatio);
                ctx.globalAlpha = 1;
            }
        }
    }, [ cachedResizedImage, width, height ]);

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        if(window.Worker) {
            let worker = new Worker('./voronoiWorker.js');
            worker.onmessage = (event) => {
                const { result } : { result : VoronoiPlainObject } = event.data;
                const vd = VoronoiDiagram.fromPlainObject(result);
                setVoronoi(vd);
                if(vd && canvasRef.current && imageData) {
                    let pointsIt = vd.getWeightedVoronoiStipples(imageData, myTargetSpace, values['weightType'], values['discardLowWeight'] ? values['discardThreshold'] / WEIGHT_THRESHOLD_FACTOR : undefined);
                    const seeds = result.shapes.map(x => x.seed);
                    const alreadyWeighted = pointsIt.every((x, idx) => ((seeds[idx].x - x.x) + (seeds[idx].y - x.y)) <= 1E-8);
                    if(!alreadyWeighted) {
                        workerRef.current?.postMessage({ points: pointsIt.map(point => [ point.x, point.y ]), width: width, height: height } as VoronoiWorkerObject);
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
        if(imagePath) {
            getImagePixels(imagePath)
                .then(data => {
                    const id = new ImageData(data.pixels, data.width, data.height);
                    setImageData(id);
                    const aspect = data.width / data.height;
                    const targetWidth = myTargetSpace;
                    const targetHeight = myTargetSpace / aspect;
                    let p = extractNonTransparentPoints(data, targetWidth, targetHeight, values['skipUnclearPoints'], values['numberOfPoints']);
                    setPoints(p);
                    /* resized image */
                    const srcCanvas = document.createElement('canvas');
                    const srcCtx = srcCanvas.getContext('2d', { alpha: false });
                    srcCanvas.width = id.width;
                    srcCanvas.height = id.height;
                    srcCtx?.putImageData(id, 0, 0);
                    setCachedResizedImage(srcCanvas);
                })
        }
        return () => {
            setImageData(undefined);
            setCachedResizedImage(null);
        }
    }, [ imagePath, width, height, values['numberOfPoints'], values['weightType'], values['skipUnclearPoints'], values['discardLowWeight'], values['discardThreshold'] ]);

    useEffect(() => {
        try {
            if(canvasRef.current && imageData) {
                workerRef.current?.postMessage({ points: points.map(point => [ point.x, point.y ]), width: width, height: height } as VoronoiWorkerObject);
            }
        } catch (e) {
            console.error(e)
        }
    }, [ points, width, height ]);

    const offscreenCanvas = useMemo(() => canvasRef.current, [ canvasRef.current ]);
    const offscreenContext = useMemo(() => offscreenCanvas?.getContext('2d', { alpha: true }), [ offscreenCanvas ]);

    useEffect(() => {
        if(canvasRef.current && offscreenContext && imageData && voronoi) {
            drawImageOnCanvas(values['i-visible'] ? values['imageOpacity'] : 0);
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
                values['t-visible'], 
                VORONOI_DEFAULT_CANVAS_FACTOR, 
                false, 
                values['minDotSize'],
                values['maxDotSize'],
                values['lineWidth'],
                values['coloredStipples'],
                values['compositionMode'],
                values['weightType'], 
                values['discardLowWeight'] ? values['discardThreshold'] / WEIGHT_THRESHOLD_FACTOR : undefined,
                values['t-opacity'],
                values['t-color'],
                values['t-fill'],
                values['t-skip-with-alpha'],
                values['t-stroke']
            );
        }
    }, [ 
        voronoi, 
        values['i-visible'],
        values['t-opacity'], values['t-color'], values['fillEdge'], 
        values['seeds'], values['edges'], values['t-visible'], values['centroids'], 
        values['maxDotSize'], values['minDotSize'], values['lineWidth'], values['coloredStipples'], 
        values['imageOpacity'], values['compositionMode'], values['weightType'], values['discardLowWeight'], values['discardThreshold'],
        values['t-fill'],
        values['t-skip-with-alpha'],
        values['t-stroke'] ]);

    return (
        <>
            <HeaderWithBackButton title="Trabalho - Weighted Voronoi Stippling" />
            <canvas width={width} height={height} ref={canvasRef} />
        </>
    )
}