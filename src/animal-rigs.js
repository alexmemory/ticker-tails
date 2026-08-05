const pc = window.pc

const v3 = (x = 0, y = 0, z = 0) => new pc.Vec3(x, y, z)
const highDensityMeshCache = new WeakMap()
const surfaceTextureCache = new WeakMap()

function highDensityMesh(type, graphicsDevice) {
  let meshes = highDensityMeshCache.get(graphicsDevice)
  if (!meshes) {
    meshes = new Map()
    highDensityMeshCache.set(graphicsDevice, meshes)
  }
  if (meshes.has(type)) return meshes.get(type)

  const mesh = type === 'sphere'
    ? pc.createSphere(graphicsDevice, { latitudeBands: 40, longitudeBands: 40 })
    : type === 'capsule'
      ? pc.createCapsule(graphicsDevice, { sides: 48, heightSegments: 3 })
      : type === 'cylinder'
        ? pc.createCylinder(graphicsDevice, { capSegments: 48, heightSegments: 12 })
        : type === 'cone'
          ? pc.createCone(graphicsDevice, { capSegments: 44, heightSegments: 12 })
          : null
  if (mesh) meshes.set(type, mesh)
  return mesh
}

function createSurfaceCanvas(kind) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 256, 256)
  let seed = [...kind].reduce((sum, letter) => sum + letter.charCodeAt(0), 1947)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (['owl', 'hawk', 'peacock', 'flamingo'].includes(kind)) {
    for (let row = -1; row < 10; row += 1) {
      for (let column = -1; column < 10; column += 1) {
        const x = column * 30 + (row % 2 ? 15 : 0)
        const y = row * 28
        context.strokeStyle = row % 2 ? 'rgba(31,55,73,.28)' : 'rgba(255,255,255,.54)'
        context.lineWidth = 5
        context.beginPath()
        context.arc(x, y, 20, .15, Math.PI - .15)
        context.stroke()
        context.strokeStyle = 'rgba(21,46,65,.14)'
        context.lineWidth = 2
        context.beginPath()
        context.moveTo(x, y + 4)
        context.lineTo(x, y + 22)
        context.stroke()
      }
    }
  } else if (kind === 'dragon') {
    for (let row = -1; row < 12; row += 1) {
      for (let column = -1; column < 12; column += 1) {
        const x = column * 24 + (row % 2 ? 12 : 0)
        const y = row * 22
        context.fillStyle = row % 3 ? 'rgba(12,79,53,.18)' : 'rgba(200,255,167,.3)'
        context.beginPath()
        context.moveTo(x, y - 10)
        context.lineTo(x + 11, y)
        context.lineTo(x, y + 10)
        context.lineTo(x - 11, y)
        context.closePath()
        context.fill()
        context.strokeStyle = 'rgba(7,63,44,.18)'
        context.lineWidth = 2
        context.stroke()
      }
    }
  } else if (kind === 'tortoise') {
    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = 16 + column * 34 + (row % 2 ? 17 : 0)
        const y = 16 + row * 31
        context.fillStyle = 'rgba(38,82,53,.19)'
        context.strokeStyle = 'rgba(22,55,37,.34)'
        context.lineWidth = 4
        context.beginPath()
        for (let point = 0; point < 6; point += 1) {
          const angle = point / 6 * Math.PI * 2
          const px = x + Math.cos(angle) * 14
          const py = y + Math.sin(angle) * 14
          if (!point) context.moveTo(px, py)
          else context.lineTo(px, py)
        }
        context.closePath()
        context.fill()
        context.stroke()
      }
    }
  } else if (kind === 'elephant') {
    for (let index = 0; index < 52; index += 1) {
      const y = random() * 256
      const x = random() * 256
      context.strokeStyle = `rgba(32,61,90,${.08 + random() * .14})`
      context.lineWidth = 1 + random() * 2
      context.beginPath()
      context.moveTo(x - 12, y + (random() - .5) * 8)
      context.bezierCurveTo(x - 4, y - 5, x + 5, y + 5, x + 14, y + (random() - .5) * 7)
      context.stroke()
    }
  } else {
    for (let index = 0; index < 110; index += 1) {
      const x = random() * 256
      const y = random() * 256
      if (['cat', 'dog', 'fox'].includes(kind) && index < 22) {
        context.strokeStyle = 'rgba(26,38,43,.22)'
        context.lineWidth = 5 + random() * 8
        context.beginPath()
        context.moveTo(x - 18, y - 6)
        context.quadraticCurveTo(x, y + 9, x + 18, y - 5)
        context.stroke()
      } else {
        const alpha = kind === 'pig' ? .12 : .08 + random() * .12
        context.fillStyle = `rgba(48,39,35,${alpha})`
        context.beginPath()
        context.ellipse(x, y, 1.5 + random() * 4, .7 + random() * 2, random() * Math.PI, 0, Math.PI * 2)
        context.fill()
      }
    }
  }
  return canvas
}

function surfaceTexture(kind) {
  const app = pc.Application.getApplication()
  if (!app) return null
  let textures = surfaceTextureCache.get(app.graphicsDevice)
  if (!textures) {
    textures = new Map()
    surfaceTextureCache.set(app.graphicsDevice, textures)
  }
  if (textures.has(kind)) return textures.get(kind)
  const canvas = createSurfaceCanvas(kind)
  const texture = new pc.Texture(app.graphicsDevice, {
    width: canvas.width,
    height: canvas.height,
    format: pc.PIXELFORMAT_RGBA8,
    mipmaps: true,
    minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
    magFilter: pc.FILTER_LINEAR,
    addressU: pc.ADDRESS_REPEAT,
    addressV: pc.ADDRESS_REPEAT,
  })
  texture.name = `${kind}-illustrated-surface-map`
  texture.anisotropy = 8
  texture.setSource(canvas)
  textures.set(kind, texture)
  return texture
}

function applySurfaceMaps(rig, resident) {
  const texture = surfaceTexture(resident.kind)
  if (!texture) return
  for (const material of [rig.materials.coat, rig.materials.coatDark, rig.materials.coatLight]) {
    material.diffuseMap = texture
    material.diffuseMapTiling.set(
      resident.kind === 'dragon' || resident.kind === 'tortoise' ? 2.4 : 1.65,
      resident.kind === 'elephant' ? 1.2 : 1.75,
    )
    material.update()
  }
  rig.surfaceTexture = texture
}

function addPart(parent, name, type, material, {
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  castShadows = true,
} = {}) {
  const entity = new pc.Entity(name)
  const app = pc.Application.getApplication()
  const mesh = app ? highDensityMesh(type, app.graphicsDevice) : null
  if (mesh) {
    entity.addComponent('render')
    entity.render.meshInstances = [new pc.MeshInstance(mesh, material)]
  } else {
    entity.addComponent('render', { type })
  }
  entity.render.meshInstances.forEach(instance => {
    instance.material = material
    instance.castShadow = castShadows
    instance.receiveShadow = true
  })
  entity.setLocalPosition(...position)
  entity.setLocalScale(...scale)
  entity.setLocalEulerAngles(...rotation)
  entity.charmRestPosition = [...position]
  entity.charmRestScale = [...scale]
  entity.charmRestRotation = [...rotation]
  parent.addChild(entity)
  return entity
}

function eyes(parent, materials, left, right, size = .14, {
  pupilScale = [.56, .64, .42],
  brow = true,
} = {}) {
  const result = []
  for (const [index, position] of [left, right].entries()) {
    const white = addPart(parent, `eye-white-${index}`, 'sphere', materials.eyeWhite, {
      position,
      scale: [size * 1.32, size * 1.5, size * .68],
      castShadows: false,
    })
    const pupil = addPart(white, `eye-pupil-${index}`, 'sphere', materials.eye, {
      position: [0, -.02, -.64],
      scale: pupilScale,
      castShadows: false,
    })
    addPart(pupil, `eye-glint-${index}`, 'sphere', materials.eyeWhite, {
      position: [-.2, .24, -.72],
      scale: [.2, .2, .13],
      castShadows: false,
    })
    if (brow) {
      addPart(parent, `friendly-brow-${index}`, 'capsule', materials.coatDark, {
        position: [position[0], position[1] + size * 1.42, position[2] - size * .34],
        scale: [size * .22, size * .72, size * .18],
        rotation: [0, 0, index ? -77 : 77],
        castShadows: false,
      })
    }
    result.push({ white, pupil })
  }
  return result
}

