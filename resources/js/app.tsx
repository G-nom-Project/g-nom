import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './bootstrap';

import '../css/gnom.css';
import '../css/assistant.css'
import '../css/circleplot.css'

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initEcho } from '@/echo';

const appName = 'G-nom';

// eslint-disable-next-line
const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        initEcho(props.initialPage.props.reverb);
        root.render(
            <>
                <App {...props} />
            </>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
