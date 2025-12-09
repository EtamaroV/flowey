import path from "path"
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'Flowey',
      short_name: 'Flowey',
      description: 'Flowey',
      theme_color: '#ffffff',
      orientation: "portrait",

    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: env.VITE_DEV_MODE === 'true',
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}})