function smile(parent, materials, {
  y = -.22,
  z = -.58,
  width = .15,
  cheeks = true,
} = {}) {
  addPart(parent, 'happy-open-mouth', 'sphere', materials.eye, {
    position: [0, y - .018, z - .018],
    scale: [width * .72, width * .42, .035],
    castShadows: false,
  })
  addPart(parent, 'happy-smile-shine', 'sphere', materials.eyeWhite, {
    position: [0, y + .028, z - .052],
    scale: [width * .48, width * .12, .016],
    castShadows: false,
  })
  addPart(parent, 'happy-tongue', 'sphere', materials.blush, {
    position: [0, y - .068, z - .05],
    scale: [width * .3, width * .13, .018],
    castShadows: false,
  })
  for (const [index, side] of [-1, 1].entries()) {
    addPart(parent, `smile-${index}`, 'capsule', materials.eye, {
      position: [side * width * .48, y, z],
      scale: [.025, width * .48, .025],
      rotation: [0, 0, side * 38],
      castShadows: false,
    })
  }
  if (cheeks) {
    for (const [index, side] of [-1, 1].entries()) {
      addPart(parent, `cheek-${index}`, 'sphere', materials.blush, {
        position: [side * width * 1.9, y + .05, z + .035],
        scale: [width * .44, width * .26, .025],
        castShadows: false,
      })
    }
  }
}

function fourLegs(parent, material, {
  x = .42,
  z = .52,
  y = -.52,
  length = .72,
  width = .2,
  hoofMaterial = null,
  pawMaterial = null,
} = {}) {
  const legs = []
  for (const [index, position] of [
    [-x, y, -z],
    [x, y, -z],
    [-x, y, z],
    [x, y, z],
  ].entries()) {
    const pivot = new pc.Entity(`leg-pivot-${index}`)
    pivot.setLocalPosition(position[0], position[1] + length * .42, position[2])
    pivot.charmRestRotation = [0, 0, 0]
    parent.addChild(pivot)
    addPart(pivot, `shoulder-${index}`, 'sphere', material, {
      position: [0, -.05, 0],
      scale: [width * 1.2, width * 1.35, width * 1.2],
    })
    addPart(pivot, `leg-${index}`, 'capsule', material, {
      position: [0, -length * .4, 0],
      scale: [width, length * .5, width],
    })
    const footMaterial = hoofMaterial || pawMaterial || material
    const foot = addPart(pivot, `${hoofMaterial ? 'hoof' : 'paw'}-${index}`, 'sphere', footMaterial, {
      position: [0, -length * .82, -.07],
      scale: [width * 1.28, width * .66, width * 1.48],
    })
    if (!hoofMaterial) {
      for (const [toeIndex, toeX] of [-.08, .08].entries()) {
        addPart(foot, `toe-${index}-${toeIndex}`, 'sphere', material, {
          position: [toeX / Math.max(width, .01), -.28, -.7],
          scale: [.18, .12, .12],
          castShadows: false,
        })
      }
    }
    legs.push(pivot)
  }
  return legs
}

function tailChain(parent, material, points, radius = .15) {
  const tail = []
  let current = parent
  points.forEach((point, index) => {
    const pivot = new pc.Entity(`tail-pivot-${index}`)
    pivot.setLocalPosition(...point)
    current.addChild(pivot)
    addPart(pivot, `tail-${index}`, 'sphere', material, {
      position: [0, 0, -.18],
      scale: [radius, radius, radius * 1.8],
    })
    tail.push(pivot)
    current = pivot
  })
  return tail
}

function baseRig(resident, createMaterial, palette) {
  const root = new pc.Entity(`${resident.ticker}-articulated-rig`)
  const materials = {
    coat: createMaterial(`${resident.id}-coat`, palette.coat, { gloss: palette.gloss ?? .35 }),
    coatDark: createMaterial(`${resident.id}-coat-dark`, palette.dark, { gloss: .25 }),
    coatLight: createMaterial(`${resident.id}-coat-light`, palette.light, { gloss: .3 }),
    accent: createMaterial(`${resident.id}-accent`, resident.accent, {
      gloss: .62,
      emissive: resident.kind === 'dragon' ? '#073e25' : '#000000',
    }),
    eye: createMaterial(`${resident.id}-eyes`, '#111715', { gloss: .9 }),
    eyeWhite: createMaterial(`${resident.id}-eye-white`, '#fffdf4', { gloss: .72 }),
    blush: createMaterial(`${resident.id}-blush`, '#ff7999', { gloss: .36, emissive: '#25030b' }),
    metal: createMaterial(`${resident.id}-metal`, '#84d8dc', { gloss: .86, metalness: .68 }),
  }
  return {
    root,
    materials,
    baseCoat: materials.coat.diffuse.clone(),
    joints: { legs: [], wings: [], tail: [], ears: [], head: null, trunk: [], eyes: [] },
    accessory: null,
    accessoryAnchor: root,
    bodyHeight: 1.55,
    radius: .54,
    mass: 12,
    hoverHeight: null,
  }
}

function buildPig(resident, createMaterial) {
  const rig = baseRig(resident, createMaterial, {
    coat: '#f58b8d',
    dark: '#c84862',
    light: '#ffc2ae',
    gloss: .44,
  })
  const body = addPart(rig.root, 'pig-body', 'sphere', rig.materials.coat, {
    position: [0, .03, .08],
    scale: [.82, .68, .91],
  })
  const head = addPart(rig.root, 'pig-head', 'sphere', rig.materials.coatLight, {
    position: [0, .39, -.72],
    scale: [.69, .64, .62],
  })
  rig.joints.head = head
  addPart(head, 'pig-snout', 'cylinder', rig.materials.coatDark, {
    position: [0, -.12, -.52],
    scale: [.3, .21, .3],
    rotation: [90, 0, 0],
  })
  addPart(head, 'snout-highlight', 'sphere', rig.materials.coatLight, {
    position: [0, -.12, -.72],
    scale: [.28, .19, .11],
  })
  for (const x of [-.11, .11]) {
    addPart(head, `nostril-${x}`, 'sphere', rig.materials.eye, {
      position: [x, -.1, -.81],
      scale: [.035, .035, .025],
      castShadows: false,
    })
  }
  rig.joints.ears = [-.34, .34].map((x, index) => addPart(head, `pig-ear-${index}`, 'cone', rig.materials.coatDark, {
    position: [x, .46, -.04],
    scale: [.23, .32, .15],
    rotation: [0, 0, index ? -24 : 24],
  }))
  rig.joints.eyes = eyes(head, rig.materials, [-.24, .15, -.49], [.24, .15, -.49], .135)
  smile(head, rig.materials, { y: -.31, z: -.64, width: .12, cheeks: false })
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .52,
    z: .58,
    y: -.43,
    length: .64,
    width: .18,
    hoofMaterial: rig.materials.eye,
  })
  rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, .1, .9], [0, .08, .18], [0, .05, .12]], .1)
  rig.accessoryAnchor = head
  rig.bodyHeight = 1.45
  rig.radius = .58
  rig.mass = 28
  return rig
}

