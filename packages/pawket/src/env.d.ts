/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_API_URL_TESTNET: string
    readonly VITE_VERSION: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}