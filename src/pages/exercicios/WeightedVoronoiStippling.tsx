import HeaderWithBackButton from "@components/HeaderWithBackButton";
import { multiplyPointByScalar } from "@geometry/affine";
import { Point3 } from "@geometry/points";
import { drawWeightedVoronoiStipplingTextureOnExistingCanvas, fromVoronoiCanvasStipple, toVoronoiCanvasStipple, VoronoiDiagram, voronoiDiagramFromDelaunay } from "@geometry/voronoi";
import { folder, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

function extractNonTransparentPoints(data : { width: number, height: number, pixels : Uint8ClampedArray }, targetWidth : number, targetHeight : number) {
    const points = [];
    
    const pointsToExtract = 500;

    for(let i = 0; i < pointsToExtract; i++) {
        let x = Math.ceil(data.width * Math.random());
        let y = Math.ceil(data.height * Math.random());
        const index = (y * data.width + x) * 4;
        const r = data.pixels[index + 0];
        const g = data.pixels[index + 1];
        const b = data.pixels[index + 2];
        //const brightness = (0.21 * r) + (0.72 * g) + (0.07) * b;
        const brightness = (r+g+b)/3;
        if(brightness > 0.25) {
            const p = toVoronoiCanvasStipple(x, y, targetWidth, targetHeight, data.width, data.height);
            points.push(p);
        } else {
            i--;
        }
    }

    // const maxX = 81;
    // const maxY = 81;
    // const segmentX = 100 / maxX;
    // const segmentY = 100 / maxY;

    // for(let i = 0; i <= maxY; i++) {
    //     for(let j = 0; j <= maxX; j++) {
    //         let x = Math.trunc(((j * segmentX)  / 100) * data.width);
    //         let y = Math.trunc(((i * segmentY) / 100) * data.height);
    //         const index = (y * data.width + x) * 4;
    //         const r = data.pixels[index + 0];
    //         const g = data.pixels[index + 1];
    //         const b = data.pixels[index + 2];
    //         const brightness = (r+g+b)/3;
    //         if(brightness > 0.1) {
    //             const p = toVoronoiCanvasStipple(x, y, targetWidth, targetHeight, data.width, data.height);
    //             points.push(p);
    //         }
    //     }
    // }

//    console.log("original points", originalPoints);
    console.log("extracted points", points);

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
    const myTargetSpace = 8;
    
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
        let ctx = canvasRef.current?.getContext('2d');
        if(ctx && imageData) {
            ctx.clearRect(0, 0, width, height);
            ctx.putImageData(imageData, 0, 0);
        }
    }

    useEffect(() => {
        // let poly = SAMPLE_POLYGONS.find(x => x.name === "Star-Shaped Polygon")?.points;
        // const points = importPointsFromMatrix(poly!);
        // setPoints(points);
        // addDebugConfig('voronoi-delaunay', { debugVisible: false });
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
                let t = voronoiDiagramFromDelaunay(setPoints.map(x => x.clone()), "voronoi-delaunay", voronoiWidth, voronoiHeight, false);
                setVoronoi(t);
                // drawImageOnCanvas();
                // drawWeightedVoronoiStipplingTextureOnExistingCanvas(canvasRef.current, imageData, myTargetSpace, t, values['seeds'], values['centroids'], values['edges'], values['triangulation'], 40, false);
                let pointsIt = setPoints;
                const int = setInterval(() => {
                    // if(!t.isCentroidal() && canvasRef.current && imageData) {
                    //     drawImageOnCanvas();
                    //     pointsIt = t.getLloydRelaxationPoints();
                    //     t = voronoiDiagramFromDelaunay(pointsIt.map(x => x.clone()));
                    //     drawWeightedVoronoiStipplingTextureOnExistingCanvas(canvasRef.current, imageData, myTargetSpace, t, values['seeds'], values['centroids'], values['edges'], values['triangulation'], 40, false);
                    // }
                }, 100);
                return () => { 
                    try {
                        clearInterval(int);
                    } catch (e) {
                        console.warn(e);
                    }
                };
            }
        } catch (e) {
            console.error(e)
        }
    }, [ points, width, height ]);

    useEffect(() => {
        if(canvasRef.current && imageData && voronoi) {
            drawImageOnCanvas();
            drawWeightedVoronoiStipplingTextureOnExistingCanvas(canvasRef.current, imageData, myTargetSpace, voronoi, values['seeds'], values['centroids'], values['edges'], values['triangulation'], 40, false);
        }
    }, [ voronoi, values['seeds'], values['edges'], values['triangulation'], values['centroids'] ]);

    return (
        <>
            <HeaderWithBackButton title="Trabalho - Weighted Voronoi Stippling" />
            <canvas width={width} height={height} ref={canvasRef} />
        </>
    )
}