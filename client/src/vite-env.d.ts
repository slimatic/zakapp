/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly REACT_APP_API_BASE_URL: string;
    readonly VITE_ALLOWED_HOSTS: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
    // Add other env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
        readonly data: any;
        accept(): void;
        accept(cb: (mod: any) => void): void;
        accept(dep: string, cb: (mod: any) => void): void;
        accept(deps: readonly string[], cb: (mods: any[]) => void): void;
        dispose(cb: (data: any) => void): void;
        decline(): void;
        invalidate(): void;
        on(event: string, cb: (...args: any[]) => void): void;
    };
}
