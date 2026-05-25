import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { createReadStream, existsSync, cpSync } from 'fs'
import { extname, join } from 'path'

const GAME_DIR = fileURLToPath(new URL('../../../game', import.meta.url))
const DIST_GAME = fileURLToPath(new URL('./dist/game', import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.wav':  'audio/wav',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.json': 'application/json',
}

function serveGamePlugin() {
  return {
    name: 'serve-game',
    configureServer(server) {
      server.middlewares.use('/game', (req, res, next) => {
        const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\//, '') || 'index.html'
        const file = join(GAME_DIR, rel)
        if (!file.startsWith(GAME_DIR) || !existsSync(file)) return next()
        res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      cpSync(GAME_DIR, DIST_GAME, { recursive: true })
      console.log('✓ Hra zkopírována do dist/game/')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveGamePlugin()],
})