function buildCat(resident, createMaterial) {
  const rig = baseRig(resident, createMaterial, {
    coat: '#344a7a',
    dark: '#172441',
    light: '#8ddbe1',
    gloss: .55,
  })
  const body = addPart(rig.root, 'cat-body', 'capsule', rig.materials.coat, {
    position: [0, .08, .12],
    scale: [.56, .7, .56],
    rotation: [90, 0, 0],
  })
  const chest = addPart(body, 'cat-chest', 'sphere', rig.materials.coatLight, {
    position: [0, -.12, -.46],
    scale: [.68, .78, .34],
  })
  const head = addPart(rig.root, 'cat-head', 'sphere', rig.materials.coat, {
    position: [0, .5, -.63],
    scale: [.62, .58, .55],
  })
  rig.joints.head = head
  rig.joints.ears = [-.29, .29].map((x, index) => addPart(head, `cat-ear-${index}`, 'cone', rig.materials.coatDark, {
    position: [x * 1.12, .46, -.01],
    scale: [.22, .38, .19],
    rotation: [0, 0, index ? -9 : 9],
  }))
  rig.joints.eyes = eyes(head, rig.materials, [-.22, .12, -.45], [.22, .12, -.45], .14, {
    pupilScale: [.45, .72, .38],
  })
  for (const side of [-1, 1]) {
    addPart(head, `cat-muzzle-${side}`, 'sphere', rig.materials.coatLight, {
      position: [side * .12, -.14, -.47],
      scale: [.2, .18, .16],
    })
  }
  addPart(head, 'cat-nose', 'sphere', rig.materials.accent, {
    position: [0, -.08, -.62],
    scale: [.09, .065, .055],
  })
  smile(head, rig.materials, { y: -.23, z: -.61, width: .12 })
  for (const [sideIndex, side] of [-1, 1].entries()) {
    for (let whisker = 0; whisker < 3; whisker += 1) {
      addPart(head, `cat-whisker-${sideIndex}-${whisker}`, 'cylinder', rig.materials.eyeWhite, {
        position: [side * (.37 + whisker * .015), -.15 - whisker * .055, -.53],
        scale: [.012, .33, .012],
        rotation: [0, 0, side * (68 + whisker * 7)],
        castShadows: false,
      })
    }
  }
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .38,
    z: .4,
    y: -.45,
    length: .78,
    width: .16,
    pawMaterial: rig.materials.coatLight,
  })
  rig.joints.tail = tailChain(body, rig.materials.coat, [[0, .18, .76], [0, .15, .24], [0, .12, .22], [0, .08, .2]], .12)
  rig.accessoryAnchor = chest
  rig.bodyHeight = 1.55
  rig.radius = .48
  rig.mass = 7
  return rig
}

function buildOwl(resident, createMaterial) {
  const rig = baseRig(resident, createMaterial, {
    coat: '#3d9fc7',
    dark: '#3152a0',
    light: '#c2f1e8',
    gloss: .28,
  })
  const body = addPart(rig.root, 'owl-body', 'sphere', rig.materials.coat, {
    position: [0, .1, .04],
    scale: [.67, .82, .62],
  })
  const head = addPart(rig.root, 'owl-head', 'sphere', rig.materials.coatLight, {
    position: [0, .73, -.2],
    scale: [.76, .67, .62],
  })
  rig.joints.head = head
  const faceLeft = addPart(head, 'owl-face-left', 'sphere', rig.materials.eyeWhite, {
    position: [-.24, .03, -.46],
    scale: [.37, .4, .17],
  })
  const faceRight = addPart(head, 'owl-face-right', 'sphere', rig.materials.eyeWhite, {
    position: [.24, .03, -.46],
    scale: [.37, .4, .17],
  })
  const owlEyeLeft = addPart(faceLeft, 'owl-eye-left', 'sphere', rig.materials.eye, {
    position: [0, .01, -.72],
    scale: [.36, .4, .22],
    castShadows: false,
  })
  const owlEyeRight = addPart(faceRight, 'owl-eye-right', 'sphere', rig.materials.eye, {
    position: [0, .01, -.72],
    scale: [.36, .4, .22],
    castShadows: false,
  })
  ;[owlEyeLeft, owlEyeRight].forEach((eye, index) => {
    addPart(eye, `owl-eye-glint-${index}`, 'sphere', rig.materials.eyeWhite, {
      position: [-.18, .22, -.72],
      scale: [.2, .2, .12],
      castShadows: false,
    })
  })
  rig.joints.eyes = [{ white: faceLeft, pupil: owlEyeLeft }, { white: faceRight, pupil: owlEyeRight }]
  addPart(head, 'owl-beak', 'cone', rig.materials.accent, {
    position: [0, -.24, -.61],
    scale: [.13, .27, .13],
    rotation: [90, 0, 0],
  })
  for (const [index, side] of [-1, 1].entries()) {
    addPart(head, `owl-brow-${index}`, 'capsule', rig.materials.coatDark, {
      position: [side * .24, .31, -.53],
      scale: [.045, .27, .04],
      rotation: [0, 0, side * 70],
      castShadows: false,
    })
  }
  rig.joints.wings = [-1, 1].map((side, index) => {
    const pivot = new pc.Entity(`owl-wing-pivot-${index}`)
    pivot.setLocalPosition(side * .5, .27, 0)
    body.addChild(pivot)
    addPart(pivot, `owl-wing-${index}`, 'sphere', rig.materials.coatDark, {
      position: [side * .34, -.18, .04],
      scale: [.55, .14, .73],
      rotation: [0, 0, side * 16],
    })
    return pivot
  })
  rig.joints.legs = [-.2, .2].map((x, index) => {
    const pivot = new pc.Entity(`owl-leg-pivot-${index}`)
    pivot.setLocalPosition(x, -.58, -.08)
    pivot.charmRestRotation = [0, 0, 0]
    body.addChild(pivot)
    addPart(pivot, `owl-leg-${index}`, 'capsule', rig.materials.accent, {
      position: [0, -.2, 0],
      scale: [.09, .28, .09],
    })
    addPart(pivot, `owl-claw-${index}`, 'sphere', rig.materials.accent, {
      position: [0, -.44, -.09],
      scale: [.19, .09, .27],
    })
    return pivot
  })
  rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, -.25, .48], [0, 0, .18]], .16)
  rig.accessoryAnchor = head
  rig.bodyHeight = 1.55
  rig.radius = .47
  rig.mass = 4
  rig.hoverHeight = 3.4
  return rig
}

