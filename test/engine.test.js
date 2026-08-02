import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')

test('the browser runtime uses PlayCanvas with articulated 3D physics', async () => {
  const [index, app, engine, rigs, build] = await Promise.all([
    read('../index.html'),
    read('../src/app.js'),
    read('../src/playcanvas-farm.js'),
    read('../src/animal-rigs.js'),
    read('../scripts/build.mjs'),
  ])

  assert.match(index, /vendor\/ammo\.js/)
  assert.match(index, /vendor\/playcanvas\.min\.js/)
  assert.doesNotMatch(index, /phaser/i)
  assert.match(app, /PlayCanvasFarm/)
  assert.doesNotMatch(app, /Phaser/)
  assert.match(engine, /new pc\.Application/)
  assert.match(engine, /PROJECTION_PERSPECTIVE/)
  assert.match(engine, /BODYTYPE_DYNAMIC/)
  assert.match(engine, /type: 'capsule'/)
  assert.match(engine, /addComponent\('collision'/)
  assert.match(engine, /addComponent\('rigidbody'/)
  assert.match(engine, /ProceduralPhysicalValley/)
  assert.match(engine, /createFarmBuildings/)
  assert.match(engine, /createPitchedBuilding/)
  assert.match(engine, /createSilo/)
  assert.match(engine, /createOpenShed/)
  assert.match(engine, /createValleyBoundary/)
  assert.match(engine, /physical farmhouse/)
  assert.match(engine, /timber bridge/)
  assert.doesNotMatch(engine, /investment-farm-world\.png/)
  assert.doesNotMatch(engine, /PaintedTerrain/)
  assert.match(rigs, /createAnimalRig/)
  assert.match(rigs, /dragon-wing/)
  assert.match(rigs, /elephant-head/)
  assert.match(rigs, /latitudeBands: 40/)
  assert.match(rigs, /longitudeBands: 40/)
  assert.match(rigs, /sides: 48/)
  assert.match(rigs, /capSegments: 48/)
  assert.match(rigs, /buildMammal/)
  assert.match(rigs, /buildBirdSpecies/)
  assert.match(rigs, /peacock-tail-feather/)
  assert.match(rigs, /beaver-paddle-tail/)
  assert.match(engine, /drawCreatureLabel/)
  assert.match(engine, /three-dimensional-nameplate/)
  assert.match(engine, /nameplate-body/)
  assert.match(engine, /texture\.anisotropy = 8/)
  assert.match(engine, /updateNameplates/)
  assert.match(engine, /label-cluster-marker/)
  assert.match(engine, /expandedLabelIds/)
  assert.match(engine, /renderWidth: 3800/)
  assert.match(engine, /focusWorld/)
  assert.match(engine, /baseSunIntensity/)
  assert.match(engine, /applyClimateLighting/)
  assert.match(engine, /this\.baseSunIntensity \+ flashProgress/)
  assert.doesNotMatch(engine, /keyLight\.light\.intensity \+=/)
  assert.match(build, /animal-rigs\.js/)
  assert.match(build, /ammo\.js/)
  assert.match(build, /playcanvas-farm\.js/)
  assert.match(build, /playcanvas\.min\.js/)
  assert.doesNotMatch(build, /phaser/i)
})
