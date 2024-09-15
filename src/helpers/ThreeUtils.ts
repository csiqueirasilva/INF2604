import * as THREE from 'three'

export function createSolidFromPoints(points: THREE.Vector3[]): THREE.Mesh {
    // Create a geometry object
    const geometry = new THREE.BufferGeometry();

    // Create a Float32Array to store the vertices
    const vertices: number[] = [];
    points.forEach(point => {
        vertices.push(point.x, point.y, point.z);
    });

    // Set the vertices into the geometry
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    // Assuming the points are ordered and can directly form triangles
    // You need to specify the vertex indices that form each triangle
    const indices: number[] = [];

    for (let i = 0; i < points.length - 2; i++) {
        indices.push(0, i + 1, i + 2); // Assuming a fan triangulation
    }

    // Set the indices into the geometry
    geometry.setIndex(indices);

    // Calculate normals to give the solid a proper appearance
    geometry.computeVertexNormals();

    // Create a material for the solid
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00, // Green by default
        side: THREE.DoubleSide, // To render both sides of the triangles
        flatShading: true, // Flat shading to show the edges clearly
        transparent: true,
        opacity: 0.1
    });

    // Create a mesh
    const solidMesh = new THREE.Mesh(geometry, material);

    return solidMesh;
}

export const VECTOR3_ZERO = new THREE.Vector3(0, 0, 0);