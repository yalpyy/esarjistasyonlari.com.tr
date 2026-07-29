import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite dev sunucusu public/ altındaki klasörler için dizin indeksi çözmüyor:
 * `/mini-oyun` isteği public/mini-oyun/index.html'e düşmeden SPA fallback'ine
 * takılıyor ve React 404 sayfası açılıyor. Vercel'de dosya sistemi bu isteği
 * doğru karşılıyor, dolayısıyla sorun sadece geliştirmede görünür — bu da
 * "prod'da çalışıyor, lokalde çalışmıyor" tuzağı yaratıyor.
 * Bu eklenti sadece dev'de isteği index.html'e yönlendirip davranışı eşitler.
 */
function miniGameDirIndex() {
  return {
    name: 'mini-oyun-dir-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/mini-oyun' || req.url === '/mini-oyun/') {
          req.url = '/mini-oyun/index.html'
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), miniGameDirIndex()],
})
