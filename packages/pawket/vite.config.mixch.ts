// vite.config.js

import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2";
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path'

const htmlPlugin = () => {
    return {
        name: "html-transform",
        transformIndexHtml(html: string) {
            html = html.replace("%APPNAME%", "Mixch");
            html = html.replace("%ENTRY%", "mixch.ts");
            return html;
        },
    };
};

export default defineConfig(({ mode }) => ({
    base: "/",
    plugins: [
        vue(),
        htmlPlugin(),
    ],
    define: {
        'process.env.NODE_ENV': process.env.NODE_ENV,
        'process.env.VITE_API_URL': process.env.VITE_API_URL,
        'process.env.VITE_API_URL_TESTNET': process.env.VITE_API_URL_TESTNET,
        'process.env.VITE_VERSION': process.env.VITE_VERSION,
    },
    publicDir: './public/mixch',
    resolve: {
        alias: [
            { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            { find: /^~/, replacement: '../../node_modules/', },
            { find: 'clvm_tools', replacement: fileURLToPath(new URL('../../node_modules/clvm_tools/browser', import.meta.url)) },
        ]
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "esnext",
            define: {
                global: 'globalThis'
            },
            supported: {
                bigint: true
            },
        }
    },
    server: {
        port: 8088,
    },
    build: {
        target: ["esnext"],
        outDir: "../../dist/mixch",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                app: resolve(__dirname, 'index.html'),
            },
            plugins: [
                mode === 'analyze' &&
                visualizer({
                    open: true,
                    filename: '../../dist/mixch.stats.html',
                    gzipSize: true,
                    brotliSize: true,
                }),
            ],
        },
    },
}))