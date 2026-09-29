import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv} from 'vite'
import { VitePWA } from "vite-plugin-pwa"




// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  return {
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
