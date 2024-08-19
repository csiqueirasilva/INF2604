import * as THREE from 'three'

export function getRandomColorHex() {
    const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    return '#' + randomColor.getHexString();
}