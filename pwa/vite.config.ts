import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ["**/*{html, css, js, ico, png, svg}"]
      },
      manifest: {
        name: 'Rolls',
        short_name: 'Rolls',
        theme_color: '#ffffff',
        icons: [/* иконки 192x192 и 512x512 */]
      }
    })
  ],
})
