import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const port = parseInt(process.argv[2], 10) || 4173
const host = process.argv[3] || '127.0.0.1'

// Serve from the current directory, or from a 'dist' subdirectory if it exists
const distDir = existsSync(join(__dirname, 'dist')) ? join(__dirname, 'dist') : __dirname

const MIME = {
  '.html': 'text/html;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.js': 'application/javascript;charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json;charset=utf-8',
  '.woff2': 'font/woff2',
}

createServer((req, res) => {
  let urlPath = req.url?.split('?')[0] || '/'
  if (urlPath.endsWith('/')) urlPath += 'index.html'

  const filePath = join(distDir, urlPath)

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' })
    res.end('404 Not Found')
    return
  }

  try {
    const content = readFileSync(filePath)
    const ext = extname(filePath)
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(content)
  } catch {
    res.writeHead(500)
    res.end('500 Internal Server Error')
  }
}).listen(port, host, () => {
  console.log(`MDMap corriendo en http://${host}:${port}`)
})
