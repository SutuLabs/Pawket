// vite.config.js

import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2";
import path from 'path'
import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// import { viteStaticCopy } from 'vite-plugin-static-copy'
// const viteStaticCopy =require( 'vite-plugin-static-copy')
// const pluginModule = await import('vite-plugin-static-copy');
// const viteStaticCopy = pluginModule.default;
// import copyFiles from 'vite-plugin-copy-files';
// import exclude from 'rollup-plugin-exclude-dependencies-from-bundle'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
    base: "/",
    plugins: [vue(),
        // viteStaticCopy({
        //     targets: [
        //         {
        //             src: './static/pawket',
        //             dest: './'
        //         }
        //     ]
        // })
        // copyFiles({
        //     include: [/\/pawket\//],
        //     exclude: [/node_modules/],
        //     entry: 'static'
        //   }),
        // {
        //     name: 'ignore-non-english-wordlists',
        //     resolveId(source) {
        //         if (/.*\/wordlists\/(?!english).*\.json/.test(source)) {
        //             return { id: 'empty', external: true };
        //         }
        //     }
        // },
    ],
    define: {
        'process.env.NODE_ENV': process.env.NODE_ENV,
        'process.env.VITE_API_URL': process.env.VITE_API_URL,
        'process.env.VITE_API_URL_TESTNET': process.env.VITE_API_URL_TESTNET,
        'process.env.VITE_VERSION': process.env.VITE_VERSION,
    },
    publicDir: './public/pawket',
    resolve: {
        alias: [
            { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            // { find: "@", replacement: path.resolve(__dirname, "./src"), },
            { find: /^~/, replacement: '../../node_modules/', },
            // { find: "clvm_tools", replacement:  '../../node_modules/clvm_tools/browser', },
            { find: 'clvm_tools', replacement: fileURLToPath(new URL('../../node_modules/clvm_tools/browser', import.meta.url)) },
            // { find: "clvm_tools", replacement:  'clvm_tools/browser', },
        ]
        // alias: {
        //     "@": path.resolve(__dirname, "./src"),
        //     '~bulma': '../../node_modules/bulma',
        //     '~buefy': '../../node_modules/buefy',
        //     'clvm_tools': path.resolve(__dirname, '../../node_modules/clvm_tools/browser'),
        // },
    },
    optimizeDeps: {
        // exclude: ['bulma'],
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
        port: 8080,
    },
    build: {
        target: ["esnext"],
        outDir: "../../dist/web",
        emptyOutDir: true,
        rollupOptions: {
            plugins: [
                mode === 'analyze' &&
                visualizer({
                    open: true,
                    filename: 'dist/stats.html',
                    gzipSize: true,
                    brotliSize: true,
                }),
            ],
        },
    },
}))