function buildDragon(resident, createMaterial) {
  const rig = baseRig(resident, createMaterial, {
    coat: '#12b968',
    dark: '#08714d',
    light: '#8bef70',
    gloss: .52,
  })
  const body = addPart(rig.root, 'dragon-body', 'capsule', rig.materials.coat, {
    position: [0, .08, .15],
    scale: [.7, .8, .7],
    rotation: [90, 0, 0],
  })
  addPart(body, 'dragon-belly', 'sphere', rig.materials.coatLight, {
    position: [0, -.1, -.4],
    scale: [.62, .68, .27],
  })
  const neck = addPart(rig.root, 'dragon-neck', 'capsule', rig.materials.coat, {
    position: [0, .43, -.5],
    scale: [.35, .48, .35],
    rotation: [26, 0, 0],
  })
  const head = addPart(neck, 'dragon-head', 'sphere', rig.materials.coat, {
    position: [0, .61, -.18],
    scale: [.68, .57, .67],
  })
  rig.joints.head = head
  addPart(head, 'dragon-muzzle', 'sphere', rig.materials.coatLight, {
    position: [0, -.14, -.53],
    scale: [.43, .3, .36],
  })
  rig.joints.eyes = eyes(head, rig.materials, [-.24, .12, -.5], [.24, .12, -.5], .145)
  for (const side of [-1, 1]) {
    addPart(head, `dragon-nostril-${side}`, 'sphere', rig.materials.eye, {
      position: [side * .14, -.12, -.78],
      scale: [.035, .03, .025],
      castShadows: false,
    })
  }
  smile(head, rig.materials, { y: -.28, z: -.7, width: .15 })
  rig.joints.ears = [-.27, .27].map((x, index) => addPart(head, `dragon-horn-${index}`, 'cone', rig.materials.accent, {
    position: [x * 1.14, .42, .06],
    scale: [.14, .43, .14],
    rotation: [index ? 15 : -15, 0, index ? -9 : 9],
  }))
  rig.joints.wings = [-1, 1].map((side, index) => {
    const pivot = new pc.Entity(`dragon-wing-pivot-${index}`)
    pivot.setLocalPosition(side * .49, .37, .18)
    body.addChild(pivot)
    addPart(pivot, `dragon-wing-arm-${index}`, 'capsule', rig.materials.coatDark, {
      position: [side * .38, .08, .04],
      scale: [.11, .46, .11],
      rotation: [0, 0, side * 72],
    })
    addPart(pivot, `dragon-wing-membrane-${index}`, 'sphere', rig.materials.accent, {
      position: [side * .5, -.08, .24],
      scale: [.68, .07, .55],
      rotation: [0, 0, side * 11],
      castShadows: true,
    })
    return pivot
  })
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .43,
    z: .43,
    y: -.5,
    length: .72,
    width: .2,
    pawMaterial: rig.materials.coatLight,
  })
  rig.joints.tail = tailChain(body, rig.materials.coat, [[0, .05, .8], [0, .02, .3], [0, 0, .28], [0, 0, .24]], .16)
  for (let index = 0; index < 5; index += 1) {
    addPart(body, `dragon-spine-${index}`, 'cone', rig.materials.accent, {
      position: [0, .62, -.35 + index * .23],
      scale: [.09, .2, .09],
      rotation: [0, 0, 0],
    })
  }
  rig.accessoryAnchor = neck
  rig.bodyHeight = 1.9
  rig.radius = .6
  rig.mass = 42
  return rig
}

function buildTortoise(resident, createMaterial) {
  const rig = baseRig(resident, createMaterial, {
    coat: '#79b83e',
    dark: '#245d3b',
    light: '#c3df61',
    gloss: .24,
  })
  const shell = addPart(rig.root, 'tortoise-shell', 'sphere', rig.materials.coatDark, {
    position: [0, .05, .08],
    scale: [.8, .48, .89],
  })
  for (const [index, position] of [[0, .36, 0], [-.36, .24, -.12], [.36, .24, -.12], [-.3, .2, .34], [.3, .2, .34]].entries()) {
    addPart(shell, `shell-plate-${index}`, 'sphere', rig.materials.coat, {
      position,
      scale: [.28, .08, .29],
      castShadows: false,
    })
  }
  const head = addPart(rig.root, 'tortoise-head', 'sphere', rig.materials.coatLight, {
    position: [0, .12, -.82],
    scale: [.43, .4, .47],
  })
  rig.joints.head = head
  rig.joints.eyes = eyes(head, rig.materials, [-.16, .11, -.36], [.16, .11, -.36], .1)
  smile(head, rig.materials, { y: -.13, z: -.43, width: .1 })
  rig.joints.legs = fourLegs(shell, rig.materials.coatLight, {
    x: .51,
    z: .48,
    y: -.26,
    length: .42,
    width: .23,
    pawMaterial: rig.materials.coat,
  })
  rig.joints.tail = tailChain(shell, rig.materials.coatLight, [[0, -.1, .78]], .12)
  rig.accessoryAnchor = shell
  rig.bodyHeight = 1.0
  rig.radius = .62
  rig.mass = 45
  return rig
}

function buildElephant(resident, createMaterial) {
  const rig = baseRig(resident, createMaterial, {
    coat: '#6196d8',
    dark: '#4166aa',
    light: '#a9d8ee',
    gloss: .22,
  })
  const body = addPart(rig.root, 'elephant-body', 'sphere', rig.materials.coat, {
    position: [0, .16, .15],
    scale: [1.02, .9, 1.08],
  })
  const head = addPart(rig.root, 'elephant-head', 'sphere', rig.materials.coatLight, {
    position: [0, .48, -.91],
    scale: [.86, .78, .74],
  })
  rig.joints.head = head
  rig.joints.ears = [-1, 1].map((side, index) => addPart(head, `elephant-ear-${index}`, 'sphere', rig.materials.coatDark, {
    position: [side * .67, .06, .1],
    scale: [.56, .66, .15],
    rotation: [0, 0, side * 8],
  }))
  rig.joints.eyes = eyes(head, rig.materials, [-.29, .2, -.56], [.29, .2, -.56], .135)
  smile(head, rig.materials, { y: -.23, z: -.64, width: .14 })
  let trunkParent = head
  for (let index = 0; index < 4; index += 1) {
    const pivot = new pc.Entity(`trunk-pivot-${index}`)
    pivot.setLocalPosition(0, index ? -.27 : -.34, index ? -.06 : -.54)
    pivot.charmRestRotation = [0, 0, 0]
    trunkParent.addChild(pivot)
    addPart(pivot, `trunk-segment-${index}`, 'capsule', rig.materials.coatLight, {
      position: [0, -.18, 0],
      scale: [.15 - index * .017, .25, .15 - index * .017],
    })
    rig.joints.trunk.push(pivot)
    trunkParent = pivot
  }
  for (const x of [-.28, .28]) {
    addPart(head, `tusk-${x}`, 'cone', rig.materials.eyeWhite, {
      position: [x, -.33, -.52],
      scale: [.075, .28, .075],
      rotation: [70, 0, x > 0 ? -8 : 8],
    })
  }
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .66,
    z: .7,
    y: -.58,
    length: 1.02,
    width: .31,
    hoofMaterial: rig.materials.coatLight,
  })
  rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, .12, 1.03], [0, -.05, .2]], .1)
  rig.accessoryAnchor = head
  rig.bodyHeight = 2.4
  rig.radius = .82
  rig.mass = 120
  return rig
}

const mammalProfiles = {
  dog: {
    palette: { coat: '#c47a45', dark: '#5d3726', light: '#fff0c7', gloss: .34 },
    body: [.62, .64, .85],
    head: [.59, .58, .56],
    headPosition: [0, .5, -.7],
    muzzle: [.34, .24, .34],
    ear: 'floppy',
    leg: { x: .4, z: .5, y: -.45, length: .74, width: .18 },
    mass: 24,
  },
  horse: {
    palette: { coat: '#cc6d3f', dark: '#5d2f25', light: '#f5ad74', gloss: .33 },
    body: [.76, .76, 1.04],
    head: [.53, .67, .66],
    headPosition: [0, .86, -.87],
    muzzle: [.36, .31, .46],
    ear: 'upright',
    leg: { x: .49, z: .64, y: -.52, length: 1.08, width: .22, hoofMaterial: true },
    mass: 95,
  },
  beaver: {
    palette: { coat: '#a8663e', dark: '#4e3028', light: '#dea26d', gloss: .4 },
    body: [.7, .61, .82],
    head: [.6, .56, .55],
    headPosition: [0, .36, -.67],
    muzzle: [.39, .24, .31],
    ear: 'round',
    leg: { x: .43, z: .44, y: -.38, length: .5, width: .2 },
    mass: 32,
  },
  fox: {
    palette: { coat: '#f06b32', dark: '#55302d', light: '#ffe0ad', gloss: .43 },
    body: [.58, .62, .86],
    head: [.59, .6, .6],
    headPosition: [0, .53, -.72],
    muzzle: [.33, .25, .4],
    ear: 'upright',
    leg: { x: .38, z: .5, y: -.43, length: .74, width: .17 },
    mass: 18,
  },
  ox: {
    palette: { coat: '#a96a44', dark: '#4e332c', light: '#ddb080', gloss: .3 },
    body: [.94, .86, 1.1],
    head: [.78, .7, .68],
    headPosition: [0, .55, -.98],
    muzzle: [.53, .33, .42],
    ear: 'round',
    leg: { x: .59, z: .68, y: -.58, length: .98, width: .28, hoofMaterial: true },
    mass: 150,
  },
}

