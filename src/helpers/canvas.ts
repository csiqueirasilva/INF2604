import { Color, ColorRepresentation } from "three";

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