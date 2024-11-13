import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/geometry/voronoiWorker.ts', 
    output: {
        file: 'public/voronoiWorker.js', 
        format: 'iife', 
        sourcemap: false,
    },
    plugins: [
        resolve(), 
        commonjs(), 
        typescript({ tsconfig: './tsconfig.json' }), 
    ],
    external: ['react-native']
};