function buildMammal(resident, createMaterial) {
  const profile = mammalProfiles[resident.kind]
  const rig = baseRig(resident, createMaterial, profile.palette)
  const body = addPart(rig.root, `${resident.kind}-body`, 'sphere', rig.materials.coat, {
    position: [0, .12, .08],
    scale: profile.body,
  })
  const head = addPart(rig.root, `${resident.kind}-head`, 'sphere', rig.materials.coat, {
    position: profile.headPosition,
    scale: profile.head,
  })
  rig.joints.head = head
  addPart(head, `${resident.kind}-muzzle`, 'sphere', rig.materials.coatLight, {
    position: [0, -.15, -.5],
    scale: profile.muzzle,
  })
  addPart(head, `${resident.kind}-nose`, 'sphere', rig.materials.eye, {
    position: [0, -.09, -.79],
    scale: resident.kind === 'ox' ? [.14, .09, .07] : [.105, .078, .065],
  })
  const eyeX = resident.kind === 'ox' ? .28 : resident.kind === 'horse' ? .2 : .22
  const eyeY = resident.kind === 'horse' ? .17 : .13
  rig.joints.eyes = eyes(head, rig.materials, [-eyeX, eyeY, -.44], [eyeX, eyeY, -.44], resident.kind === 'ox' ? .13 : .125)
  smile(head, rig.materials, {
    y: resident.kind === 'horse' ? -.28 : -.27,
    z: resident.kind === 'ox' ? -.67 : -.66,
    width: resident.kind === 'ox' ? .15 : .125,
  })

  rig.joints.ears = [-1, 1].map((side, index) => addPart(
    head,
    `${resident.kind}-ear-${index}`,
    profile.ear === 'round' || profile.ear === 'floppy' ? 'sphere' : 'cone',
    rig.materials.coatDark,
    {
      position: [side * (resident.kind === 'ox' ? .42 : .34), resident.kind === 'horse' ? .48 : .42, -.02],
      scale: profile.ear === 'floppy' ? [.21, .34, .13] : profile.ear === 'round' ? [.21, .23, .13] : [.19, .39, .16],
      rotation: [0, 0, side * (profile.ear === 'floppy' ? 24 : 10)],
    },
  ))

  const legOptions = { ...profile.leg }
  if (legOptions.hoofMaterial) legOptions.hoofMaterial = rig.materials.eye
  else legOptions.pawMaterial = rig.materials.coatLight
  const legMaterial = ['dog', 'horse', 'fox'].includes(resident.kind)
    ? rig.materials.coat
    : rig.materials.coatDark
  rig.joints.legs = fourLegs(body, legMaterial, legOptions)

  if (resident.kind === 'beaver') {
    const tail = addPart(body, 'beaver-paddle-tail', 'sphere', rig.materials.coatDark, {
      position: [0, -.22, 1.08],
      scale: [.42, .12, .78],
      rotation: [12, 0, 0],
    })
    rig.joints.tail = [tail]
    for (const x of [-.12, .12]) {
      addPart(head, `beaver-incisor-${x}`, 'box', rig.materials.eyeWhite, {
        position: [x, -.24, -.73],
        scale: [.13, .27, .075],
      })
    }
  } else if (resident.kind === 'fox') {
    rig.joints.tail = tailChain(body, rig.materials.coat, [[0, .13, .76], [0, .05, .36], [0, 0, .34]], .3)
    addPart(rig.joints.tail.at(-1), 'fox-tail-tip', 'sphere', rig.materials.coatLight, {
      position: [0, 0, -.22],
      scale: [.3, .3, .5],
    })
  } else if (resident.kind === 'horse') {
    rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, .18, 1.03], [0, -.06, .28], [0, -.08, .3]], .18)
    for (let index = 0; index < 5; index += 1) {
      addPart(rig.root, `horse-mane-${index}`, 'sphere', rig.materials.coatDark, {
        position: [0, .72 + index * .13, -.55 + index * .12],
        scale: [.12, .24, .19],
      })
    }
    addPart(head, 'horse-forelock', 'sphere', rig.materials.coatDark, {
      position: [0, .52, -.24],
      scale: [.24, .3, .14],
      rotation: [0, 0, -12],
    })
  } else {
    rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, .08, 1], [0, .03, .24]], resident.kind === 'ox' ? .14 : .18)
  }

  if (resident.kind === 'ox') {
    for (const side of [-1, 1]) {
      addPart(head, `ox-horn-${side}`, 'cone', rig.materials.eyeWhite, {
        position: [side * .61, .35, -.02],
        scale: [.15, .58, .15],
        rotation: [0, 0, side * -62],
      })
    }
  }
  if (resident.kind === 'dog') {
    addPart(head, 'collie-blaze', 'sphere', rig.materials.coatLight, {
      position: [0, .21, -.5],
      scale: [.16, .37, .08],
      castShadows: false,
    })
    addPart(body, 'collie-ruff', 'sphere', rig.materials.coatLight, {
      position: [0, .18, -.57],
      scale: [.72, .57, .28],
    })
  }
  rig.accessoryAnchor = head
  rig.bodyHeight = resident.kind === 'horse' ? 2.25 : resident.kind === 'ox' ? 2.1 : 1.55
  rig.radius = resident.kind === 'horse' ? .7 : resident.kind === 'ox' ? .83 : .53
  rig.mass = profile.mass
  return rig
}

