import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv} from 'vite'
import { VitePWA } from "vite-plugin-pwa"




// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  const base = env.VITE_APP_BASE || '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ["**/*{html,css,js,ico,png,svg}"]
        },
        manifest: {
          name: 'Rolls',
          short_name: 'Rolls',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'pwa-screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Rolls Desktop'
            },
            {
              src: 'pwa-screenshot-narrow.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Rolls Mobile'
            }
          ]
        }
      })
    ],
    server: {
      port: parseInt(env.VITE_APP_PORT),
      proxy: {
        '/api': { 
          target: env.VITE_BFF_URL, 
          changeOrigin: true 
        }
      }
    }
  }
})
