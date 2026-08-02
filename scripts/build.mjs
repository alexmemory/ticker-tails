import { cp, mkdir, rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist/src', { recursive: true })
await mkdir('dist/assets', { recursive: true })
await mkdir('dist/vendor', { recursive: true })
await Promise.all([
  cp('index.html', 'dist/index.html'),
  cp('src/app.js', 'dist/src/app.js'),
  cp('src/animal-rigs.js', 'dist/src/animal-rigs.js'),
  cp('src/playcanvas-farm.js', 'dist/src/playcanvas-farm.js'),
  cp('src/data.js', 'dist/src/data.js'),
  cp('src/styles.css', 'dist/src/styles.css'),
  cp('assets', 'dist/assets', { recursive: true }),
  cp('vendor/playcanvas.min.js', 'dist/vendor/playcanvas.min.js'),
  cp('vendor/PLAYCANVAS-LICENSE.md', 'dist/vendor/PLAYCANVAS-LICENSE.md'),
  cp('vendor/ammo.js', 'dist/vendor/ammo.js'),
  cp('vendor/AMMO-LICENSE.md', 'dist/vendor/AMMO-LICENSE.md'),
])
console.log('Built Ticker Tails in dist/')
