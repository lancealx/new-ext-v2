import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import webExtension from 'vite-plugin-web-extension'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: resolve(__dirname, 'public/manifest.json'),
      assets: 'public',
      additionalInputs: {
        html: [
          'popup.html',
          'sidepanel.html',
          'options.html'
        ]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/extension/background/background.ts'),
        content: resolve(__dirname, 'src/extension/content/content.ts'),
        popup: resolve(__dirname, 'public/popup.html'),
        options: resolve(__dirname, 'public/options.html'),
        sidepanel: resolve(__dirname, 'public/sidepanel.html')
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  css: {
    postcss: './postcss.config.js',
  },
})
