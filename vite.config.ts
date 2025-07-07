import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import webExtension from '@samrum/vite-plugin-web-extension'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "Nano Loan Origination Extension (Pipeline Pro)",
        version: "1.0.0",
        description: "Enterprise-grade browser extension for Canopy Mortgage's Nano LOS platform",
        permissions: ["storage", "activeTab", "scripting", "background"],
        host_permissions: [
          "https://canopymortgage.nanolos.com/*",
          "https://api.nanolos.com/*",
          "https://storage.googleapis.com/*"
        ],
        action: {
          default_popup: "popup.html",
          default_icon: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
          }
        },
        background: {
          service_worker: "src/extension/background/background.ts",
          type: "module"
        },
        content_scripts: [
          {
            matches: [
              "https://canopymortgage.nanolos.com/*",
              "https://*.nanolos.com/*",
              "https://nanolos.com/*"
            ],
            js: ["src/extension/content/content.ts"]
          }
        ],
        side_panel: {
          default_path: "sidepanel.html"
        },
        options_page: "options.html"
      }
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    target: 'es2020'
  }
})