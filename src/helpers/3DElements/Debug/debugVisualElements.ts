import { Point3 } from '@geometry/points';
import { Platform } from 'react-native';
import * as THREE from 'three';

export function createDebugLine(
    points: (THREE.Vector3|Point3)[], 
    startColorInput : THREE.ColorRepresentation = 0x000000,
    endColorInput : THREE.ColorRepresentation = 0x0000ff,
    lineWidth: number = 4,
    gapSize: number = 0,
    ): THREE.Line {

    const geometry = new THREE.BufferGeometry();
    
    if(points.length > 0) {
        // Prepare the points as an array of Vector3
        const vertices: number[] = [];
        points.forEach((point) => {
            vertices.push(point.x, point.y, point.z);
        });

        // Create a Float32Array for the vertices
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Generate colors based on the position in the hull
        const colors: number[] = [];
        const startColor = new THREE.Color(startColorInput); 
        const endColor = new THREE.Color(endColorInput); 

        points.forEach((_, index, array) => {
            const color = startColor.clone().lerp(endColor, index / (array.length - 1));
            colors.push(color.r, color.g, color.b);
        });

        // Repeat the first point's color for closing the hull (loop back)
        colors.push(colors[0], colors[1], colors[2]);

        // Assign colors to geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    // Create a material that supports vertex colors
    const material = new THREE.LineDashedMaterial({ 
        vertexColors: true, 
        linewidth: lineWidth, 
        depthTest: false, 
        depthWrite: false,
        dashSize: gapSize,
        gapSize: gapSize
    });

    // Create the line object
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
}

export function createDebugText(
    text: string, 
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0), 
    fontSize: number = 18, 
    textColor: string = '#000', 
    backgroundColor: string = 'transparent', 
    padding: number = 10
): THREE.Sprite {

    let ret: THREE.Sprite = new THREE.Sprite();

    if (Platform.OS === "web") {

        // Create a canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {

            // Set text properties to measure
            context.font = `${fontSize}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            // Measure the width of the text
            const textWidth = context.measureText(text).width;
 
            // Adjust the canvas dimensions based on the text size and padding
            const canvasWidth = textWidth + (padding * 2);
            const canvasHeight = fontSize + (padding * 2);
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            // Set background color (if needed)
            if (backgroundColor !== 'transparent') {
                context.fillStyle = backgroundColor;
                context.fillRect(0, 0, canvasWidth, canvasHeight);
            }

            // Set text color and draw the text
            context.fillStyle = textColor;
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            context.fillText(text, canvasWidth / 2, canvasHeight / 2);

            // Create a texture from the canvas
            const texture = new THREE.CanvasTexture(canvas);

            // Create a material using the texture
            const material = new THREE.SpriteMaterial({ map: texture });

            // Create the sprite (2D image) to display the text
            ret = new THREE.Sprite(material);

            // Position the sprite in 3D space
            ret.position.copy(position);

            const aspectRatio = canvasWidth / canvasHeight;

            ret.scale.set(aspectRatio, 1, 1);

            // Set the scale of the sprite
            //ret.scale.copy(scale); // Adjust scale based on the input parameters
        }
    }

    return ret;
}