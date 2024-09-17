import { Point3 } from '@geometry/points';
import { Triangle } from '@geometry/polygon';
import { createCircleBorderTexture } from '@helpers/canvas';
import { Platform } from 'react-native';
import * as THREE from 'three';

const createTriangleGeometry = (triangle: Triangle) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [
        triangle.points[0].x, triangle.points[0].y, triangle.points[0].z,
        triangle.points[1].x, triangle.points[1].y, triangle.points[1].z,
        triangle.points[2].x, triangle.points[2].y, triangle.points[2].z,
    ];
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
};

export const createDebugTriangulatedSurface = (triangles: Triangle[]): THREE.Group => {
    const group = new THREE.Group();

    triangles.forEach((triangle, idx) => {
        const geometry = createTriangleGeometry(triangle);
        const material = getDebugRandomColorBasicMaterial(idx);
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
    });

    return group;
};

export const createDebugSurface = (points : Point3[]) : THREE.Mesh => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(
        points.flatMap(p => [ p.x, p.y, p.z ]), 3)
    );
    const material = getDebugRandomColorBasicMaterial();
    return new THREE.Mesh(geometry, material);
};

const DEBUG_COLORS = [
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
    0x800000, 0x008000, 0x000080, 0x808000, 0x800080, 0x008080,
    0xc0c0c0, 0x808080, 0x9999ff, 0xff9999, 0x99ff99, 0xffff99,
    0xff66cc, 0xcc99ff, 0xffcc99, 0x66ccff, 0xccff99, 0x99ffcc,
    0x3399ff, 0x99cc33, 0xff9933, 0xcc3399, 0xff3366, 0x33ccff,
    0x66ff33, 0x6633ff, 0xff3333, 0x33ffcc, 0xff6633, 0x99cc66,
    0x3366cc, 0xccff66, 0xff9966, 0x6666ff, 0x9966cc, 0x669999,
    0x666633, 0x996666, 0xffcc66, 0xcc6699, 0x33cc66, 0x9933ff,
    0xff6666, 0x99ff66, 0x6699cc, 0x66cc33, 0x999933, 0xcc3366,
    0xff6699, 0x33ff99, 0x66ff66, 0xcc33ff, 0x336633, 0x663399,
    0x339933, 0x33cc99, 0xffcc33, 0x339966, 0xcc6633, 0x993366,
    0x669966, 0x33ff33, 0xccff33, 0x669933, 0xff9933, 0xcc9933,
    0x336699, 0x663366, 0x33ff66, 0xcc6699, 0x99ff33, 0x66ff99,
    0x9933cc, 0x66cc66, 0x6699ff, 0x33cccc, 0xcc99cc, 0x3366ff,
    0x33cc33, 0x669966, 0xcc9933, 0x33cc66, 0xff9966, 0x33ffcc,
    0xcc3399, 0xff6633, 0x3399ff, 0x99cc66, 0x33ff99, 0xff3333,
];

export const getDebugRandomColorBasicMaterial = (index: number = Math.floor(Math.random() * DEBUG_COLORS.length)) => {
    const color = DEBUG_COLORS[index % DEBUG_COLORS.length];
    return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
};

export function createDebugArrow(
    startPoint: THREE.Vector3 | Point3, 
    endPoint: THREE.Vector3 | Point3,
    colorInput: THREE.ColorRepresentation = 0x000000,
    headLength: number = 0.2,
    headWidth: number = 0.1,
    lineWidth: number = 4
): THREE.Group {

    // Convert startPoint and endPoint to THREE.Vector3 if they are Point3
    const start = startPoint instanceof THREE.Vector3 
        ? startPoint 
        : new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z);
    const end = endPoint instanceof THREE.Vector3 
        ? endPoint 
        : new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);

    // Create a direction vector from start to end
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    // Normalize the direction
    const normalizedDirection = direction.clone().normalize();

    // Create the line part of the arrow
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: colorInput, 
        linewidth: lineWidth 
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);

    // Create the arrowhead (a cone)
    const coneGeometry = new THREE.ConeGeometry(headWidth, headLength, 16);
    
    // Translate the cone geometry so that the tip is at the origin
    coneGeometry.translate(0, -headLength / 2, 0);

    const coneMaterial = new THREE.MeshBasicMaterial({ color: colorInput });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);

    // Position the cone at the tip of the arrow
    cone.position.copy(end);

    // Orient the cone to point along the direction vector
    const axis = new THREE.Vector3(0, 1, 0); // Cone's default orientation is along +Y axis
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(axis, normalizedDirection);
    cone.quaternion.copy(quaternion);

    // Create a group to hold the line and cone
    const arrow = new THREE.Group();
    arrow.add(line);
    arrow.add(cone);

    return arrow;
}

export function createDebugHighlightPoint(
    point: (THREE.Vector3|Point3), 
    color : THREE.ColorRepresentation = "black", 
    lineWidth: number = 2,
    size : number = 40
) {
    const canvas = createCircleBorderTexture(color, size, lineWidth)
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    let ret = new THREE.Sprite(material);
    ret.position.set(point.x, point.y, point.z);
    return ret
}

export function createDebugLine(
    points: (THREE.Vector3|Point3)[], 
    origin: THREE.Vector3|Point3 = new THREE.Vector3(0, 0, 0),
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
            vertices.push(point.x + origin.x, point.y + origin.y, point.z + origin.z);
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
        dashSize: gapSize,
        gapSize: gapSize
    });

    // Create the line object
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
}

export function createDebugSphere(
    center: THREE.Vector3 | Point3,
    radius: number,
    color: THREE.ColorRepresentation = 0xaaaaaa,
    opacity = 0.5
): THREE.Mesh {
    // Convert center to THREE.Vector3 if it's a Point3
    const sphereCenter = center instanceof THREE.Vector3
        ? center
        : new THREE.Vector3(center.x, center.y, center.z);

    // Create the sphere geometry
    const geometry = new THREE.SphereGeometry(radius, 32, 32);

    // Create a basic material with backside rendering only
    const material = new THREE.MeshBasicMaterial({
        opacity: opacity,
        transparent: true,
        color: color,
        side: THREE.BackSide, // Render only the backside
        wireframe: false,     // Set to true if you prefer a wireframe sphere
    });

    // Create the mesh
    const sphere = new THREE.Mesh(geometry, material);

    // Position the sphere at the specified center
    sphere.position.copy(sphereCenter);

    return sphere;
}

export function createDebugArrowSegments(points : Point3[]): any[] {
    let arrows : any = [];
    const startColor = new THREE.Color(0xff0000); // Red
    const endColor = new THREE.Color(0x0000ff);   // Blue
    if(points.length > 1) {
        arrows.push(createDebugArrow(points[0], points[1], startColor), createDebugText(`${0}`, points[0].toVector3(), 30));
        for(let i = 1; i < points.length; i++) {
            const t = i / points.length;
            const color = startColor.clone().lerp(endColor, t);
            arrows.push(createDebugArrow(points[i - 1], points[i], color), createDebugText(`${i}`, points[i].toVector3(), 30));
        }
    }
    return arrows;
}

export function createDebugText(
    text: string, 
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0), 
    fontSize: number = 14, 
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

            // **Reapply context settings after resizing the canvas**
            context.font = `${fontSize}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            // Optional: Improve text rendering quality
            context.imageSmoothingEnabled = true;

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
        }
    }

    return ret;
}