function buildBirdSpecies(resident, createMaterial) {
  const palettes = {
    peacock: { coat: '#00a99a', dark: '#2353a7', light: '#64e3af', gloss: .52 },
    flamingo: { coat: '#ff6f9b', dark: '#c53e77', light: '#ffc0d2', gloss: .42 },
    hawk: { coat: '#a66a3e', dark: '#493241', light: '#f2c96d', gloss: .33 },
  }
  const rig = baseRig(resident, createMaterial, palettes[resident.kind])
  const tall = resident.kind === 'flamingo'
  const body = addPart(rig.root, `${resident.kind}-body`, 'sphere', rig.materials.coat, {
    position: [0, tall ? .72 : .18, 0],
    scale: tall ? [.52, .62, .7] : [.66, .75, .64],
  })
  let headParent = rig.root
  if (tall) {
    for (let index = 0; index < 4; index += 1) {
      const neck = addPart(headParent, `flamingo-neck-${index}`, 'capsule', rig.materials.coatLight, {
        position: [0, .48, index ? -.08 : -.42],
        scale: [.12, .42, .12],
        rotation: [index * 7 - 10, 0, 0],
      })
      headParent = neck
    }
  }
  const head = addPart(headParent, `${resident.kind}-head`, 'sphere', rig.materials.coatLight, {
    position: tall ? [0, .61, -.14] : [0, .69, -.2],
    scale: tall ? [.39, .4, .41] : [.58, .55, .53],
  })
  rig.joints.head = head
  rig.joints.eyes = eyes(
    head,
    rig.materials,
    [tall ? -.14 : -.2, .12, tall ? -.34 : -.42],
    [tall ? .14 : .2, .12, tall ? -.34 : -.42],
    tall ? .09 : .125,
    { brow: resident.kind === 'hawk' },
  )
  addPart(head, `${resident.kind}-beak`, 'cone', resident.kind === 'flamingo' ? rig.materials.eye : rig.materials.accent, {
    position: [0, -.08, tall ? -.5 : -.58],
    scale: tall ? [.12, .37, .12] : [.15, .3, .15],
    rotation: [90, 0, 0],
  })
  smile(head, rig.materials, {
    y: tall ? -.19 : -.22,
    z: tall ? -.44 : -.5,
    width: tall ? .08 : .1,
    cheeks: resident.kind !== 'hawk',
  })
  rig.joints.wings = [-1, 1].map((side, index) => {
    const pivot = new pc.Entity(`${resident.kind}-wing-pivot-${index}`)
    pivot.setLocalPosition(side * .45, tall ? .78 : .28, .02)
    body.addChild(pivot)
    addPart(pivot, `${resident.kind}-wing-${index}`, 'sphere', rig.materials.coatDark, {
      position: [side * .21, -.1, -.03],
      scale: [.5, .16, .65],
      rotation: [0, 0, side * 12],
    })
    return pivot
  })
  rig.joints.legs = [-.2, .2].map((x, index) => {
    const pivot = new pc.Entity(`${resident.kind}-leg-pivot-${index}`)
    pivot.setLocalPosition(x, tall ? -.37 : -.57, -.04)
    pivot.charmRestRotation = [0, 0, 0]
    body.addChild(pivot)
    const legLength = tall ? 1.04 : .42
    addPart(pivot, `${resident.kind}-leg-${index}`, 'capsule', rig.materials.coatDark, {
      position: [0, -legLength * .5, 0],
      scale: [tall ? .07 : .09, legLength * .62, tall ? .07 : .09],
    })
    addPart(pivot, `${resident.kind}-foot-${index}`, 'sphere', rig.materials.coatDark, {
      position: [0, -legLength - .04, -.12],
      scale: [tall ? .18 : .21, .08, tall ? .32 : .3],
    })
    return pivot
  })
  if (resident.kind === 'peacock') {
    for (let index = 0; index < 9; index += 1) {
      const angle = (-72 + index * 18) * Math.PI / 180
      const feather = addPart(body, `peacock-tail-feather-${index}`, 'sphere', index % 2 ? rig.materials.accent : rig.materials.coatLight, {
        position: [Math.sin(angle) * 1.05, .66 + Math.cos(angle) * .68, .55],
        scale: [.22, .72, .08],
        rotation: [0, 0, -72 + index * 18],
      })
      addPart(feather, `peacock-eye-spot-${index}`, 'sphere', rig.materials.eye, {
        position: [0, .35, -.55],
        scale: [.32, .18, .1],
        castShadows: false,
      })
    }
    for (const [index, x] of [-.12, 0, .12].entries()) {
      addPart(head, `peacock-crown-${index}`, 'capsule', rig.materials.accent, {
        position: [x, .42 + Math.abs(x), -.02],
        scale: [.035, .22, .035],
        rotation: [0, 0, x * -80],
      })
      addPart(head, `peacock-crown-tip-${index}`, 'sphere', rig.materials.accent, {
        position: [x * 1.65, .64, -.02],
        scale: [.07, .07, .07],
      })
    }
  } else {
    rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, -.12, .55], [0, 0, .22]], .18)
  }
  rig.accessoryAnchor = head
  rig.bodyHeight = tall ? 2.45 : 1.65
  rig.radius = tall ? .45 : .52
  rig.mass = tall ? 7 : 6
  rig.hoverHeight = resident.kind === 'hawk' ? 3.7 : null
  return rig
}

