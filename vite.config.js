import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
    assetsInclude: ['**/*.JPG', '**/*.PNG'],
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        nodePolyfills({
            include: ["buffer"],
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        cors: {
            origin: 'http://172.17.99.102:2000',
            credentials: true,
        },
        hmr: {
            host: '172.17.99.102',
            port: 5173,

        },
    },
});
