import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
}
export const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname
    const requested = normalize(pathname === '/' ? 'index.html' : pathname.slice(1))
    const file = join(root, requested)
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('Not found')
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
    response.end(await readFile(file))
  } catch { response.writeHead(404); response.end('Not found') }
})

if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(5173, '0.0.0.0', () => console.log('Ticker Tails ready at http://localhost:5173'))