function addAnatomicalDetail(rig, resident) {
  const { materials } = rig
  const head = rig.joints.head
  const kind = resident.kind

  if (kind === 'pig') {
    addPart(rig.root, 'pig-round-belly', 'sphere', materials.coatLight, {
      position: [0, -.18, -.18],
      scale: [.54, .31, .38],
    })
    for (const [index, side] of [-1, 1].entries()) {
      addPart(head, `pig-inner-ear-${index}`, 'cone', materials.blush, {
        position: [side * .34, .48, -.08],
        scale: [.12, .22, .055],
        rotation: [0, 0, side * -24],
        castShadows: false,
      })
      addPart(head, `pig-jowl-${index}`, 'sphere', materials.coatLight, {
        position: [side * .27, -.19, -.43],
        scale: [.23, .2, .2],
      })
    }
  } else if (kind === 'cat') {
    for (const [index, side] of [-1, 1].entries()) {
      addPart(head, `cat-inner-ear-${index}`, 'cone', materials.blush, {
        position: [side * .325, .48, -.055],
        scale: [.115, .25, .055],
        rotation: [0, 0, side * -9],
        castShadows: false,
      })
      addPart(head, `cat-eye-mask-${index}`, 'sphere', materials.coatDark, {
        position: [side * .23, .12, -.44],
        scale: [.25, .2, .06],
        castShadows: false,
      })
    }
    addPart(head, 'cat-forehead-diamond', 'cone', materials.coatLight, {
      position: [0, .3, -.52],
      scale: [.1, .23, .035],
      rotation: [0, 0, 180],
      castShadows: false,
    })
  } else if (kind === 'owl') {
    for (const [index, side] of [-1, 1].entries()) {
      addPart(head, `owl-ear-tuft-${index}`, 'cone', materials.coatDark, {
        position: [side * .48, .45, -.02],
        scale: [.17, .35, .13],
        rotation: [0, 0, side * -18],
      })
      const wing = rig.joints.wings[index]
      for (let feather = 0; feather < 5; feather += 1) {
        addPart(wing, `owl-primary-feather-${index}-${feather}`, 'capsule', feather % 2 ? materials.coat : materials.coatDark, {
          position: [side * (.18 + feather * .085), -.25 - feather * .035, .1 + feather * .09],
          scale: [.075, .34 + feather * .025, .055],
          rotation: [18, 0, side * (24 + feather * 4)],
        })
      }
      const leg = rig.joints.legs[index]
      for (let talon = -1; talon <= 1; talon += 1) {
        addPart(leg, `owl-talon-${index}-${talon}`, 'cone', materials.accent, {
          position: [talon * .085, -.5, -.18],
          scale: [.03, .13, .03],
          rotation: [74, 0, talon * 10],
        })
      }
    }
    for (let row = 0; row < 3; row += 1) {
      for (let feather = -2; feather <= 2; feather += 1) {
        addPart(rig.root, `owl-breast-feather-${row}-${feather}`, 'sphere', row % 2 ? materials.coatLight : materials.eyeWhite, {
          position: [feather * .13 + (row % 2 ? .065 : 0), .36 - row * .23, -.56],
          scale: [.12, .14, .045],
          castShadows: false,
        })
      }
    }
  } else if (kind === 'dragon') {
    addPart(head, 'dragon-lower-jaw', 'capsule', materials.coatLight, {
      position: [0, -.27, -.52],
      scale: [.34, .22, .22],
      rotation: [90, 0, 0],
    })
    for (const [index, side] of [-1, 1].entries()) {
      addPart(head, `dragon-cheek-spike-${index}`, 'cone', materials.accent, {
        position: [side * .53, -.1, -.16],
        scale: [.09, .3, .09],
        rotation: [0, 0, side * -72],
      })
      const wing = rig.joints.wings[index]
      for (let finger = 0; finger < 4; finger += 1) {
        addPart(wing, `dragon-wing-finger-${index}-${finger}`, 'capsule', materials.coatDark, {
          position: [side * (.32 + finger * .13), .04 - finger * .06, .18 + finger * .09],
          scale: [.045, .38 + finger * .08, .045],
          rotation: [12 + finger * 6, 0, side * (68 + finger * 5)],
        })
      }
    }
    for (let scale = 0; scale < 10; scale += 1) {
      const side = scale % 2 ? -1 : 1
      addPart(rig.root, `dragon-face-scale-${scale}`, 'sphere', materials.accent, {
        position: [side * (.25 + Math.floor(scale / 2) * .035), .65 - Math.floor(scale / 2) * .11, -.9],
        scale: [.055, .07, .025],
        castShadows: false,
      })
    }
  } else if (kind === 'tortoise') {
    for (let segment = 0; segment < 14; segment += 1) {
      const angle = segment / 14 * Math.PI * 2
      addPart(rig.root, `tortoise-shell-rim-${segment}`, 'sphere', materials.coatLight, {
        position: [Math.cos(angle) * .72, .02, .08 + Math.sin(angle) * .79],
        scale: [.14, .12, .18],
      })
    }
    for (const [legIndex, leg] of rig.joints.legs.entries()) {
      for (let claw = -1; claw <= 1; claw += 1) {
        addPart(leg, `tortoise-claw-${legIndex}-${claw}`, 'cone', materials.eyeWhite, {
          position: [claw * .09, -.43, -.17],
          scale: [.035, .12, .035],
          rotation: [72, 0, claw * 8],
        })
      }
    }
  } else if (kind === 'elephant') {
    addPart(head, 'elephant-forehead-dome', 'sphere', materials.coatLight, {
      position: [0, .42, -.08],
      scale: [.55, .3, .48],
    })
    for (const [index, side] of [-1, 1].entries()) {
      addPart(head, `elephant-inner-ear-${index}`, 'sphere', materials.blush, {
        position: [side * .69, .04, .08],
        scale: [.38, .48, .035],
        castShadows: false,
      })
    }
    const trunkTip = rig.joints.trunk.at(-1)
    for (const side of [-1, 1]) {
      addPart(trunkTip, `trunk-nostril-${side}`, 'sphere', materials.eye, {
        position: [side * .055, -.42, -.08],
        scale: [.025, .035, .018],
        castShadows: false,
      })
    }
    for (const [legIndex, leg] of rig.joints.legs.entries()) {
      for (let nail = -1; nail <= 1; nail += 1) {
        addPart(leg, `elephant-toenail-${legIndex}-${nail}`, 'sphere', materials.eyeWhite, {
          position: [nail * .1, -.88, -.25],
          scale: [.07, .045, .035],
          castShadows: false,
        })
      }
    }
  } else if (['dog', 'horse', 'beaver', 'fox', 'ox'].includes(kind)) {
    if (kind === 'dog') {
      for (const [index, side] of [-1, 1].entries()) {
        addPart(head, `collie-face-patch-${index}`, 'sphere', index ? materials.coatDark : materials.coatLight, {
          position: [side * .23, .07, -.46],
          scale: [.24, .31, .055],
          rotation: [0, 0, side * 10],
          castShadows: false,
        })
      }
    } else if (kind === 'horse') {
      addPart(head, 'horse-long-nasal-bridge', 'capsule', materials.coatLight, {
        position: [0, -.1, -.48],
        scale: [.22, .42, .18],
        rotation: [90, 0, 0],
      })
      for (const side of [-1, 1]) {
        addPart(head, `horse-nostril-${side}`, 'sphere', materials.eye, {
          position: [side * .16, -.25, -.72],
          scale: [.05, .035, .025],
          castShadows: false,
        })
      }
    } else if (kind === 'beaver') {
      for (const [index, side] of [-1, 1].entries()) {
        addPart(head, `beaver-cheek-${index}`, 'sphere', materials.coatLight, {
          position: [side * .28, -.12, -.44],
          scale: [.3, .25, .19],
        })
      }
      for (let line = -2; line <= 2; line += 1) {
        addPart(rig.root, `beaver-tail-ridge-${line}`, 'capsule', materials.coat, {
          position: [line * .1, -.2, 1.48],
          scale: [.025, .31, .025],
          rotation: [90, 0, line * 6],
          castShadows: false,
        })
      }
    } else if (kind === 'fox') {
      addPart(head, 'fox-white-chin', 'sphere', materials.eyeWhite, {
        position: [0, -.28, -.51],
        scale: [.31, .18, .16],
      })
      for (const [index, side] of [-1, 1].entries()) {
        addPart(head, `fox-inner-ear-${index}`, 'cone', materials.blush, {
          position: [side * .34, .43, -.03],
          scale: [.1, .23, .05],
          rotation: [0, 0, side * -10],
          castShadows: false,
        })
      }
    } else if (kind === 'ox') {
      addPart(rig.root, 'ox-dewlap', 'sphere', materials.coatLight, {
        position: [0, -.18, -.63],
        scale: [.43, .45, .28],
      })
      addPart(rig.root, 'ox-shoulder-hump', 'sphere', materials.coatDark, {
        position: [0, .67, .25],
        scale: [.67, .34, .59],
      })
    }
    for (const [legIndex, leg] of rig.joints.legs.entries()) {
      addPart(leg, `${kind}-ankle-${legIndex}`, 'sphere', materials.coatDark, {
        position: [0, -.5, 0],
        scale: [.18, .16, .18],
      })
    }
  } else if (['peacock', 'flamingo', 'hawk'].includes(kind)) {
    for (const [index, wing] of rig.joints.wings.entries()) {
      const side = index ? 1 : -1
      for (let feather = 0; feather < 5; feather += 1) {
        addPart(wing, `${kind}-primary-feather-${index}-${feather}`, 'capsule', feather % 2 ? materials.coat : materials.coatDark, {
          position: [side * (.18 + feather * .075), -.18 - feather * .04, .06 + feather * .08],
          scale: [.065, .3 + feather * .035, .05],
          rotation: [14, 0, side * (30 + feather * 5)],
        })
      }
    }
    if (kind === 'flamingo') {
      addPart(head, 'flamingo-beak-tip', 'cone', materials.eye, {
        position: [0, -.1, -.72],
        scale: [.095, .22, .095],
        rotation: [90, 0, 0],
      })
    } else if (kind === 'hawk') {
      for (const [index, side] of [-1, 1].entries()) {
        addPart(head, `hawk-eye-stripe-${index}`, 'capsule', materials.coatDark, {
          position: [side * .24, .18, -.5],
          scale: [.035, .24, .025],
          rotation: [0, 0, side * 72],
          castShadows: false,
        })
      }
    }
  }
}

export function createAnimalRig(resident, createMaterial) {
  let rig
  if (resident.kind === 'pig') rig = buildPig(resident, createMaterial)
  else if (resident.kind === 'cat') rig = buildCat(resident, createMaterial)
  else if (resident.kind === 'owl') rig = buildOwl(resident, createMaterial)
  else if (resident.kind === 'dragon') rig = buildDragon(resident, createMaterial)
  else if (resident.kind === 'tortoise') rig = buildTortoise(resident, createMaterial)
  else if (resident.kind === 'elephant') rig = buildElephant(resident, createMaterial)
  else if (mammalProfiles[resident.kind]) rig = buildMammal(resident, createMaterial)
  else if (['peacock', 'flamingo', 'hawk'].includes(resident.kind)) rig = buildBirdSpecies(resident, createMaterial)
  else rig = buildPig(resident, createMaterial)
  applySurfaceMaps(rig, resident)
  addAnatomicalDetail(rig, resident)
  return rig
}

function pose(entity, x = 0, y = 0, z = 0) {
  const rest = entity.charmRestRotation || [0, 0, 0]
  entity.setLocalEulerAngles(rest[0] + x, rest[1] + y, rest[2] + z)
}

