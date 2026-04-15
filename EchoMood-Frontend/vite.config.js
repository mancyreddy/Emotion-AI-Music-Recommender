import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'echo-image-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || ''
          if (!url.startsWith('/img-proxy')) return next()

          try {
            const full = new URL(url, 'http://localhost')
            const target = full.searchParams.get('url')
            if (!target) {
              res.statusCode = 400
              res.end('Missing url')
              return
            }
            if (!(target.startsWith('http://') || target.startsWith('https://'))) {
              res.statusCode = 400
              res.end('Invalid protocol')
              return
            }

            const r = await fetch(target, { headers: { 'Accept': 'image/*' } })
            if (!r.ok) {
              // Serve a local placeholder image with 200 to avoid noisy console errors
              const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="#4300FF"/><stop offset="50%" stop-color="#0065F8"/><stop offset="100%" stop-color="#00CAFF"/></linearGradient></defs><rect fill="url(#g)" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="28" font-family="Arial">EchoMood</text></svg>`
              res.setHeader('Content-Type', 'image/svg+xml')
              res.setHeader('Cache-Control', 'public, max-age=120')
              res.end(svg)
              return
            }
            const ct = r.headers.get('content-type') || 'image/jpeg'
            res.setHeader('Content-Type', ct)
            res.setHeader('Cache-Control', 'public, max-age=300')
            const buf = Buffer.from(await r.arrayBuffer())
            res.end(buf)
          } catch (e) {
            // On proxy errors, serve placeholder to avoid 5xx noise
            const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="#4300FF"/><stop offset="50%" stop-color="#0065F8"/><stop offset="100%" stop-color="#00CAFF"/></linearGradient></defs><rect fill="url(#g)" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="28" font-family="Arial">EchoMood</text></svg>`
            res.setHeader('Content-Type', 'image/svg+xml')
            res.setHeader('Cache-Control', 'public, max-age=60')
            res.end(svg)
          }
        })
      }
    }
  ],
  server: {
    proxy: {
      '/users': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/predict': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
