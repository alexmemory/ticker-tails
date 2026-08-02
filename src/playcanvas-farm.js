import { deriveWeather, farmResidents } from './data.js'
import { animateAnimalRig, createAnimalRig, setAnimalAccessory } from './animal-rigs.js'

const pc = window.pc
const MAP = { width: 1774, height: 887 }
const WORLD = { width: 92, depth: 46 }
const VALLEY = {
  renderWidth: 3800,
  renderDepth: 2600,
  boundaryWidth: 2240,
  boundaryDepth: 1440,
  cameraWidth: 1940,
  cameraDepth: 1160,
}
const FARM_CENTERS = {
  maya: { x: -320, z: -4 },
  alex: { x: 0, z: 0 },
  jordan: { x: 320, z: -4 },
}
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))
const lerp = (start, end, amount) => start + (end - start) * amount
const easeOutCubic = value => 1 - Math.pow(1 - value, 3)

const makeCanvas = (width, height, draw) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  return canvas
}

const color = value => {
  const number = Number.parseInt(value.replace('#', ''), 16)
  return new pc.Color(
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  )
}

const mapX = x => (x / MAP.width - .5) * WORLD.width
const mapZ = y => (y / MAP.height - .5) * WORLD.depth
const mapWidth = width => width / MAP.width * WORLD.width
const mapDepth = height => height / MAP.height * WORLD.depth
const residentX = (resident, x) => mapX(x) + (FARM_CENTERS[resident.farmId || 'alex']?.x || 0)
const residentZ = (resident, y) => mapZ(y) + (FARM_CENTERS[resident.farmId || 'alex']?.z || 0)

export class PlayCanvasFarm {
  constructor(canvas, options) {
    this.canvas = canvas
    this.options = options
    this.app = null
    this.camera = null
    this.keyLight = null
    this.fillLight = null
    this.actors = new Map()
    this.effects = []
    this.dynamicProps = []
    this.materials = new Set()
    this.textures = new Set()
    this.elapsed = 0
    this.ready = false
    this.drag = null
    this.dragDistance = 0
    this.zoom = window.innerWidth < 650 ? .92 : .86
    this.cameraTarget = new pc.Vec3(0, 0, -5)
    this.cameraDistance = 25
    this.weather = deriveWeather(options.getWeather())
    this.nextLightning = 4
    this.lightning = 0
    this.baseSunIntensity = 1.35
    this.baseExposure = 1.02
    this.cameraTween = null
    this.tmpVelocity = new pc.Vec3()
    this.tmpForce = new pc.Vec3()
    this.labelClusterMarkers = []
    this.labelClusters = []
    this.expandedLabelIds = new Set()
    this.expandedLabelsUntil = 0
  }

