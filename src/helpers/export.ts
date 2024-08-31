import { Point3 } from "@geometry/points";
import { inflate as nativeInflate, deflate as nativeDeflate } from 'react-native-gzip';
import pako from 'pako';
import { Platform } from 'react-native';

export const MAX_DATA_EXPORT = 5000;

export async function exportPoints(points: Point3[]): Promise<string> {
    const data = JSON.stringify(points.map((p) => ({ x: p.x, y: p.y, z: p.z })));

    if (Platform.OS === 'web') {
        // Use pako for web
        const compressed = pako.deflate(data);
        return btoa(String.fromCharCode(...compressed));
    } else {
        // Use react-native-gzip for React Native
        return nativeDeflate(data);
    }
}

export async function importPoints(base64: string): Promise<Point3[]> {
    let raw: string;

    if (Platform.OS === 'web') {
        // Use pako for web
        const binaryString = atob(base64);
        const charCodeArray = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
        raw = pako.inflate(charCodeArray, { to: 'string' });
    } else {
        // Use react-native-gzip for React Native
        raw = await nativeInflate(base64);
    }

    const parsed = JSON.parse(raw) as { x: number, y: number, z: number }[];
    return parsed.map((p) => new Point3(p.x, p.y, p.z));
}