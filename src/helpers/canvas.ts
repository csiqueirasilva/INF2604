import { CanvasTexture, Color, ColorRepresentation, Texture } from "three";

export function createCircleTexture(color: ColorRepresentation) {
    const size = 256; // Size of the texture
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (context) {
        const radius = size / 2;
        context.beginPath();
        context.arc(radius, radius, radius, 0, 2 * Math.PI);
        context.fillStyle = new Color(color).getStyle();
        context.fill();
    }

    return canvas;
}

export function createCircleBorderTexture(color: ColorRepresentation, size: number = 128, lineWidth : number = 4, pixelRatio : number = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = (size + (lineWidth * 2)) * pixelRatio;
    canvas.height = (size + (lineWidth * 2)) * pixelRatio;

    const context = canvas.getContext('2d');
    if (context) {
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        const radius = (size / 2);
        context.strokeStyle = new Color(color).getStyle();
        context.lineWidth = lineWidth;
        context.beginPath();
        context.arc(radius + lineWidth, radius + lineWidth, radius, 0, 2 * Math.PI);
        context.stroke();
    }

    return canvas;
}