  async initialize() {
    try {
      if (!window.Ammo) throw new Error('Ammo.js did not load; physical farm unavailable.')

      this.app = new pc.Application(this.canvas)
      this.app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.6)
      this.app.setCanvasFillMode(pc.FILLMODE_NONE)
      this.app.setCanvasResolution(pc.RESOLUTION_AUTO)
      this.app.scene.ambientLight = new pc.Color(.2, .24, .19)
      this.app.scene.exposure = this.baseExposure

      this.createCamera()
      this.createLighting()
      this.createTerrain()
      this.createFarmStructure()
      this.createResidents()
      this.createLabelClusterSystem()
      this.createWeatherSystem()

      this.app.on('update', delta => this.update(Math.min(delta, 1 / 20)))
      this.resizeObserver = new ResizeObserver(() => this.resize())
      this.resizeObserver.observe(this.canvas.parentElement)
      this.armInput()
      this.resize()
      this.setWeather(this.options.getWeather())
      this.ready = true
      this.app.start()
      this.options.onReady?.()
    } catch (error) {
      this.options.onError?.(error)
    }
  }

  textureFromSource(source, alpha = true) {
    const texture = new pc.Texture(this.app.graphicsDevice, {
      width: source.width,
      height: source.height,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR,
      addressU: pc.ADDRESS_CLAMP_TO_EDGE,
      addressV: pc.ADDRESS_CLAMP_TO_EDGE,
      premultiplyAlpha: alpha,
    })
    texture.setSource(source)
    this.textures.add(texture)
    return texture
  }

  createMaterial = (name, hex, {
    gloss = .35,
    metalness = 0,
    emissive = '#000000',
    opacity = 1,
  } = {}) => {
    const material = new pc.StandardMaterial()
    material.name = name
    material.diffuse.copy(color(hex))
    material.emissive.copy(color(emissive))
    material.gloss = gloss
    material.metalness = metalness
    material.opacity = opacity
    material.blendType = opacity < 1 ? pc.BLEND_NORMAL : pc.BLEND_NONE
    material.depthWrite = opacity >= .98
    material.cull = pc.CULLFACE_BACK
    material.update()
    this.materials.add(material)
    return material
  }

  createTextureMaterial(name, texture, {
    opacity = 1,
    emissive = .05,
    alpha = false,
  } = {}) {
    const material = new pc.StandardMaterial()
    material.name = name
    material.diffuse.set(1, 1, 1)
    material.diffuseMap = texture
    material.emissive.set(emissive, emissive, emissive)
    material.emissiveMap = texture
    material.gloss = .16
    material.metalness = 0
    material.opacity = opacity
    if (alpha) {
      material.opacityMap = texture
      material.opacityMapChannel = 'a'
      material.blendType = pc.BLEND_NORMAL
      material.depthWrite = false
      material.cull = pc.CULLFACE_NONE
    }
    material.update()
    this.materials.add(material)
    return material
  }

  addPrimitive(parent, name, type, material, {
    position = [0, 0, 0],
    scale = [1, 1, 1],
    rotation = [0, 0, 0],
    castShadows = true,
    receiveShadows = true,
  } = {}) {
    const entity = new pc.Entity(name)
    entity.addComponent('render', { type })
    entity.render.meshInstances.forEach(instance => {
      instance.material = material
      instance.castShadow = castShadows
      instance.receiveShadow = receiveShadows
    })
    entity.setLocalPosition(...position)
    entity.setLocalScale(...scale)
    entity.setLocalEulerAngles(...rotation)
    parent.addChild(entity)
    return entity
  }

  createCamera() {
    this.camera = new pc.Entity('IsometricFarmCamera')
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(.56, .76, .83),
      projection: pc.PROJECTION_PERSPECTIVE,
      fov: 38,
      nearClip: .15,
      farClip: 460,
    })
    this.app.root.addChild(this.camera)
    this.syncCamera()
  }

  createLighting() {
    this.keyLight = new pc.Entity('MarketSun')
    this.keyLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, .88, .7),
      intensity: 1.35,
      castShadows: true,
      shadowDistance: 120,
      shadowResolution: 2048,
      normalOffsetBias: .035,
      shadowBias: .22,
    })
    this.keyLight.setEulerAngles(48, -32, 0)
    this.app.root.addChild(this.keyLight)

    this.fillLight = new pc.Entity('SkyFill')
    this.fillLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(.42, .63, .8),
      intensity: .36,
      castShadows: false,
    })
    this.fillLight.setEulerAngles(-35, 145, 0)
    this.app.root.addChild(this.fillLight)
  }

  createTerrain() {
    const grassTexture = this.textureFromSource(this.drawGrassTexture(), false)
    grassTexture.addressU = pc.ADDRESS_REPEAT
    grassTexture.addressV = pc.ADDRESS_REPEAT
    const valleyMaterial = this.createTextureMaterial('Procedural explorable valley', grassTexture, { emissive: .012 })
    valleyMaterial.diffuseMapTiling.set(380, 260)
    valleyMaterial.emissiveMapTiling.set(380, 260)
    valleyMaterial.update()
    this.terrain = this.addPrimitive(this.app.root, 'ProceduralPhysicalValley', 'plane', valleyMaterial, {
      position: [0, 0, 0],
      scale: [VALLEY.renderWidth, 1, VALLEY.renderDepth],
      receiveShadows: true,
      castShadows: false,
    })

    this.groundBody = new pc.Entity('GroundCollisionBody')
    this.groundBody.setPosition(0, -.26, 0)
    this.groundBody.addComponent('collision', {
      type: 'box',
      halfExtents: new pc.Vec3(VALLEY.boundaryWidth / 2, .25, VALLEY.boundaryDepth / 2),
    })
    this.groundBody.addComponent('rigidbody', {
      type: pc.BODYTYPE_STATIC,
      friction: .92,
      restitution: .02,
    })
    this.app.root.addChild(this.groundBody)
  }

  createFarmStructure() {
    this.woodMaterial = this.createMaterial('Weathered cedar', '#6c472c', { gloss: .22 })
    this.woodLightMaterial = this.createMaterial('Sunlit cedar', '#a87843', { gloss: .2 })
    this.woodDarkMaterial = this.createMaterial('Deep stained timber', '#3f2d21', { gloss: .18 })
    this.stoneMaterial = this.createMaterial('Field stone', '#768078', { gloss: .18 })
    this.stoneLightMaterial = this.createMaterial('Field stone highlight', '#aab0a2', { gloss: .16 })
    this.soilMaterial = this.createMaterial('Turned paddock soil', '#725132', { gloss: .08 })
    this.pathMaterial = this.createMaterial('Compacted farm path', '#b99d70', { gloss: .07 })
    this.redBarnMaterial = this.createMaterial('Barn red', '#a84e3c', { gloss: .18 })
    this.creamMaterial = this.createMaterial('Farmhouse cream', '#e9dfbd', { gloss: .2 })
    this.roofMaterial = this.createMaterial('Standing seam roof', '#344f4b', { gloss: .48, metalness: .22 })
    this.techMaterial = this.createMaterial('Compute workshop metal', '#354b4a', { gloss: .58, metalness: .5 })
    this.solarMaterial = this.createMaterial('Solar glass', '#183b56', {
      gloss: .9,
      metalness: .52,
      emissive: '#05111a',
    })
    this.cropMaterial = this.createMaterial('Field crops', '#87b95d', { gloss: .18, emissive: '#061404' })
    this.treeTrunkMaterial = this.createMaterial('Tree trunks', '#67503a', { gloss: .12 })
    this.treeCanopyMaterial = this.createMaterial('Tree canopy', '#477b49', { gloss: .14 })
    this.farHillMaterial = this.createMaterial('Distant wooded ridge', '#58784d', { gloss: .05 })
    this.waterMaterial = this.createMaterial('Trough water', '#4b9db3', {
      gloss: .9,
      metalness: .08,
      emissive: '#082a32',
      opacity: .88,
    })

    this.createProceduralLandscape()
    farmResidents.forEach(resident => {
      this.createHabitatSurface(resident)
      this.createPenFences(resident)
      this.createStation(resident)
      this.createHabitatObstacles(resident)
    })
    this.createFarmSigns()
  }

  createProceduralLandscape() {
    this.createPathNetwork()
    this.createWaterways()
    this.createProductiveFields()
    this.createFarmBuildings()
    this.createValleyBoundary()
    this.createLandscapeScatter()
  }

  createPath(points, width = 2.2, material = this.pathMaterial, name = 'farm-path') {
    points.slice(1).forEach((point, index) => {
      const previous = points[index]
      const dx = point[0] - previous[0]
      const dz = point[1] - previous[1]
      const length = Math.hypot(dx, dz)
      const angle = Math.atan2(dx, dz) * 180 / Math.PI
      this.addPrimitive(this.app.root, `${name}-${index}`, 'box', material, {
        position: [(previous[0] + point[0]) / 2, .035, (previous[1] + point[1]) / 2],
        scale: [width, .06, length + .18],
        rotation: [0, angle, 0],
        castShadows: false,
      })
    })
  }

  createPathNetwork() {
    const local = (center, points) => points.map(([x, z]) => [center + x, z])
    for (const [farmId, center] of Object.entries({ maya: -320, alex: 0, jordan: 320 })) {
      this.createPath(local(center, [[-78, -28], [-48, -21], [-18, -19], [0, -18], [25, -19], [52, -22], [80, -28]]), 2.8, this.pathMaterial, `${farmId}-market-road`)
      this.createPath(local(center, [[0, -22], [-2, -9], [-1, 3], [-4, 14], [-8, 27], [-4, 42], [0, 57]]), 2.45, this.pathMaterial, `${farmId}-main-lane`)
      this.createPath(local(center, [[-38, -18], [-35, -5], [-32, 8], [-28, 23], [-13, 31]]), 1.8, this.pathMaterial, `${farmId}-west-lane`)
      this.createPath(local(center, [[27, -18], [31, -6], [31, 8], [28, 23], [14, 31]]), 1.8, this.pathMaterial, `${farmId}-east-lane`)
    }
    this.createPath([[-620, -36], [-500, -30], [-400, -27], [-320, -28], [-200, -25], [0, -26], [180, -25], [320, -28], [440, -26], [620, -34]], 3.6, this.pathMaterial, 'three-farm-market-route')
  }

  createWaterSegment(name, start, end, width) {
    const dx = end[0] - start[0]
    const dz = end[1] - start[1]
    const length = Math.hypot(dx, dz)
    const angle = Math.atan2(dx, dz) * 180 / Math.PI
    this.addPrimitive(this.app.root, `${name}-bank`, 'box', this.soilMaterial, {
      position: [(start[0] + end[0]) / 2, .045, (start[1] + end[1]) / 2],
      scale: [width + 1.25, .08, length + .9],
      rotation: [0, angle, 0],
      castShadows: false,
    })
    this.addPrimitive(this.app.root, `${name}-water`, 'box', this.waterMaterial, {
      position: [(start[0] + end[0]) / 2, .095, (start[1] + end[1]) / 2],
      scale: [width, .055, length + .7],
      rotation: [0, angle, 0],
      castShadows: false,
    })
  }

  createBridge(name, x, z, width = 6.4, depth = 4.1) {
    const bridge = this.createPhysicalBox(name, [x, .32, z], [width, .5, depth], this.woodLightMaterial, {
      friction: .92,
    })
    for (const side of [-1, 1]) {
      this.addPrimitive(bridge, `${name}-rail-${side}`, 'box', this.woodMaterial, {
        position: [0, .7, side * (depth / 2 - .16)],
        scale: [width, .16, .15],
      })
      for (let index = -2; index <= 2; index += 1) {
        this.addPrimitive(bridge, `${name}-post-${side}-${index}`, 'box', this.woodDarkMaterial, {
          position: [index * width / 5, .48, side * (depth / 2 - .16)],
          scale: [.15, .95, .15],
        })
      }
    }
    return bridge
  }

  createWaterways() {
    const stream = [[-610, 66], [-510, 59], [-420, 65], [-332, 57], [-244, 63], [-150, 58], [-60, 64], [28, 57], [118, 63], [208, 56], [302, 62], [394, 55], [490, 61], [610, 54]]
    stream.slice(1).forEach((point, index) => {
      this.createWaterSegment(`market-creek-${index}`, stream[index], point, 3.25 + index % 3 * .35)
    })
    this.createBridge('Market Creek timber bridge', -2, 39.2, 7.2, 4.8)
    this.createBridge('Innovation Homestead glass bridge', -320, 60.5, 7.2, 4.8)
    this.createBridge('Growth Acres steel bridge', 320, 60.5, 7.2, 4.8)

    this.addPrimitive(this.app.root, 'Anchor pond bank', 'cylinder', this.soilMaterial, {
      position: [43, .06, 23],
      scale: [13, .1, 9],
      castShadows: false,
    })
    this.addPrimitive(this.app.root, 'Anchor pond water', 'cylinder', this.waterMaterial, {
      position: [43, .13, 23],
      scale: [11.6, .08, 7.7],
      castShadows: false,
    })
    for (let index = 0; index < 14; index += 1) {
      const angle = index / 14 * Math.PI * 2
      const radius = index % 2 ? .42 : .3
      this.createPhysicalSphere(
        `anchor-pond-stone-${index}`,
        [43 + Math.cos(angle) * 6.1, radius * .7, 23 + Math.sin(angle) * 4.2],
        radius,
        index % 2 ? this.stoneMaterial : this.stoneLightMaterial,
        { type: pc.BODYTYPE_STATIC, restitution: .01 },
      )
    }
  }

  createField(name, x, z, width, depth, rows = 7) {
    this.addPrimitive(this.app.root, `${name}-soil`, 'box', this.soilMaterial, {
      position: [x, .035, z],
      scale: [width, .07, depth],
      castShadows: false,
    })
    for (let row = 0; row < rows; row += 1) {
      const rowX = x - width * .4 + row * (width * .8 / Math.max(1, rows - 1))
      this.addPrimitive(this.app.root, `${name}-crop-row-${row}`, 'box', this.cropMaterial, {
        position: [rowX, .18, z],
        scale: [.34, .28, depth * .88],
      })
    }
    this.createFenceLine(`${name}-north-fence`, x - width / 2, z - depth / 2, x + width / 2, z - depth / 2, .9)
    this.createFenceLine(`${name}-south-fence`, x - width / 2, z + depth / 2, x + width / 2, z + depth / 2, .9)
  }

  createTree(name, x, z, size = 1, physical = false, blossom = false) {
    const root = new pc.Entity(name)
    root.setPosition(x, 0, z)
    if (physical) {
      root.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(.28 * size, 1.25 * size, .28 * size),
      })
      root.addComponent('rigidbody', {
        type: pc.BODYTYPE_STATIC,
        friction: .9,
        restitution: .01,
      })
    }
    this.app.root.addChild(root)
    this.addPrimitive(root, `${name}-trunk`, 'cylinder', this.treeTrunkMaterial, {
      position: [0, 1.15 * size, 0],
      scale: [.48 * size, 2.3 * size, .48 * size],
    })
    const canopyMaterial = blossom
      ? this.createMaterial(`${name}-blossom`, '#d98d86', { gloss: .16, emissive: '#170605' })
      : this.treeCanopyMaterial
    for (let lobe = 0; lobe < 3; lobe += 1) {
      this.addPrimitive(root, `${name}-canopy-${lobe}`, 'sphere', canopyMaterial, {
        position: [(lobe - 1) * .58 * size, (2.55 + lobe % 2 * .28) * size, Math.sin(lobe * 2) * .28 * size],
        scale: [1.65 * size, 1.35 * size, 1.55 * size],
      })
    }
    return root
  }

  createOrchard(name, x, z, columns = 4, rows = 3, spacing = 3.5) {
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        this.createTree(
          `${name}-tree-${column}-${row}`,
          x + (column - (columns - 1) / 2) * spacing,
          z + (row - (rows - 1) / 2) * spacing,
          .72 + (column + row) % 3 * .08,
          true,
          true,
        )
      }
    }
  }

  createProductiveFields() {
    this.createField('Alex stewardship field', -52, 8, 24, 13, 8)
    this.createField('Alex liquidity annex', 56, 8, 24, 13, 8)
    this.createOrchard('Pippa local orchard', -45, 7, 3, 2, 3.2)
    this.createField('Maya cloud cotton field', -372, 9, 25, 14, 9)
    this.createField('Maya search meadow rows', -265, 10, 23, 13, 8)
    this.createOrchard('Maya connection orchard', -365, -9, 4, 3, 3.5)
    this.createField('Jordan wireless corn field', 268, 9, 26, 14, 9)
    this.createField('Jordan processor field', 377, 9, 24, 13, 8)
    this.createOrchard('Jordan streaming orchard', 370, -9, 4, 3, 3.5)
  }

  createPitchedBuilding(name, x, z, width, height, depth, wallMaterial, roofMaterial = this.roofMaterial, {
    doorMaterial = this.woodDarkMaterial,
    chimney = false,
    porch = false,
  } = {}) {
    const body = this.createPhysicalBox(name, [x, height / 2, z], [width, height, depth], wallMaterial, {
      friction: .84,
    })
    const roofY = height / 2 + width * .15
    for (const side of [-1, 1]) {
      this.addPrimitive(body, `${name}-roof-${side}`, 'box', roofMaterial, {
        position: [side * width * .235, roofY, 0],
        scale: [width * .58, .24, depth * 1.12],
        rotation: [0, 0, side * 30],
      })
    }
    this.addPrimitive(body, `${name}-ridge`, 'box', this.woodDarkMaterial, {
      position: [0, height / 2 + width * .29, 0],
      scale: [.22, .22, depth * 1.15],
    })
    this.addPrimitive(body, `${name}-door`, 'box', doorMaterial, {
      position: [0, -height / 2 + Math.min(1.45, height * .34), depth / 2 + .075],
      scale: [Math.min(2.4, width * .32), Math.min(2.9, height * .68), .14],
    })
    const windowMaterial = this.solarMaterial
    for (const side of [-1, 1]) {
      this.addPrimitive(body, `${name}-window-${side}`, 'box', windowMaterial, {
        position: [side * width * .31, .25, depth / 2 + .085],
        scale: [1.05, .95, .12],
      })
      this.addPrimitive(body, `${name}-window-frame-${side}`, 'box', this.creamMaterial, {
        position: [side * width * .31, .25, depth / 2 + .155],
        scale: [1.24, .1, .07],
      })
    }
    if (chimney) {
      this.addPrimitive(body, `${name}-chimney`, 'box', this.stoneMaterial, {
        position: [width * .27, height / 2 + width * .34, -.8],
        scale: [.8, 2.1, .8],
      })
    }
    if (porch) {
      this.createPhysicalBox(`${name}-porch`, [x, .28, z + depth / 2 + 1.05], [width * .72, .42, 2.1], this.woodLightMaterial)
    }
    return body
  }

  createSilo(name, x, z, radius = 2.2, height = 8.4) {
    const root = new pc.Entity(name)
    root.setPosition(x, height / 2, z)
    root.addComponent('collision', { type: 'cylinder', radius, height })
    root.addComponent('rigidbody', {
      type: pc.BODYTYPE_STATIC,
      friction: .82,
      restitution: .02,
    })
    this.app.root.addChild(root)
    this.addPrimitive(root, `${name}-body`, 'cylinder', this.stoneLightMaterial, {
      scale: [radius * 2, height, radius * 2],
    })
    this.addPrimitive(root, `${name}-roof`, 'cone', this.roofMaterial, {
      position: [0, height / 2 + 1.05, 0],
      scale: [radius * 2.55, 2.15, radius * 2.55],
    })
    for (let rung = 0; rung < 8; rung += 1) {
      this.addPrimitive(root, `${name}-ladder-${rung}`, 'box', this.woodDarkMaterial, {
        position: [radius + .08, -height / 2 + 1 + rung * .8, 0],
        scale: [.12, .12, 1.05],
      })
    }
    return root
  }

  createOpenShed(name, x, z, width, depth, roofMaterial = this.roofMaterial, solar = false) {
    const roof = this.createPhysicalBox(`${name}-roof`, [x, 3.4, z], [width, .32, depth], roofMaterial)
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        this.createPhysicalBox(
          `${name}-post-${sideX}-${sideZ}`,
          [x + sideX * (width / 2 - .28), 1.7, z + sideZ * (depth / 2 - .28)],
          [.38, 3.4, .38],
          this.woodDarkMaterial,
        )
      }
    }
    this.createPhysicalBox(`${name}-back-wall`, [x, 1.55, z - depth / 2 + .18], [width, 3.1, .36], this.woodMaterial)
    if (solar) {
      for (let column = -1; column <= 1; column += 1) {
        this.addPrimitive(roof, `${name}-solar-panel-${column}`, 'box', this.solarMaterial, {
          position: [column * width * .28, .28, 0],
          scale: [width * .25, .12, depth * .86],
        })
      }
    }
    return roof
  }

  createFarmBuildings() {
    const barn = this.createPitchedBuilding('Ticker Tails three-dimensional barn', -1, -23, 12, 6.2, 7.4, this.redBarnMaterial)
    this.addPrimitive(barn, 'Ticker Tails barn hay loft door', 'box', this.woodLightMaterial, {
      position: [0, 1.55, 3.78],
      scale: [2.45, 1.65, .16],
    })
    this.addPrimitive(barn, 'Ticker Tails barn cupola', 'box', this.creamMaterial, {
      position: [0, 5.15, 0],
      scale: [2.1, 1.35, 2.1],
    })
    this.addPrimitive(barn, 'Ticker Tails barn cupola roof', 'cone', this.roofMaterial, {
      position: [0, 6.1, 0],
      scale: [2.7, 1.3, 2.7],
    })
    this.createSilo('Ticker Tails physical grain silo', 8.5, -23, 2.35, 8.7)

    const workshop = this.createPitchedBuilding('NVIDIA compute workshop', 35, -15, 10, 4.8, 6.2, this.techMaterial)
    for (let index = 0; index < 5; index += 1) {
      this.addPrimitive(workshop, `NVIDIA workshop cooling-fin-${index}`, 'box', this.solarMaterial, {
        position: [-3.5 + index * 1.75, .4, 3.18],
        scale: [1.25, 1.8, .12],
      })
    }
    this.createOpenShed('Tesla solar charging barn', -19, -14, 10, 6.2, this.roofMaterial, true)
    this.createOpenShed('Pippa orchard shelter', -34, 6.6, 7.2, 4.5, this.redBarnMaterial)
    this.createPitchedBuilding('Anchor elephant stable', 31, 16.5, 11, 4.7, 6.5, this.creamMaterial)

    this.createPitchedBuilding('Alex physical farmhouse', -15, 28, 10.5, 4.8, 7.2, this.creamMaterial, this.roofMaterial, {
      chimney: true,
      porch: true,
    })
    const mayaHouse = this.createPitchedBuilding('Maya innovation farmhouse', -335, 28, 11, 5.1, 7.5, this.creamMaterial, this.solarMaterial, {
      chimney: true,
      porch: true,
    })
    this.addPrimitive(mayaHouse, 'Maya rooftop research array', 'box', this.solarMaterial, {
      position: [0, 4.9, 0],
      scale: [4.8, .16, 2.4],
      rotation: [0, 0, -8],
    })
    this.createPitchedBuilding('Maya glass research barn', -321, -23, 12, 6, 7.2, this.techMaterial, this.solarMaterial)
    this.createSilo('Maya network observatory', -310, -22, 2.1, 8.2)
    this.createOpenShed('Maya cloud greenhouse', -357, -14, 11, 7, this.solarMaterial, true)
    this.createPitchedBuilding('Maya commerce stable', -289, 17, 11, 4.9, 6.6, this.creamMaterial, this.solarMaterial)

    const jordanHouse = this.createPitchedBuilding('Jordan growth farmhouse', 305, 28, 11, 5, 7.4, this.redBarnMaterial, this.roofMaterial, {
      chimney: true,
      porch: true,
    })
    this.addPrimitive(jordanHouse, 'Jordan growth beacon', 'cylinder', this.solarMaterial, {
      position: [0, 6.1, 0],
      scale: [.45, 3.6, .45],
    })
    this.createPitchedBuilding('Jordan processor barn', 320, -23, 12.5, 6.2, 7.3, this.redBarnMaterial, this.roofMaterial)
    this.createSilo('Jordan database archive tower', 331, -22, 2.2, 8.8)
    this.createOpenShed('Jordan analytics hangar', 354, -14, 11, 7, this.techMaterial, true)
    this.createPitchedBuilding('Jordan streaming pavilion', 289, 17, 11.5, 4.7, 7, this.creamMaterial, this.redBarnMaterial)
  }

  createValleyBoundary() {
    const halfWidth = VALLEY.boundaryWidth / 2
    const halfDepth = VALLEY.boundaryDepth / 2
    this.createPhysicalBox('West valley boundary hedgerow', [-halfWidth, 2.1, 0], [1.8, 4.2, VALLEY.boundaryDepth], this.farHillMaterial)
    this.createPhysicalBox('East valley boundary hedgerow', [halfWidth, 2.1, 0], [1.8, 4.2, VALLEY.boundaryDepth], this.farHillMaterial)
    this.createPhysicalBox('North valley boundary hedgerow', [0, 2.1, -halfDepth], [VALLEY.boundaryWidth, 4.2, 1.8], this.farHillMaterial)
    this.createPhysicalBox('South valley boundary hedgerow', [0, 2.1, halfDepth], [VALLEY.boundaryWidth, 4.2, 1.8], this.farHillMaterial)

    const ridges = []
    for (let x = -1250; x <= 1250; x += 120) {
      ridges.push([x, -790 - Math.abs(x % 97) * .1, 48 + Math.abs(x % 13)])
      ridges.push([x + 34, 795 + Math.abs(x % 89) * .08, 46 + Math.abs(x % 17)])
    }
    for (let z = -680; z <= 680; z += 110) {
      ridges.push([-1210 - Math.abs(z % 71) * .12, z, 44 + Math.abs(z % 19)])
      ridges.push([1215 + Math.abs(z % 67) * .1, z + 22, 46 + Math.abs(z % 17)])
    }
    ridges.forEach(([x, z, size], index) => {
      this.addPrimitive(this.app.root, `far-valley-ridge-${index}`, 'cone', this.farHillMaterial, {
        position: [x, size * .34 - .04, z],
        scale: [size * 1.55, size * .68, size],
        castShadows: false,
      })
    })
  }

  createLandscapeScatter() {
    let seed = 72391
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    for (let index = 0; index < 96; index += 1) {
      let x = -1050 + random() * 2100
      let z = -670 + random() * 1340
      const nearFarm = [-320, 0, 320].some(center => Math.abs(x - center) < 52 && Math.abs(z) < 34)
      if (nearFarm) z += z < 0 ? -55 : 55
      this.createTree(`valley-windbreak-tree-${index}`, x, z, .68 + random() * .55)
    }
    for (let index = 0; index < 48; index += 1) {
      const x = -1050 + random() * 2100
      const z = -670 + random() * 1340
      const radius = .35 + random() * .55
      this.addPrimitive(this.app.root, `valley-boulder-${index}`, 'sphere', index % 2 ? this.stoneMaterial : this.stoneLightMaterial, {
        position: [x, radius * .58, z],
        scale: [radius * 1.7, radius, radius * 1.35],
        rotation: [random() * 22, random() * 180, random() * 16],
      })
    }
  }

  createHabitatSurface(resident) {
    const { pen } = resident
    const width = mapWidth(pen.width)
    const depth = mapDepth(pen.height)
    const centerX = residentX(resident, pen.x + pen.width / 2)
    const centerZ = residentZ(resident, pen.y + pen.height / 2)
    const habitatMaterial = this.createMaterial(`${resident.id}-habitat`, resident.accent, {
      gloss: .08,
      opacity: resident.kind === 'crop' ? .2 : .12,
    })
    habitatMaterial.depthWrite = false
    habitatMaterial.update()
    this.addPrimitive(this.app.root, `${resident.home}-physical-surface`, 'plane', habitatMaterial, {
      position: [centerX, .035, centerZ],
      scale: [width * .94, 1, depth * .9],
      castShadows: false,
      receiveShadows: true,
    })
  }

  createPenFences(resident) {
    const { pen } = resident
    const left = residentX(resident, pen.x)
    const right = residentX(resident, pen.x + pen.width)
    const near = residentZ(resident, pen.y)
    const far = residentZ(resident, pen.y + pen.height)
    const fenceHeight = resident.kind === 'elephant' || resident.kind === 'dragon' ? 1.35 : 1.05
    this.createFenceLine(`${resident.id}-north`, left, near, right, near, fenceHeight)
    this.createFenceLine(`${resident.id}-south`, left, far, right, far, fenceHeight)
    this.createFenceLine(`${resident.id}-west`, left, near, left, far, fenceHeight)
    this.createFenceLine(`${resident.id}-east`, right, near, right, far, fenceHeight)
  }

  createFenceLine(name, startX, startZ, endX, endZ, height) {
    const dx = endX - startX
    const dz = endZ - startZ
    const length = Math.hypot(dx, dz)
    const angle = Math.atan2(dx, dz) * 180 / Math.PI
    const centerX = (startX + endX) / 2
    const centerZ = (startZ + endZ) / 2

    const collider = new pc.Entity(`${name}-collision`)
    collider.setPosition(centerX, height * .52, centerZ)
    collider.setEulerAngles(0, angle, 0)
    collider.addComponent('collision', {
      type: 'box',
      halfExtents: new pc.Vec3(.12, height * .52, length / 2),
    })
    collider.addComponent('rigidbody', {
      type: pc.BODYTYPE_STATIC,
      friction: .75,
      restitution: .02,
    })
    this.app.root.addChild(collider)

    for (const y of [height * .38, height * .78]) {
      this.addPrimitive(collider, `${name}-rail-${y}`, 'box', this.woodLightMaterial, {
        position: [0, y - height * .52, 0],
        scale: [.18, .14, length],
      })
    }
    const postCount = Math.max(2, Math.ceil(length / 2.1))
    for (let index = 0; index <= postCount; index += 1) {
      this.addPrimitive(collider, `${name}-post-${index}`, 'cylinder', this.woodMaterial, {
        position: [0, 0, -length / 2 + length * index / postCount],
        scale: [.16, height * .56, .16],
      })
    }
  }

  createPhysicalBox(name, position, dimensions, material, {
    type = pc.BODYTYPE_STATIC,
    mass = 1,
    friction = .72,
    restitution = .05,
    rotation = [0, 0, 0],
  } = {}) {
    const entity = new pc.Entity(name)
    entity.setPosition(...position)
    entity.setEulerAngles(...rotation)
    entity.addComponent('collision', {
      type: 'box',
      halfExtents: new pc.Vec3(dimensions[0] / 2, dimensions[1] / 2, dimensions[2] / 2),
    })
    entity.addComponent('rigidbody', { type, mass, friction, restitution, linearDamping: .34, angularDamping: .42 })
    this.app.root.addChild(entity)
    this.addPrimitive(entity, `${name}-render`, 'box', material, { scale: dimensions })
    if (type === pc.BODYTYPE_DYNAMIC) this.dynamicProps.push(entity)
    return entity
  }

  createPhysicalSphere(name, position, radius, material, {
    type = pc.BODYTYPE_DYNAMIC,
    mass = 1,
    friction = .62,
    restitution = .18,
  } = {}) {
    const entity = new pc.Entity(name)
    entity.setPosition(...position)
    entity.addComponent('collision', { type: 'sphere', radius })
    entity.addComponent('rigidbody', { type, mass, friction, restitution, linearDamping: .18, angularDamping: .22 })
    this.app.root.addChild(entity)
    this.addPrimitive(entity, `${name}-render`, 'sphere', material, { scale: [radius * 2, radius * 2, radius * 2] })
    if (type === pc.BODYTYPE_DYNAMIC) this.dynamicProps.push(entity)
    return entity
  }

  createStation(resident) {
    const x = residentX(resident, resident.station.x)
    const z = residentZ(resident, resident.station.y)
    const accentMaterial = this.createMaterial(`${resident.id}-objective`, resident.accent, {
      gloss: .68,
      metalness: resident.kind === 'dragon' || resident.kind === 'cat' ? .52 : .08,
      emissive: resident.kind === 'dragon' ? '#07351f' : '#130d04',
    })
    const halo = this.addPrimitive(this.app.root, `${resident.id}-objective-halo`, 'cylinder', accentMaterial, {
      position: [x, .09, z],
      scale: [1.25, .035, 1.25],
      castShadows: false,
    })
    halo.render.meshInstances.forEach(instance => { instance.castShadow = false })
    const station = { x, z, halo, props: [], phase: Math.random() * Math.PI * 2 }

    if (resident.kind === 'dragon') {
      for (let index = 0; index < 7; index += 1) {
        const chip = this.createPhysicalBox(
          `${resident.id}-gpu-${index}`,
          [x + (index % 3 - 1) * .58, .26 + Math.floor(index / 3) * .3, z + (index % 2) * .34],
          [.72, .22, .46],
          index % 2 ? accentMaterial : this.woodMaterial,
          { type: pc.BODYTYPE_DYNAMIC, mass: .7, friction: .7, restitution: .03 },
        )
        station.props.push(chip)
      }
    } else if (resident.kind === 'pig') {
      const trough = this.createPhysicalBox(`${resident.id}-trough`, [x, .27, z], [1.8, .48, .72], this.woodMaterial)
      station.props.push(trough)
      const appleMaterial = this.createMaterial('Physical apples', '#c94d38', { gloss: .5 })
      for (let index = 0; index < 5; index += 1) {
        station.props.push(this.createPhysicalSphere(
          `${resident.id}-apple-${index}`,
          [x - .65 + index * .32, .72 + index % 2 * .18, z],
          .18,
          appleMaterial,
          { mass: .25, friction: .58, restitution: .22 },
        ))
      }
    } else if (resident.kind === 'cat') {
      const charger = this.createPhysicalBox(`${resident.id}-charger`, [x, .43, z], [1.05, .78, .85], accentMaterial)
      station.props.push(charger)
      const chargeOrb = this.createPhysicalSphere(`${resident.id}-charge-orb`, [x + .65, .55, z], .24, accentMaterial, {
        mass: .45,
        restitution: .38,
      })
      station.props.push(chargeOrb)
    } else if (resident.kind === 'owl') {
      const perch = this.createPhysicalBox(`${resident.id}-perch`, [x, 1.25, z], [.22, 2.5, .22], this.woodMaterial)
      station.props.push(perch)
      this.addPrimitive(perch, `${resident.id}-perch-crossbar`, 'box', this.woodLightMaterial, {
        position: [0, .86, 0],
        scale: [1.8, .14, .14],
      })
      const orb = this.createPhysicalSphere(`${resident.id}-cloud-orb`, [x, 2.65, z], .25, accentMaterial, {
        type: pc.BODYTYPE_STATIC,
      })
      station.props.push(orb)
    } else if (resident.kind === 'tortoise') {
      for (let index = 0; index < 4; index += 1) {
        station.props.push(this.createPhysicalSphere(
          `${resident.id}-value-stone-${index}`,
          [x + (index - 1.5) * .48, .27, z + Math.sin(index) * .32],
          .29,
          index % 2 ? this.stoneMaterial : this.stoneLightMaterial,
          { type: index === 3 ? pc.BODYTYPE_DYNAMIC : pc.BODYTYPE_STATIC, mass: 4, restitution: .02 },
        ))
      }
    } else if (resident.kind === 'elephant') {
      const trough = this.createPhysicalBox(`${resident.id}-water-trough`, [x, .38, z], [2.15, .68, 1.05], this.stoneMaterial)
      this.addPrimitive(trough, `${resident.id}-water`, 'box', this.waterMaterial, {
        position: [0, .37, 0],
        scale: [1.82, .06, .72],
        castShadows: false,
      })
      station.props.push(trough)
      station.props.push(this.createPhysicalSphere(`${resident.id}-water-ball`, [x + 1.2, .54, z], .36, accentMaterial, {
        mass: .8,
        restitution: .46,
      }))
    } else if (['dog', 'fox'].includes(resident.kind)) {
      for (let index = 0; index < 4; index += 1) {
        station.props.push(this.createPhysicalSphere(
          `${resident.id}-trail-marker-${index}`,
          [x + (index - 1.5) * .55, .2 + index % 2 * .1, z + Math.sin(index) * .45],
          .2,
          index % 2 ? accentMaterial : this.stoneLightMaterial,
          { type: index === 3 ? pc.BODYTYPE_DYNAMIC : pc.BODYTYPE_STATIC, mass: .4, restitution: .16 },
        ))
      }
    } else if (resident.kind === 'horse') {
      const cart = this.createPhysicalBox(`${resident.id}-delivery-cart`, [x, .55, z], [2.1, .8, 1.2], this.woodLightMaterial)
      for (const side of [-1, 1]) {
        this.addPrimitive(cart, `${resident.id}-cart-wheel-${side}`, 'cylinder', this.woodDarkMaterial, {
          position: [side * 1.02, -.25, 0],
          scale: [.55, .16, .55],
          rotation: [0, 0, 90],
        })
      }
      station.props.push(cart)
    } else if (resident.kind === 'beaver') {
      for (let index = 0; index < 5; index += 1) {
        station.props.push(this.createPhysicalBox(
          `${resident.id}-dam-log-${index}`,
          [x + (index - 2) * .42, .24 + index % 2 * .22, z + Math.sin(index) * .3],
          [.3, .3, 1.35],
          this.woodMaterial,
          { type: index > 2 ? pc.BODYTYPE_DYNAMIC : pc.BODYTYPE_STATIC, mass: 1.2 },
        ))
      }
    } else if (resident.kind === 'ox') {
      const wheel = this.createPhysicalSphere(`${resident.id}-record-wheel`, [x, .75, z], .72, accentMaterial, {
        type: pc.BODYTYPE_STATIC,
      })
      wheel.setEulerAngles(90, 0, 0)
      station.props.push(wheel)
    } else if (resident.kind === 'flamingo') {
      this.addPrimitive(this.app.root, `${resident.id}-story-pool-bank`, 'cylinder', this.soilMaterial, {
        position: [x, .08, z],
        scale: [3.5, .1, 2.6],
      })
      this.addPrimitive(this.app.root, `${resident.id}-story-pool-water`, 'cylinder', this.waterMaterial, {
        position: [x, .14, z],
        scale: [3.1, .08, 2.25],
        castShadows: false,
      })
    } else if (['hawk', 'peacock'].includes(resident.kind)) {
      const tower = this.createPhysicalBox(`${resident.id}-signal-tower`, [x, 1.55, z], [.32, 3.1, .32], this.woodDarkMaterial)
      this.addPrimitive(tower, `${resident.id}-signal-crossbar`, 'box', accentMaterial, {
        position: [0, 1.05, 0],
        scale: [2.2, .16, .16],
      })
      station.props.push(tower)
    } else {
      const pump = this.createPhysicalBox(`${resident.id}-pump`, [x, .62, z], [.7, 1.2, .7], accentMaterial)
      station.props.push(pump)
    }
    resident.playcanvasStation = station
  }

  createHabitatObstacles(resident) {
    if (resident.kind === 'crop') return
    const { pen } = resident
    const positions = [
      [pen.x + pen.width * .25, pen.y + pen.height * .72],
      [pen.x + pen.width * .72, pen.y + pen.height * .28],
    ]
    positions.forEach(([px, py], index) => {
      const radius = resident.kind === 'elephant' ? .55 : .34 + index * .09
      this.createPhysicalSphere(
        `${resident.id}-ground-obstacle-${index}`,
        [residentX(resident, px), radius * .72, residentZ(resident, py)],
        radius,
        index ? this.stoneLightMaterial : this.stoneMaterial,
        { type: pc.BODYTYPE_STATIC, restitution: .01 },
      )
    })
  }

  createFarmSigns() {
    const signs = [
      { x: -320, z: -33, text: 'MAYA · INNOVATION HOMESTEAD', tint: '#356d78' },
      { x: -1, z: -29, text: 'ALEX · TICKER TAILS FARM', tint: '#2f6947' },
      { x: 320, z: -33, text: 'JORDAN · GROWTH ACRES', tint: '#76502f' },
    ]
    signs.forEach((sign, index) => {
      const texture = this.textureFromSource(this.drawLabel(sign.text, sign.tint), true)
      const material = this.createTextureMaterial(`farm-sign-${index}`, texture, { alpha: true, emissive: .5 })
      const entity = this.addPrimitive(this.app.root, sign.text, 'plane', material, {
        position: [sign.x, 3.25, sign.z],
        scale: [7.3, 1, 1.25],
        rotation: [90, 0, 0],
        castShadows: false,
      })
      entity.render.meshInstances.forEach(instance => { instance.castShadow = false })
    })
  }

  drawLabel(text, tint = '#315f43') {
    return makeCanvas(512, 86, (context, width, height) => {
      context.fillStyle = 'rgba(255,252,231,.95)'
      context.strokeStyle = 'rgba(26,55,42,.25)'
      context.lineWidth = 4
      context.beginPath()
      context.roundRect(4, 4, width - 8, height - 8, 23)
      context.fill()
      context.stroke()
      context.fillStyle = tint
      context.font = '900 30px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(text, width / 2, height / 2 + 2, width - 34)
    })
  }

  drawCreatureLabel(resident) {
    return makeCanvas(1024, 256, (context, width, height) => {
      const dayChange = `${resident.dayChange >= 0 ? '+' : ''}${resident.dayChange.toFixed(1)}%`
      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgba(255,252,228,.98)'
      context.strokeStyle = resident.accent
      context.lineWidth = 12
      context.beginPath()
      context.roundRect(10, 10, width - 20, height - 20, 38)
      context.fill()
      context.stroke()

      context.fillStyle = resident.accent
      context.beginPath()
      context.roundRect(30, 28, 190, 92, 25)
      context.fill()
      context.fillStyle = '#12352e'
      context.font = '900 56px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(resident.ticker, 125, 76, 166)

      context.fillStyle = '#173f35'
      context.font = '900 62px Arial'
      context.textAlign = 'left'
      context.fillText(resident.shortName, 252, 75, 520)

      context.fillStyle = resident.dayChange >= 0 ? '#24724c' : '#a7433f'
      context.font = '900 44px Arial'
      context.textAlign = 'right'
      context.fillText(dayChange, 970, 76, 170)

      context.strokeStyle = 'rgba(23,63,53,.13)'
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(38, 139)
      context.lineTo(width - 38, 139)
      context.stroke()

      context.fillStyle = '#355f54'
      context.font = '800 34px Arial'
      context.textAlign = 'center'
      context.fillText(`${resident.avatar}  ·  ${resident.home}`, width / 2, 190, 920)
    })
  }

  createCreatureNameplate(resident, parent, y, {
    width = 5.9,
    height = 1.5,
  } = {}) {
    const root = new pc.Entity(`${resident.id}-three-dimensional-nameplate`)
    root.setLocalPosition(0, y, 0)
    root.setLocalEulerAngles(90, 45, 0)
    parent.addChild(root)

    const frameMaterial = this.createMaterial(`${resident.id}-nameplate-frame`, '#173f35', {
      gloss: .58,
      metalness: .26,
    })
    const accentMaterial = this.createMaterial(`${resident.id}-nameplate-accent`, resident.accent, {
      gloss: .68,
      metalness: .18,
      emissive: resident.kind === 'dragon' ? '#052717' : '#080805',
    })
    this.addPrimitive(root, `${resident.id}-nameplate-body`, 'box', frameMaterial, {
      scale: [width, .2, height],
    })
    for (const edge of [-1, 1]) {
      this.addPrimitive(root, `${resident.id}-nameplate-rail-${edge}`, 'box', accentMaterial, {
        position: [0, .14, edge * (height / 2 - .08)],
        scale: [width * .96, .11, .13],
      })
      for (const side of [-1, 1]) {
        this.addPrimitive(root, `${resident.id}-nameplate-bolt-${edge}-${side}`, 'sphere', this.stoneLightMaterial, {
          position: [side * (width / 2 - .22), .17, edge * (height / 2 - .2)],
          scale: [.12, .07, .12],
          castShadows: false,
        })
      }
    }

    const texture = this.textureFromSource(this.drawCreatureLabel(resident), true)
    texture.anisotropy = 8
    const faceMaterial = this.createTextureMaterial(`${resident.id}-nameplate-face`, texture, {
      alpha: true,
      emissive: .72,
    })
    this.addPrimitive(root, `${resident.id}-nameplate-text`, 'plane', faceMaterial, {
      position: [0, .115, 0],
      scale: [width * .91, 1, height * .78],
      castShadows: false,
    })
    return root
  }

  drawClusterCount(context, count) {
    context.clearRect(0, 0, 256, 256)
    context.fillStyle = 'rgba(255,250,222,.99)'
    context.strokeStyle = '#173f35'
    context.lineWidth = 18
    context.beginPath()
    context.arc(128, 128, 108, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.fillStyle = '#2f835d'
    context.beginPath()
    context.arc(128, 128, 82, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#ffffff'
    context.font = '900 112px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(String(count), 128, 134)
  }

  createLabelClusterSystem() {
    this.clusterFrameMaterial = this.createMaterial('Cluster marker frame', '#173f35', {
      gloss: .64,
      metalness: .28,
    })
    for (let index = 0; index < 10; index += 1) {
      const canvas = makeCanvas(256, 256, context => this.drawClusterCount(context, 2))
      const texture = this.textureFromSource(canvas, true)
      texture.anisotropy = 8
      const material = this.createTextureMaterial(`label-cluster-face-${index}`, texture, {
        alpha: true,
        emissive: .8,
      })
      const root = new pc.Entity(`label-cluster-marker-${index}`)
      root.setLocalEulerAngles(90, 45, 0)
      root.enabled = false
      this.app.root.addChild(root)
      this.addPrimitive(root, `label-cluster-body-${index}`, 'box', this.clusterFrameMaterial, {
        scale: [1.75, .22, 1.75],
      })
      this.addPrimitive(root, `label-cluster-text-${index}`, 'plane', material, {
        position: [0, .13, 0],
        scale: [1.5, 1, 1.5],
        castShadows: false,
      })
      this.labelClusterMarkers.push({
        root,
        canvas,
        context: canvas.getContext('2d'),
        texture,
        count: 2,
      })
    }
  }

  updateNameplates() {
    if (!this.camera || !this.app) return
    if (this.expandedLabelsUntil && this.elapsed > this.expandedLabelsUntil) {
      this.expandedLabelIds.clear()
      this.expandedLabelsUntil = 0
    }

    const rect = this.canvas.getBoundingClientRect()
    const cameraPosition = this.camera.getPosition()
    const entries = []
    const expanded = [...this.expandedLabelIds]
    this.actors.forEach(actor => {
      const source = actor.state === 'crop' ? actor.root : actor.physicsRoot
      const value = this.options.getPosition(actor.resident.id)
      if (!source?.enabled || value <= 0) {
        actor.label.enabled = false
        return
      }
      const position = source.getPosition()
      const distance = cameraPosition.distance(position)
      const scale = clamp(distance / 36, .55, 6.5)
      actor.label.setLocalScale(scale, scale, scale)
      const expandedIndex = expanded.indexOf(actor.resident.id)
      const baseY = actor.labelBaseY
      actor.label.setLocalPosition(
        expandedIndex >= 0 ? (expandedIndex - (expanded.length - 1) / 2) * .75 : 0,
        baseY + (expandedIndex >= 0 ? Math.abs(expandedIndex - (expanded.length - 1) / 2) * .72 : 0),
        0,
      )
      const screen = this.camera.camera.worldToScreen(actor.label.getPosition())
      const screenX = screen.x
      const screenY = screen.y
      const visible = screenX > -160 && screenX < rect.width + 160 && screenY > -100 && screenY < rect.height + 100
      actor.label.enabled = visible
      if (visible && expandedIndex < 0) entries.push({ actor, screenX, screenY, position })
    })

    const groups = []
    entries.sort((a, b) => a.screenX - b.screenX)
    entries.forEach(entry => {
      const group = groups.find(candidate => candidate.some(member => (
        Math.abs(member.screenX - entry.screenX) < 190
        && Math.abs(member.screenY - entry.screenY) < 82
      )))
      if (group) group.push(entry)
      else groups.push([entry])
    })

    this.labelClusters = []
    let markerIndex = 0
    groups.forEach(group => {
      if (group.length === 1) return
      group.forEach(entry => { entry.actor.label.enabled = false })
      const marker = this.labelClusterMarkers[markerIndex]
      if (!marker) return
      markerIndex += 1
      if (marker.count !== group.length) {
        marker.count = group.length
        this.drawClusterCount(marker.context, group.length)
        marker.texture.setSource(marker.canvas)
      }
      const averageX = group.reduce((sum, entry) => sum + entry.position.x, 0) / group.length
      const averageZ = group.reduce((sum, entry) => sum + entry.position.z, 0) / group.length
      const highestLabel = Math.max(...group.map(entry => entry.actor.labelBaseY))
      marker.root.setPosition(averageX, highestLabel + 1.15, averageZ)
      const distance = cameraPosition.distance(marker.root.getPosition())
      const scale = clamp(distance / 36, .62, 6.5)
      marker.root.setLocalScale(scale, scale, scale)
      marker.root.enabled = true
      const markerScreen = this.camera.camera.worldToScreen(marker.root.getPosition())
      this.labelClusters.push({
        ids: group.map(entry => entry.actor.resident.id),
        screenX: markerScreen.x,
        screenY: markerScreen.y,
      })
    })
    for (let index = markerIndex; index < this.labelClusterMarkers.length; index += 1) {
      this.labelClusterMarkers[index].root.enabled = false
    }
  }

  drawGrassTexture() {
    return makeCanvas(256, 256, (context, width, height) => {
      context.fillStyle = '#70944f'
      context.fillRect(0, 0, width, height)
      let seed = 8421
      const random = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
      }
      for (let index = 0; index < 850; index += 1) {
        const x = random() * width
        const y = random() * height
        const length = 1 + random() * 4
        context.strokeStyle = random() > .48 ? 'rgba(38,91,43,.3)' : 'rgba(214,218,117,.25)'
        context.lineWidth = .5 + random()
        context.beginPath()
        context.moveTo(x, y)
        context.lineTo(x + (random() - .5) * 2, y - length)
        context.stroke()
      }
    })
  }

  createResidents() {
    farmResidents.forEach(resident => {
      if (resident.kind === 'crop') this.createCrop(resident)
      else this.createAnimal(resident)
    })
  }

  createAnimal(resident) {
    const rig = createAnimalRig(resident, this.createMaterial)
    const physicsRoot = new pc.Entity(`resident:${resident.id}`)
    const start = new pc.Vec3(residentX(resident, resident.anchor.x), rig.bodyHeight * .58 + .15, residentZ(resident, resident.anchor.y))
    physicsRoot.setPosition(start)
    physicsRoot.addComponent('collision', {
      type: 'capsule',
      radius: rig.radius,
      height: rig.bodyHeight,
      axis: 1,
    })
    physicsRoot.addComponent('rigidbody', {
      type: pc.BODYTYPE_DYNAMIC,
      mass: rig.mass,
      friction: .82,
      restitution: .02,
      linearDamping: .45,
      angularDamping: .98,
    })
    physicsRoot.rigidbody.angularFactor = new pc.Vec3(0, 0, 0)
    this.app.root.addChild(physicsRoot)

    const heading = new pc.Entity(`${resident.id}-visual-heading`)
    physicsRoot.addChild(heading)
    heading.addChild(rig.root)

    const labelBaseY = rig.bodyHeight * .9 + .9
    const label = this.createCreatureNameplate(resident, physicsRoot, labelBaseY)

    const actor = {
      resident,
      rig,
      physicsRoot,
      heading,
      label,
      labelBaseY,
      state: 'idle',
      target: null,
      afterArrival: null,
      nextDecision: .7 + Math.random() * 1.6,
      manual: null,
      gaitClock: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      motionSpeed: 0,
      yaw: 0,
      renderScale: 1,
      stationCooldown: 0,
    }
    this.actors.set(resident.id, actor)
    this.updateInvestment(resident.id)
    this.applyCosmetic(resident.id)
  }

  createCrop(resident) {
    const cropType = resident.cropType || 'clover'
    const root = new pc.Entity(`${resident.id}-${cropType}-crop-3D`)
    root.setPosition(residentX(resident, resident.anchor.x), .03, residentZ(resident, resident.anchor.y))
    this.app.root.addChild(root)
    const stemMaterial = this.createMaterial(`${resident.id} crop stems`, cropType === 'corn' ? '#65813d' : '#39794a', { gloss: .2 })
    const leafMaterial = this.createMaterial(`${resident.id} crop leaves`, cropType === 'cotton' ? '#5b8b55' : '#79c65f', {
      gloss: .27,
      emissive: '#061806',
    })
    const produceMaterial = this.createMaterial(
      `${resident.id} crop produce`,
      cropType === 'cotton' ? '#f5f1dc' : cropType === 'corn' ? '#e3b944' : '#79c65f',
      { gloss: cropType === 'cotton' ? .5 : .25 },
    )
    const plants = []
    const plantCount = cropType === 'corn' ? 24 : 32
    const columns = cropType === 'corn' ? 6 : 8
    for (let index = 0; index < plantCount; index += 1) {
      const plant = new pc.Entity(`${cropType}-${index}`)
      const column = index % columns
      const row = Math.floor(index / columns)
      plant.setLocalPosition((column - (columns - 1) / 2) * (cropType === 'corn' ? .72 : .56), 0, (row - 1.5) * .68)
      root.addChild(plant)
      this.addPrimitive(plant, `stem-${index}`, 'cylinder', stemMaterial, {
        position: [0, cropType === 'corn' ? .72 : cropType === 'cotton' ? .43 : .28, 0],
        scale: [cropType === 'corn' ? .055 : .035, cropType === 'corn' ? 1.42 : cropType === 'cotton' ? .84 : .28, cropType === 'corn' ? .055 : .035],
      })
      const leafCount = cropType === 'corn' ? 5 : 3
      for (let leaf = 0; leaf < leafCount; leaf += 1) {
        const angle = leaf * Math.PI * 2 / 3
        this.addPrimitive(plant, `leaf-${index}-${leaf}`, 'sphere', leafMaterial, {
          position: [
            Math.cos(angle) * (cropType === 'corn' ? .18 : .13),
            cropType === 'corn' ? .34 + leaf * .23 : cropType === 'cotton' ? .4 + leaf * .17 : .56,
            Math.sin(angle) * (cropType === 'corn' ? .18 : .13),
          ],
          scale: cropType === 'corn' ? [.12, .05, .44] : [.18, .055, .13],
          rotation: [0, -angle * 180 / Math.PI, 0],
        })
      }
      if (cropType === 'cotton') {
        for (let boll = 0; boll < 3; boll += 1) {
          const angle = boll * Math.PI * 2 / 3
          this.addPrimitive(plant, `cotton-boll-${index}-${boll}`, 'sphere', produceMaterial, {
            position: [Math.cos(angle) * .18, .82 + boll % 2 * .12, Math.sin(angle) * .18],
            scale: [.18, .17, .18],
          })
        }
      } else if (cropType === 'corn') {
        this.addPrimitive(plant, `corn-cob-${index}`, 'capsule', produceMaterial, {
          position: [.12, .84, -.08],
          scale: [.1, .28, .1],
          rotation: [0, 0, -18],
        })
      }
      plants.push({ entity: plant, phase: index * .47 })
    }
    const labelBaseY = cropType === 'corn' ? 2.35 : cropType === 'cotton' ? 1.9 : 1.6
    const label = this.createCreatureNameplate(resident, root, labelBaseY, { width: 6.4, height: 1.55 })
    const actor = {
      resident,
      root,
      plants,
      label,
      labelBaseY,
      state: 'crop',
      scale: 1,
      pulse: 0,
      phase: Math.random() * Math.PI * 2,
    }
    this.actors.set(resident.id, actor)
    this.updateInvestment(resident.id)
  }

  createWeatherSystem() {
    this.cloudMaterial = this.createMaterial('Volumetric farm clouds', '#eef2e8', {
      gloss: .08,
      opacity: .58,
    })
    this.rainMaterial = this.createMaterial('Macro rain', '#9ed7e5', {
      gloss: .72,
      emissive: '#0b2630',
      opacity: .78,
    })
    this.clouds = Array.from({ length: 18 }, (_, index) => {
      const root = new pc.Entity(`cloud-bank-${index}`)
      root.setPosition(-960 + index * 112, 15 + index % 2 * 2, -220 + index % 7 * 72)
      this.app.root.addChild(root)
      for (let lobe = 0; lobe < 5; lobe += 1) {
        this.addPrimitive(root, `cloud-${index}-${lobe}`, 'sphere', this.cloudMaterial, {
          position: [(lobe - 2) * 1.2, Math.sin(lobe) * .45, Math.cos(lobe) * .7],
          scale: [2.5 - Math.abs(lobe - 2) * .25, 1.2 + lobe % 2 * .35, 1.7],
          castShadows: false,
        })
      }
      return { entity: root, speed: .8 + index * .09 }
    })
    this.rain = Array.from({ length: 72 }, (_, index) => {
      const entity = this.addPrimitive(this.app.root, `rain-drop-${index}`, 'cylinder', this.rainMaterial, {
        position: [
          this.cameraTarget.x - 18 + Math.random() * 36,
          5 + Math.random() * 15,
          this.cameraTarget.z - 12 + Math.random() * 24,
        ],
        scale: [.018, .42 + index % 4 * .08, .018],
        rotation: [0, 0, 10],
        castShadows: false,
      })
      return { entity, speed: 13 + index % 7 }
    })
  }

  resize() {
    if (!this.app) return
    const parent = this.canvas.parentElement
    if (!parent) return
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.app.resizeCanvas(parent.clientWidth, parent.clientHeight)
    this.app.updateCanvasSize()
    this.syncCamera()
  }

  syncCamera() {
    if (!this.camera) return
    const distance = this.cameraDistance / this.zoom
    this.camera.setPosition(
      this.cameraTarget.x + distance * .74,
      this.cameraTarget.y + distance * .77,
      this.cameraTarget.z + distance * .74,
    )
    this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y, this.cameraTarget.z)
  }

  clampCamera() {
    this.cameraTarget.x = clamp(this.cameraTarget.x, -VALLEY.cameraWidth / 2, VALLEY.cameraWidth / 2)
    this.cameraTarget.z = clamp(this.cameraTarget.z, -VALLEY.cameraDepth / 2, VALLEY.cameraDepth / 2)
  }

  setZoom(value) {
    this.zoom = clamp(value, .58, 1.4)
    this.syncCamera()
  }

  focusPercent(x, y) {
    this.cameraTween = {
      elapsed: 0,
      duration: .65,
      fromX: this.cameraTarget.x,
      fromZ: this.cameraTarget.z,
      toX: (x / 100 - .5) * VALLEY.cameraWidth * .82,
      toZ: (y / 100 - .5) * WORLD.depth,
    }
  }

  focusWorld(x, z) {
    this.cameraTween = {
      elapsed: 0,
      duration: .75,
      fromX: this.cameraTarget.x,
      fromZ: this.cameraTarget.z,
      toX: clamp(x, -VALLEY.cameraWidth / 2, VALLEY.cameraWidth / 2),
      toZ: clamp(z, -VALLEY.cameraDepth / 2, VALLEY.cameraDepth / 2),
    }
  }

  armInput() {
    this.canvas.addEventListener('pointerdown', event => {
      this.canvas.setPointerCapture(event.pointerId)
      this.drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        targetX: this.cameraTarget.x,
        targetZ: this.cameraTarget.z,
      }
      this.dragDistance = 0
    })
    this.canvas.addEventListener('pointermove', event => {
      if (!this.drag || this.drag.id !== event.pointerId) return
      const dx = event.clientX - this.drag.x
      const dy = event.clientY - this.drag.y
      this.dragDistance = Math.max(this.dragDistance, Math.hypot(dx, dy))
      const scale = .045 / this.zoom
      this.cameraTarget.x = this.drag.targetX - dx * scale + dy * scale * .42
      this.cameraTarget.z = this.drag.targetZ + dx * scale * .42 - dy * scale
      this.clampCamera()
      this.syncCamera()
    })
    const finish = event => {
      if (!this.drag || this.drag.id !== event.pointerId) return
      if (this.dragDistance < 8) this.pickResident(event)
      this.drag = null
      if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId)
    }
    this.canvas.addEventListener('pointerup', finish)
    this.canvas.addEventListener('pointercancel', finish)
    this.canvas.addEventListener('wheel', event => {
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) this.setZoom(this.zoom - event.deltaY * .001)
      else {
        this.cameraTarget.x += event.deltaX * .02 / this.zoom
        this.cameraTarget.z -= event.deltaY * .025 / this.zoom
        this.clampCamera()
        this.syncCamera()
      }
    }, { passive: false })
  }

  pickResident(event) {
    if (!this.ready) return
    const rect = this.canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const cluster = this.labelClusters.find(entry => Math.hypot(entry.screenX - screenX, entry.screenY - screenY) < 58)
    if (cluster) {
      this.expandedLabelIds = new Set(cluster.ids)
      this.expandedLabelsUntil = this.elapsed + 6
      this.options.onLabelClusterSelect?.(cluster.ids.map(id => this.actors.get(id)?.resident).filter(Boolean))
      this.updateNameplates()
      return
    }
    let match = null
    let closest = 88
    this.actors.forEach(actor => {
      const source = actor.state === 'crop' ? actor.root : actor.physicsRoot
      if (!source?.enabled) return
      const screen = this.camera.camera.worldToScreen(source.getPosition())
      const distance = Math.hypot(screen.x - screenX, screen.y - screenY)
      if (distance < closest) {
        closest = distance
        match = actor.resident.id
      }
    })
    if (match) this.options.onResidentSelect?.(match)
  }

  chooseTarget(actor) {
    const { pen, station } = actor.resident
    const marginPixels = actor.resident.kind === 'elephant' ? 44 : 30
    const useStation = Math.random() < .34
    const px = useStation
      ? station.x
      : pen.x + marginPixels + Math.random() * Math.max(1, pen.width - marginPixels * 2)
    const py = useStation
      ? station.y
      : pen.y + marginPixels + Math.random() * Math.max(1, pen.height - marginPixels * 2)
    actor.target = new pc.Vec3(residentX(actor.resident, px), 0, residentZ(actor.resident, py))
    actor.afterArrival = useStation ? 'environment' : null
    actor.state = 'moving'
  }

  arrive(actor) {
    actor.state = 'idle'
    actor.target = null
    actor.nextDecision = .8 + Math.random() * 1.8
    if (actor.afterArrival) {
      const mode = actor.afterArrival
      actor.afterArrival = null
      this.beginInteraction(actor, mode)
    }
  }

  beginInteraction(actor, mode) {
    actor.state = 'performing'
    actor.manual = {
      type: mode,
      elapsed: 0,
      duration: mode === 'sell' ? .9 : 1.35,
      impulseApplied: false,
    }
    const station = actor.resident.playcanvasStation
    const prop = station?.props?.find(entity => entity.rigidbody?.type === pc.BODYTYPE_DYNAMIC)
    if (prop?.rigidbody) {
      const dx = prop.getPosition().x - actor.physicsRoot.getPosition().x
      const dz = prop.getPosition().z - actor.physicsRoot.getPosition().z
      const length = Math.max(.01, Math.hypot(dx, dz))
      prop.rigidbody.applyImpulse(dx / length * 1.6, 1.15, dz / length * 1.6)
    }
    this.emitMotifs(actor.physicsRoot.getPosition(), mode)
  }

  sendResidentToStation(id, mode) {
    const actor = this.actors.get(id)
    if (!actor) return
    if (actor.state === 'crop') {
      actor.pulse = 1.2
      return
    }
    actor.target = new pc.Vec3(
      actor.resident.playcanvasStation.x,
      0,
      actor.resident.playcanvasStation.z,
    )
    actor.afterArrival = mode
    actor.state = 'moving'
    actor.manual = null
    actor.physicsRoot.rigidbody?.activate()
  }

  performTrick(id, trick) {
    const actor = this.actors.get(id)
    if (!actor || actor.state === 'crop') return
    actor.state = 'performing'
    actor.manual = { type: trick, elapsed: 0, duration: trick === 'spin' ? .85 : .75, impulseApplied: false }
    if (trick === 'jump') {
      actor.physicsRoot.rigidbody.applyImpulse(0, actor.rig.mass * 2.75, 0)
      actor.manual.impulseApplied = true
    }
    this.emitMotifs(actor.physicsRoot.getPosition(), trick)
  }

  emitMotifs(position, mode) {
    const motifMaterial = this.createMaterial(
      `motif-${mode}-${this.elapsed}`,
      mode === 'sell' ? '#db674d' : mode === 'jump' || mode === 'spin' ? '#a779e6' : '#f2cf58',
      { gloss: .72, emissive: mode === 'sell' ? '#42150c' : '#403107' },
    )
    for (let index = 0; index < 8; index += 1) {
      const entity = this.addPrimitive(this.app.root, `motif-${mode}-${index}`, index % 2 ? 'sphere' : 'cone', motifMaterial, {
        position: [position.x, position.y + 1, position.z],
        scale: [.12, .12, .12],
        castShadows: false,
      })
      this.effects.push({
        entity,
        elapsed: -index * .045,
        duration: .9 + index * .04,
        start: position.clone(),
        dx: (Math.random() - .5) * 2.2,
        dz: (Math.random() - .5) * 2.2,
      })
    }
  }

  updateInvestment(id) {
    const actor = this.actors.get(id)
    if (!actor) return
    const value = this.options.getPosition(id)
    const allocation = this.options.getAllocation(id)
    if (actor.state === 'crop') {
      actor.scale = clamp(.68 + allocation / 30, .68, 1.38)
      actor.root.enabled = value > 0
      return
    }
    actor.renderScale = clamp(.78 + allocation / 34, .76, 1.34)
    actor.heading.setLocalScale(actor.renderScale, actor.renderScale, actor.renderScale)
    actor.label.enabled = value > 0
    actor.rig.root.enabled = value > 0
    actor.physicsRoot.collision.enabled = value > 0
    actor.physicsRoot.rigidbody.enabled = value > 0
  }

  applyCosmetic(id) {
    const actor = this.actors.get(id)
    if (!actor || actor.state === 'crop') return
    const cosmetics = this.options.getCosmetic(id)
    const tint = cosmetics.skin === 'raincoat'
      ? new pc.Color(1, .83, .55)
      : cosmetics.skin === 'aurora'
        ? new pc.Color(.82, .65, 1)
        : new pc.Color(1, 1, 1)
    actor.rig.materials.coat.diffuse.set(
      actor.rig.baseCoat.r * tint.r,
      actor.rig.baseCoat.g * tint.g,
      actor.rig.baseCoat.b * tint.b,
    )
    actor.rig.materials.coat.update()
    setAnimalAccessory(actor.rig, cosmetics.skin, this.createMaterial)
  }

  setWeather(factors) {
    this.weather = deriveWeather(factors)
    if (!this.app) return
    const stress = this.weather.stress
    const warmth = this.weather.warmth / 100
    this.app.scene.ambientLight.set(
      .17 + this.weather.brightness * .11,
      .19 + this.weather.brightness * .12,
      .17 + this.weather.brightness * .09,
    )
    this.baseSunIntensity = clamp(.76 + this.weather.brightness * .62, .9, 1.42)
    this.baseExposure = clamp(.9 + this.weather.brightness * .11, .96, 1.02)
    if (!this.weather.lightning) {
      this.lightning = 0
      this.nextLightning = 4
    }
    this.applyClimateLighting()
    this.keyLight.light.color.set(1, .84 + warmth * .08, .68 + warmth * .16)
    this.fillLight.light.intensity = .22 + (100 - stress) / 300
    this.camera.camera.clearColor.set(
      .31 + this.weather.brightness * .28,
      .48 + this.weather.brightness * .28,
      .55 + this.weather.brightness * .3,
    )
    this.rain?.forEach(drop => { drop.entity.enabled = this.weather.rain })
    this.cloudMaterial.opacity = clamp(.22 + stress / 145, .22, .78)
    this.cloudMaterial.update()
  }

  applyClimateLighting() {
    const flashProgress = this.weather.lightning
      ? easeOutCubic(clamp(this.lightning / .7, 0, 1))
      : 0
    this.keyLight.light.intensity = clamp(
      this.baseSunIntensity + flashProgress * 1.15,
      .9,
      2.57,
    )
    this.app.scene.exposure = clamp(
      this.baseExposure + flashProgress * .035,
      .96,
      1.055,
    )
  }

  updateAnimal(actor, delta) {
    if (!actor.physicsRoot.rigidbody?.enabled) return
    actor.nextDecision -= delta
    actor.stationCooldown = Math.max(0, actor.stationCooldown - delta)
    const root = actor.physicsRoot
    const position = root.getPosition()
    const velocity = root.rigidbody.linearVelocity
    let desiredX = 0
    let desiredZ = 0

    if (actor.state === 'performing' && actor.manual) {
      actor.manual.elapsed += delta
      const progress = clamp(actor.manual.elapsed / actor.manual.duration, 0, 1)
      if (actor.manual.type === 'spin') {
        actor.rig.root.setLocalEulerAngles(0, progress * 720, 0)
      } else if (actor.manual.type === 'jump' && !actor.manual.impulseApplied) {
        root.rigidbody.applyImpulse(0, actor.rig.mass * 2.75, 0)
        actor.manual.impulseApplied = true
      }
      if (progress >= 1) {
        actor.state = 'idle'
        actor.manual = null
        actor.nextDecision = .85
        actor.rig.root.setLocalEulerAngles(0, 0, 0)
      }
    } else if (actor.state === 'moving' && actor.target) {
      const dx = actor.target.x - position.x
      const dz = actor.target.z - position.z
      const distance = Math.hypot(dx, dz)
      if (distance < .62) {
        this.arrive(actor)
      } else {
        const speed = (actor.resident.kind === 'tortoise' ? .85 : actor.resident.kind === 'elephant' ? 1.2 : 1.7) * this.weather.animalPace
        desiredX = dx / distance * speed
        desiredZ = dz / distance * speed
        actor.motionSpeed = speed
        actor.yaw = Math.atan2(-dx, -dz) * 180 / Math.PI
        actor.heading.setLocalEulerAngles(0, actor.yaw, 0)
      }
    } else {
      actor.motionSpeed = lerp(actor.motionSpeed, 0, delta * 4)
      if (actor.nextDecision <= 0 && this.options.getPosition(actor.resident.id) > 0) this.chooseTarget(actor)
    }

    const control = actor.state === 'moving' ? .22 : .1
    const nextX = lerp(velocity.x, desiredX, control)
    const nextZ = lerp(velocity.z, desiredZ, control)
    root.rigidbody.linearVelocity = new pc.Vec3(nextX, velocity.y, nextZ)

    if (actor.rig.hoverHeight) {
      const hoverTarget = actor.rig.hoverHeight + Math.sin(this.elapsed * 1.8 + actor.phase) * .35
      const lift = (hoverTarget - position.y) * actor.rig.mass * 16 - velocity.y * actor.rig.mass * 5.2
      root.rigidbody.applyForce(0, lift, 0)
    }

    animateAnimalRig(actor, this.elapsed, delta)
    actor.label.setLocalEulerAngles(90, 45, 0)

    if (position.y < -3) {
      const homeY = actor.rig.hoverHeight || actor.rig.bodyHeight * .58 + .15
      root.rigidbody.teleport(residentX(actor.resident, actor.resident.anchor.x), homeY, residentZ(actor.resident, actor.resident.anchor.y))
      root.rigidbody.linearVelocity = pc.Vec3.ZERO
    }
  }

  updateCrop(actor, delta) {
    actor.pulse = Math.max(0, actor.pulse - delta)
    actor.plants.forEach((plant, index) => {
      const pulse = actor.pulse > 0 ? 1 + Math.sin((1.2 - actor.pulse) * 13 + index) * .15 : 1
      const scale = actor.scale * pulse
      plant.entity.setLocalScale(scale, scale, scale)
      plant.entity.setLocalEulerAngles(
        Math.sin(this.elapsed * 1.5 + plant.phase) * (3 + this.weather.wind / 20),
        0,
        Math.cos(this.elapsed * 1.2 + plant.phase) * 4,
      )
    })
  }

  updateStations(delta) {
    farmResidents.forEach(resident => {
      const station = resident.playcanvasStation
      if (!station) return
      const pulse = 1 + Math.sin(this.elapsed * 2.1 + station.phase) * .1
      station.halo.setLocalScale(1.25 * pulse, .035, 1.25 * pulse)
      if (resident.kind === 'owl') {
        station.props?.forEach((prop, index) => {
          if (prop.name.includes('cloud-orb')) prop.rotate(0, delta * (22 + index * 3), 0)
        })
      }
    })
  }

  updateWeather(delta) {
    this.clouds.forEach(cloud => {
      cloud.entity.translate(cloud.speed * delta * (.55 + this.weather.wind / 100), 0, 0)
      if (cloud.entity.getPosition().x > VALLEY.cameraWidth / 2 + 22) {
        const position = cloud.entity.getPosition()
        cloud.entity.setPosition(-VALLEY.cameraWidth / 2 - 22, position.y, position.z)
      }
    })
    this.rain.forEach(drop => {
      if (!drop.entity.enabled) return
      drop.entity.translate(this.weather.wind * delta * .025, -drop.speed * delta, 0)
      const position = drop.entity.getPosition()
      if (position.y < .3) {
        drop.entity.setPosition(
          this.cameraTarget.x - 18 + Math.random() * 36,
          12 + Math.random() * 8,
          this.cameraTarget.z - 12 + Math.random() * 24,
        )
      }
    })
    if (this.weather.lightning) {
      this.nextLightning -= delta
      if (this.nextLightning <= 0) {
        this.nextLightning = 3.5 + Math.random() * 4.5
        this.lightning = .7
      }
      this.lightning = Math.max(0, this.lightning - delta * 2.8)
    } else {
      this.lightning = 0
    }
    this.applyClimateLighting()
  }

  updateEffects(delta) {
    this.effects = this.effects.filter(effect => {
      effect.elapsed += delta
      if (effect.elapsed < 0) return true
      const progress = effect.elapsed / effect.duration
      if (progress >= 1) {
        effect.entity.destroy()
        return false
      }
      const rise = easeOutCubic(progress)
      effect.entity.setPosition(
        effect.start.x + effect.dx * rise,
        effect.start.y + 1 + rise * 2.6,
        effect.start.z + effect.dz * rise,
      )
      const scale = .1 + Math.sin(progress * Math.PI) * .18
      effect.entity.setLocalScale(scale, scale, scale)
      effect.entity.rotate(35 * delta, 55 * delta, 18 * delta)
      return true
    })
  }

  updateCameraTween(delta) {
    if (!this.cameraTween) return
    this.cameraTween.elapsed += delta
    const amount = easeOutCubic(clamp(this.cameraTween.elapsed / this.cameraTween.duration, 0, 1))
    this.cameraTarget.x = lerp(this.cameraTween.fromX, this.cameraTween.toX, amount)
    this.cameraTarget.z = lerp(this.cameraTween.fromZ, this.cameraTween.toZ, amount)
    this.clampCamera()
    this.syncCamera()
    if (amount >= 1) this.cameraTween = null
  }

  update(delta) {
    if (!this.ready) return
    this.elapsed += delta
    this.actors.forEach(actor => {
      if (actor.state === 'crop') this.updateCrop(actor, delta)
      else this.updateAnimal(actor, delta)
    })
    this.updateNameplates()
    this.updateStations(delta)
    this.updateWeather(delta)
    this.updateEffects(delta)
    this.updateCameraTween(delta)
  }

  destroy() {
    this.resizeObserver?.disconnect()
    this.app?.destroy()
  }
}
