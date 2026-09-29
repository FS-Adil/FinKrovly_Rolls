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
          globPatterns: ["**/*{html, css, js, ico, png, svg}"]
        },
        manifest: {
          name: 'Rolls',
          short_name: 'Rolls',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
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
