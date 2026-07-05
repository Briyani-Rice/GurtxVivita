import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// @ts-expect-error process is a Node.js global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
    base: "./",

    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },

    build: {
        outDir: "dist",
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
        minify: "esbuild",
        sourcemap: false,
    },

    clearScreen: false,

    server: {
        port: 5173,
        strictPort: true,
        // Fallback to '127.0.0.1' instead of false to bypass macOS localhost DNS slowdowns
        host: host || "127.0.0.1",

        hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
            }
            : undefined,

        watch: {
            ignored: [
                "**/node_modules/**",
                "**/dist/**",
                "**/release/**",
                "**/src-tauri/**",
            ],
        },
    },

    // REMOVED: Massive optimizeDeps.include list that was choking the compiler startup

    plugins: [
        react(),
        tailwindcss(), // Let Tailwind optimize automatically
    ],
});
