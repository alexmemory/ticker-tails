import { cp, mkdir, rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist/src', { recursive: true })
await mkdir('dist/assets', { recursive: true })
await Promise.all([
  cp('index.html', 'dist/index.html'),
  cp('src/app.js', 'dist/src/app.js'),
  cp('src/data.js', 'dist/src/data.js'),
  cp('src/styles.css', 'dist/src/styles.css'),
  cp('assets', 'dist/assets', { recursive: true }),
])
console.log('Built Market Biome in dist/')
