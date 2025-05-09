import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    assetsInclude: ['**/*.JPG', '**/*.PNG'],
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        cors: {
            origin: 'http://172.17.100.75:8000',
            credentials: true,
        },
        hmr: {
            host: '172.17.100.75',
            port: 5173,

        },
    },
});
