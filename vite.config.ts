import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import { notBundle } from 'vite-plugin-electron/plugin'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        // Optimises production build assets
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
    },
    experimental: {
        // BYPASSES 10-MINUTE BUG: Reverts Rolldown's native Rust resolver
        // back to the stable JS-based resolver path until regressions are patched.
        enableNativePlugin: false
    },
    server: {
        watch: {
            // Strictly blocks filesystems from being repeatedly crawled
            ignored: ['**/node_modules/**', '**/dist/**', '**/release/**']
        }
    },
    optimizeDeps: {
        include: [

            'react',
            'react-dom',
            'lucide-react',
            'react-markdown',
            'remark-gfm',
            'rehype-sanitize',
            '@dnd-kit/core',
            '@dnd-kit/modifiers',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'sonner'
        ], // NOTE: 'react-icons' explicitly removed. Use direct imports in components.
    },
    plugins: [
        react(),
        tailwindcss(),
        electron([
            {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                    },
                    plugins: [
                        // Tells Rolldown not to resolve or bundle node_modules
                        // for the main native Node context
                        notBundle()
                    ]
                }
            },
            {
                entry: 'electron/preload.ts',
                onstart(options: any) {
                    options.reload()
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                    },
                    plugins: [
                        // Tells Rolldown not to resolve or bundle node_modules
                        // for the isolated preload context
                        notBundle()
                    ]
                }
            },
        ]),
    ],
})