export function animateAnimalRig(actor, elapsed, delta) {
  const { rig } = actor
  const moving = actor.state === 'moving'
  const performance = actor.state === 'performing'
  const celebrating = actor.manual?.type === 'celebrate'
  const greeting = actor.manual?.type === 'neighbor-friendly'
  const challenging = actor.manual?.type === 'neighbor-challenge'
  const social = greeting || challenging
  const celebration = celebrating ? actor.celebrationProgress : 0
  const dance = celebrating ? Math.sin(celebration * Math.PI * 6) : 0
  const danceHop = celebrating ? Math.abs(Math.sin(celebration * Math.PI * 6)) : 0
  const socialWave = social ? Math.sin(actor.manual.elapsed * (greeting ? 7.5 : 10.5)) : 0
  const socialPulse = social ? Math.abs(Math.sin(actor.manual.elapsed * (greeting ? 3.75 : 5.25))) : 0
  const speed = moving ? actor.motionSpeed : 0
  actor.gaitClock += delta * (celebrating ? 9.5 : challenging ? 8.5 : greeting ? 5.4 : moving ? 3.5 + speed * 1.45 : 1.25)
  const gait = Math.sin(actor.gaitClock)
  const gaitLift = Math.abs(Math.cos(actor.gaitClock))
  const breathe = Math.sin(elapsed * 2.2 + actor.phase)
  const curious = Math.sin(elapsed * .78 + actor.phase * .7)
  const stride = celebrating ? dance * 22 : moving ? gait * 13 : breathe * 1.2

  rig.joints.legs.forEach((leg, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const socialStride = greeting
      ? (index === 0 ? -28 * socialPulse : socialWave * side * 3)
      : challenging ? socialWave * side * 16 : null
    pose(
      leg,
      social ? socialStride : stride * side,
      0,
      greeting && index === 0
        ? socialWave * 12
        : challenging ? socialPulse * side * 6
          : celebrating ? dance * side * 7
            : moving ? gait * side * 1.8 : 0,
    )
  })
  rig.joints.wings.forEach((wing, index) => {
    const side = index ? -1 : 1
    const airborne = rig.hoverHeight || actor.resident.kind === 'dragon'
    const flapSpeed = celebrating ? 11 : social ? greeting ? 7.5 : 10.5 : moving || airborne ? 5.4 : 2.2
    const amplitude = celebrating ? 34 : greeting ? 26 : challenging ? 42 : moving || airborne ? 18 : 5
    pose(wing, 0, 0, side * (10 + Math.sin(elapsed * flapSpeed + index * .35) * amplitude))
  })
  rig.joints.tail.forEach((segment, index) => {
    const wag = Math.sin(elapsed * (celebrating ? 11 : greeting ? 9 : challenging ? 4.5 : moving ? 5.2 : 2.7) - index * .58 + actor.phase)
    pose(
      segment,
      0,
      wag * (celebrating ? 28 : greeting ? 31 : challenging ? 10 : moving ? 15 : 8),
      index ? wag * (celebrating || greeting ? 5 : 2) : 0,
    )
  })
  rig.joints.ears.forEach((ear, index) => {
    pose(
      ear,
      social ? socialWave * (index ? -7 : 7) : celebrating ? dance * (index ? -5 : 5) : curious * (index ? -2 : 2),
      0,
      challenging
        ? (index ? -14 : 14) + socialWave * 4
        : greeting ? socialWave * (index ? -10 : 10)
          : celebrating ? dance * (index ? -9 : 9)
            : Math.sin(elapsed * 1.7 + index * 1.9) * 3.5,
    )
  })
  rig.joints.trunk.forEach((segment, index) => {
    pose(
      segment,
      Math.sin(elapsed * (celebrating ? 7 : 1.9) - index * .52) * (celebrating ? 15 : 8),
      0,
      Math.cos(elapsed * 1.35 + index) * 4,
    )
  })
  if (rig.joints.head) {
    pose(
      rig.joints.head,
      greeting ? -socialPulse * 8 : challenging ? 8 - socialPulse * 13 : celebrating ? -danceHop * 5 : performance ? Math.sin(elapsed * 9) * 5 : breathe * 1.7,
      social ? socialWave * (greeting ? 8 : 4) : celebrating ? dance * 9 : moving ? gait * 2.2 : curious * 4.5,
      greeting ? socialWave * 9 : challenging ? socialWave * 3 : celebrating ? dance * 12 : performance ? Math.sin(elapsed * 6) * 5 : curious * 1.8,
    )
  }

  const blinkWave = Math.sin(elapsed * .82 + actor.phase * 2.7)
  const blink = celebrating || greeting ? 0 : clamp01((blinkWave - .965) / .035)
  rig.joints.eyes.forEach(({ white, pupil }, index) => {
    const whiteRest = white.charmRestScale || [1, 1, 1]
    white.setLocalScale(
      whiteRest[0] * (celebrating ? 1.06 : 1),
      whiteRest[1] * (1 - blink * .82) * (celebrating ? 1.08 : challenging ? .72 : greeting ? 1.04 : 1),
      whiteRest[2],
    )
    const pupilRest = pupil.charmRestScale || [1, 1, 1]
    pupil.setLocalScale(
      pupilRest[0] * (celebrating ? 1.13 : greeting ? 1.06 : 1),
      pupilRest[1] * (celebrating ? 1.13 : challenging ? .8 : greeting ? 1.06 : 1),
      pupilRest[2],
    )
    const pupilPosition = pupil.charmRestPosition || [0, 0, 0]
    pupil.setLocalPosition(
      pupilPosition[0] + (social ? (index ? -.016 : .016) + socialWave * .01 : celebrating ? dance * .025 * (index ? -1 : 1) : curious * .012),
      pupilPosition[1] + (celebrating ? danceHop * .025 : greeting ? socialPulse * .01 : 0),
      pupilPosition[2],
    )
  })

  const visualY = celebrating ? danceHop * .18 : greeting ? socialPulse * .07 : challenging ? socialPulse * .1 : moving ? gaitLift * .065 : breathe * .022
  const squash = celebrating ? danceHop * .055 : social ? socialPulse * .025 : moving ? gaitLift * .018 : breathe * .009
  rig.root.setLocalPosition(0, visualY, 0)
  rig.root.setLocalScale(
    1 + squash + (celebrating ? Math.abs(dance) * .025 : 0),
    1 - squash,
    1 + squash * .45,
  )
  if (!actor.manual || actor.manual.type !== 'spin') {
    rig.root.setLocalEulerAngles(
      greeting ? -socialPulse * 7 : challenging ? 6 - socialPulse * 12 : celebrating ? dance * 6 : moving ? gait * 1.2 : 0,
      greeting ? socialWave * 5 : challenging ? socialWave * 2 : celebrating ? dance * 18 : 0,
      social ? socialWave * (greeting ? 5 : 2) : celebrating ? dance * 10 : moving ? -gait * 2.4 : curious * .7,
    )
  }
}

const clamp01 = value => Math.min(1, Math.max(0, value))

export function setAnimalAccessory(rig, skin, createMaterial) {
  if (rig.accessory) {
    rig.accessory.destroy()
    rig.accessory = null
  }
  if (!skin) return

  const root = new pc.Entity(`${skin}-accessory`)
  rig.accessoryAnchor.addChild(root)
  if (skin === 'bandana') {
    const material = createMaterial('bandana-fabric', '#cf4f43', { gloss: .32 })
    addPart(root, 'bandana-knot', 'sphere', material, {
      position: [0, -.26, -.45],
      scale: [.18, .14, .12],
    })
    addPart(root, 'bandana-tail', 'cone', material, {
      position: [0, -.43, -.37],
      scale: [.16, .34, .08],
      rotation: [0, 0, 180],
    })
  } else if (skin === 'raincoat') {
    const material = createMaterial('raincoat-shell', '#f3bc35', { gloss: .72, metalness: .08 })
    addPart(root, 'raincoat', 'sphere', material, {
      position: [0, -.16, .2],
      scale: [.92, .48, .84],
    })
    addPart(root, 'raincoat-ridge', 'capsule', material, {
      position: [0, .15, .2],
      scale: [.14, .58, .14],
      rotation: [90, 0, 0],
    })
  } else {
    const material = createMaterial('aurora-harness', '#8e6be9', {
      gloss: .86,
      metalness: .32,
      emissive: '#28165d',
    })
    addPart(root, 'aurora-core', 'sphere', material, {
      position: [0, .22, .08],
      scale: [.22, .22, .22],
    })
    for (const [index, x] of [-.38, .38].entries()) {
      addPart(root, `aurora-node-${index}`, 'sphere', material, {
        position: [x, .05, .05],
        scale: [.1, .1, .1],
      })
    }
  }
  rig.accessory = root
}

export const vec3 = v3
