const pc = window.pc

const v3 = (x = 0, y = 0, z = 0) => new pc.Vec3(x, y, z)
const highDensityMeshCache = new WeakMap()

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
  parent.addChild(entity)
  return entity
}

function eyes(parent, materials, left, right, size = .14) {
  const result = []
  for (const [index, position] of [left, right].entries()) {
    const white = addPart(parent, `eye-white-${index}`, 'sphere', materials.eyeWhite, {
      position,
      scale: [size * 1.25, size * 1.25, size * .6],
      castShadows: false,
    })
    const pupil = addPart(white, `eye-pupil-${index}`, 'sphere', materials.eye, {
      position: [0, 0, -.46],
      scale: [.48, .55, .35],
      castShadows: false,
    })
    result.push({ white, pupil })
  }
  return result
}

function fourLegs(parent, material, {
  x = .42,
  z = .52,
  y = -.52,
  length = .72,
  width = .2,
  hoofMaterial = null,
} = {}) {
  const legs = []
  for (const [index, position] of [
    [-x, y, -z],
    [x, y, -z],
    [-x, y, z],
    [x, y, z],
  ].entries()) {
    const pivot = new pc.Entity(`leg-pivot-${index}`)
    pivot.setLocalPosition(position[0], position[1] + length * .32, position[2])
    parent.addChild(pivot)
    addPart(pivot, `leg-${index}`, 'cylinder', material, {
      position: [0, -length * .34, 0],
      scale: [width, length * .52, width],
    })
    if (hoofMaterial) {
      addPart(pivot, `hoof-${index}`, 'sphere', hoofMaterial, {
        position: [0, -length * .82, -.03],
        scale: [width * 1.18, width * .56, width * 1.35],
      })
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
    eyeWhite: createMaterial(`${resident.id}-eye-white`, '#fff8dd', { gloss: .72 }),
    metal: createMaterial(`${resident.id}-metal`, '#7e9797', { gloss: .82, metalness: .76 }),
  }
  return {
    root,
    materials,
    baseCoat: materials.coat.diffuse.clone(),
    joints: { legs: [], wings: [], tail: [], ears: [], head: null, trunk: [] },
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
    coat: '#d99078',
    dark: '#a44f45',
    light: '#f4b19a',
    gloss: .44,
  })
  const body = addPart(rig.root, 'pig-body', 'sphere', rig.materials.coat, {
    position: [0, .02, 0],
    scale: [.82, .63, 1.03],
  })
  const head = addPart(rig.root, 'pig-head', 'sphere', rig.materials.coatLight, {
    position: [0, .22, -.84],
    scale: [.61, .57, .59],
  })
  rig.joints.head = head
  addPart(head, 'pig-snout', 'cylinder', rig.materials.coatDark, {
    position: [0, -.08, -.52],
    scale: [.27, .2, .27],
    rotation: [90, 0, 0],
  })
  addPart(head, 'snout-highlight', 'sphere', rig.materials.coatLight, {
    position: [0, -.08, -.69],
    scale: [.25, .18, .1],
  })
  for (const x of [-.11, .11]) {
    addPart(head, `nostril-${x}`, 'sphere', rig.materials.eye, {
      position: [x, -.06, -.79],
      scale: [.035, .035, .025],
      castShadows: false,
    })
  }
  rig.joints.ears = [-.34, .34].map((x, index) => addPart(head, `pig-ear-${index}`, 'cone', rig.materials.coatDark, {
    position: [x, .43, -.05],
    scale: [.2, .28, .13],
    rotation: [0, 0, index ? -18 : 18],
  }))
  eyes(head, rig.materials, [-.22, .12, -.48], [.22, .12, -.48], .11)
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
    coat: '#313b40',
    dark: '#121a1d',
    light: '#6e7a7c',
    gloss: .55,
  })
  const body = addPart(rig.root, 'cat-body', 'capsule', rig.materials.coat, {
    position: [0, .08, .1],
    scale: [.52, .7, .52],
    rotation: [90, 0, 0],
  })
  const chest = addPart(body, 'cat-chest', 'sphere', rig.materials.coatLight, {
    position: [0, -.18, -.48],
    scale: [.62, .72, .32],
  })
  const head = addPart(rig.root, 'cat-head', 'sphere', rig.materials.coat, {
    position: [0, .42, -.67],
    scale: [.51, .5, .5],
  })
  rig.joints.head = head
  rig.joints.ears = [-.29, .29].map((x, index) => addPart(head, `cat-ear-${index}`, 'cone', rig.materials.coatDark, {
    position: [x, .42, -.02],
    scale: [.18, .31, .16],
    rotation: [0, 0, index ? -9 : 9],
  }))
  eyes(head, rig.materials, [-.2, .09, -.43], [.2, .09, -.43], .12)
  addPart(head, 'cat-muzzle', 'sphere', rig.materials.coatLight, {
    position: [0, -.12, -.45],
    scale: [.26, .2, .17],
  })
  addPart(head, 'cat-nose', 'sphere', rig.materials.accent, {
    position: [0, -.03, -.58],
    scale: [.08, .055, .05],
  })
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .38,
    z: .4,
    y: -.45,
    length: .78,
    width: .14,
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
    coat: '#577c87',
    dark: '#274a55',
    light: '#b6d5d2',
    gloss: .28,
  })
  const body = addPart(rig.root, 'owl-body', 'sphere', rig.materials.coat, {
    position: [0, .08, 0],
    scale: [.63, .85, .56],
  })
  const head = addPart(rig.root, 'owl-head', 'sphere', rig.materials.coatLight, {
    position: [0, .78, -.1],
    scale: [.67, .6, .58],
  })
  rig.joints.head = head
  const faceLeft = addPart(head, 'owl-face-left', 'sphere', rig.materials.eyeWhite, {
    position: [-.21, .02, -.46],
    scale: [.33, .36, .16],
  })
  const faceRight = addPart(head, 'owl-face-right', 'sphere', rig.materials.eyeWhite, {
    position: [.21, .02, -.46],
    scale: [.33, .36, .16],
  })
  addPart(faceLeft, 'owl-eye-left', 'sphere', rig.materials.eye, {
    position: [0, .01, -.72],
    scale: [.3, .3, .2],
    castShadows: false,
  })
  addPart(faceRight, 'owl-eye-right', 'sphere', rig.materials.eye, {
    position: [0, .01, -.72],
    scale: [.3, .3, .2],
    castShadows: false,
  })
  addPart(head, 'owl-beak', 'cone', rig.materials.accent, {
    position: [0, -.24, -.61],
    scale: [.13, .27, .13],
    rotation: [90, 0, 0],
  })
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
    const leg = addPart(body, `owl-leg-${index}`, 'cylinder', rig.materials.accent, {
      position: [x, -.76, -.03],
      scale: [.07, .23, .07],
    })
    addPart(leg, `owl-claw-${index}`, 'sphere', rig.materials.accent, {
      position: [0, -.48, -.1],
      scale: [.15, .08, .22],
    })
    return leg
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
    coat: '#1d8756',
    dark: '#0d4e38',
    light: '#6bcf85',
    gloss: .52,
  })
  const body = addPart(rig.root, 'dragon-body', 'capsule', rig.materials.coat, {
    position: [0, .1, .08],
    scale: [.65, .88, .65],
    rotation: [90, 0, 0],
  })
  addPart(body, 'dragon-belly', 'sphere', rig.materials.coatLight, {
    position: [0, -.12, -.38],
    scale: [.56, .7, .25],
  })
  const neck = addPart(rig.root, 'dragon-neck', 'capsule', rig.materials.coat, {
    position: [0, .45, -.63],
    scale: [.31, .55, .31],
    rotation: [30, 0, 0],
  })
  const head = addPart(neck, 'dragon-head', 'sphere', rig.materials.coat, {
    position: [0, .66, -.18],
    scale: [.54, .46, .64],
  })
  rig.joints.head = head
  addPart(head, 'dragon-muzzle', 'sphere', rig.materials.coatLight, {
    position: [0, -.12, -.52],
    scale: [.38, .27, .35],
  })
  eyes(head, rig.materials, [-.22, .09, -.49], [.22, .09, -.49], .12)
  rig.joints.ears = [-.27, .27].map((x, index) => addPart(head, `dragon-horn-${index}`, 'cone', rig.materials.accent, {
    position: [x, .36, .05],
    scale: [.12, .38, .12],
    rotation: [index ? 15 : -15, 0, index ? -9 : 9],
  }))
  rig.joints.wings = [-1, 1].map((side, index) => {
    const pivot = new pc.Entity(`dragon-wing-pivot-${index}`)
    pivot.setLocalPosition(side * .49, .37, .18)
    body.addChild(pivot)
    addPart(pivot, `dragon-wing-arm-${index}`, 'capsule', rig.materials.coatDark, {
      position: [side * .42, .08, 0],
      scale: [.1, .5, .1],
      rotation: [0, 0, side * 72],
    })
    addPart(pivot, `dragon-wing-membrane-${index}`, 'sphere', rig.materials.accent, {
      position: [side * .55, -.1, .14],
      scale: [.75, .06, .62],
      rotation: [0, 0, side * 11],
      castShadows: true,
    })
    return pivot
  })
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .43,
    z: .43,
    y: -.5,
    length: .79,
    width: .17,
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
    coat: '#5b743f',
    dark: '#334729',
    light: '#92a85c',
    gloss: .24,
  })
  const shell = addPart(rig.root, 'tortoise-shell', 'sphere', rig.materials.coatDark, {
    position: [0, .03, .05],
    scale: [.78, .43, .92],
  })
  for (const [index, position] of [[0, .36, 0], [-.36, .24, -.12], [.36, .24, -.12], [-.3, .2, .34], [.3, .2, .34]].entries()) {
    addPart(shell, `shell-plate-${index}`, 'sphere', rig.materials.coat, {
      position,
      scale: [.28, .08, .29],
      castShadows: false,
    })
  }
  const head = addPart(rig.root, 'tortoise-head', 'sphere', rig.materials.coatLight, {
    position: [0, -.02, -.86],
    scale: [.34, .31, .42],
  })
  rig.joints.head = head
  eyes(head, rig.materials, [-.14, .08, -.33], [.14, .08, -.33], .075)
  rig.joints.legs = fourLegs(shell, rig.materials.coatLight, {
    x: .51,
    z: .48,
    y: -.26,
    length: .4,
    width: .21,
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
    coat: '#6e8e9c',
    dark: '#466775',
    light: '#9db4bb',
    gloss: .22,
  })
  const body = addPart(rig.root, 'elephant-body', 'sphere', rig.materials.coat, {
    position: [0, .15, .12],
    scale: [1.03, .84, 1.22],
  })
  const head = addPart(rig.root, 'elephant-head', 'sphere', rig.materials.coatLight, {
    position: [0, .34, -1.02],
    scale: [.78, .7, .72],
  })
  rig.joints.head = head
  rig.joints.ears = [-1, 1].map((side, index) => addPart(head, `elephant-ear-${index}`, 'sphere', rig.materials.coatDark, {
    position: [side * .64, .08, .08],
    scale: [.46, .58, .13],
    rotation: [0, 0, side * 8],
  }))
  eyes(head, rig.materials, [-.28, .15, -.55], [.28, .15, -.55], .1)
  let trunkParent = head
  for (let index = 0; index < 4; index += 1) {
    const pivot = new pc.Entity(`trunk-pivot-${index}`)
    pivot.setLocalPosition(0, index ? -.3 : -.4, index ? -.08 : -.5)
    trunkParent.addChild(pivot)
    addPart(pivot, `trunk-segment-${index}`, 'capsule', rig.materials.coatLight, {
      position: [0, -.18, 0],
      scale: [.14 - index * .015, .28, .14 - index * .015],
    })
    rig.joints.trunk.push(pivot)
    trunkParent = pivot
  }
  for (const x of [-.28, .28]) {
    addPart(head, `tusk-${x}`, 'cone', rig.materials.eyeWhite, {
      position: [x, -.36, -.48],
      scale: [.09, .38, .09],
      rotation: [70, 0, x > 0 ? -8 : 8],
    })
  }
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, {
    x: .66,
    z: .7,
    y: -.58,
    length: 1.12,
    width: .28,
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
    palette: { coat: '#8f6545', dark: '#3e3027', light: '#ead5b8', gloss: .34 },
    body: [.58, .62, .92],
    head: [.48, .5, .54],
    headPosition: [0, .44, -.76],
    muzzle: [.3, .22, .35],
    ear: 'floppy',
    leg: { x: .4, z: .5, y: -.45, length: .77, width: .14 },
    mass: 24,
  },
  horse: {
    palette: { coat: '#8e5539', dark: '#3b261c', light: '#c98b63', gloss: .3 },
    body: [.72, .72, 1.18],
    head: [.42, .58, .68],
    headPosition: [0, .9, -.94],
    muzzle: [.3, .28, .46],
    ear: 'upright',
    leg: { x: .49, z: .68, y: -.52, length: 1.2, width: .16, hoofMaterial: true },
    mass: 95,
  },
  beaver: {
    palette: { coat: '#76513a', dark: '#38271f', light: '#b08462', gloss: .38 },
    body: [.68, .56, .88],
    head: [.5, .48, .52],
    headPosition: [0, .25, -.72],
    muzzle: [.35, .22, .3],
    ear: 'round',
    leg: { x: .43, z: .46, y: -.38, length: .5, width: .18 },
    mass: 32,
  },
  fox: {
    palette: { coat: '#c76035', dark: '#3b2720', light: '#f1cfaa', gloss: .4 },
    body: [.55, .58, .96],
    head: [.47, .5, .56],
    headPosition: [0, .43, -.78],
    muzzle: [.28, .24, .4],
    ear: 'upright',
    leg: { x: .38, z: .52, y: -.43, length: .78, width: .13 },
    mass: 18,
  },
  ox: {
    palette: { coat: '#765746', dark: '#30241f', light: '#a98468', gloss: .25 },
    body: [.92, .82, 1.24],
    head: [.67, .62, .64],
    headPosition: [0, .42, -1.06],
    muzzle: [.48, .3, .4],
    ear: 'round',
    leg: { x: .59, z: .72, y: -.58, length: 1.05, width: .25, hoofMaterial: true },
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
    position: [0, -.14, -.48],
    scale: profile.muzzle,
  })
  addPart(head, `${resident.kind}-nose`, 'sphere', rig.materials.eye, {
    position: [0, -.1, -.78],
    scale: [.1, .075, .065],
  })
  eyes(head, rig.materials, [-.2, .1, -.43], [.2, .1, -.43], .1)

  rig.joints.ears = [-1, 1].map((side, index) => addPart(
    head,
    `${resident.kind}-ear-${index}`,
    profile.ear === 'round' || profile.ear === 'floppy' ? 'sphere' : 'cone',
    rig.materials.coatDark,
    {
      position: [side * .32, .39, -.02],
      scale: profile.ear === 'floppy' ? [.18, .3, .11] : profile.ear === 'round' ? [.18, .2, .11] : [.16, .34, .14],
      rotation: [0, 0, side * (profile.ear === 'floppy' ? 24 : 10)],
    },
  ))

  const legOptions = { ...profile.leg }
  if (legOptions.hoofMaterial) legOptions.hoofMaterial = rig.materials.eye
  rig.joints.legs = fourLegs(body, rig.materials.coatDark, legOptions)

  if (resident.kind === 'beaver') {
    const tail = addPart(body, 'beaver-paddle-tail', 'sphere', rig.materials.coatDark, {
      position: [0, -.22, 1.08],
      scale: [.42, .12, .78],
      rotation: [12, 0, 0],
    })
    rig.joints.tail = [tail]
    for (const x of [-.12, .12]) {
      addPart(head, `beaver-incisor-${x}`, 'box', rig.materials.eyeWhite, {
        position: [x, -.25, -.72],
        scale: [.12, .25, .07],
      })
    }
  } else if (resident.kind === 'fox') {
    rig.joints.tail = tailChain(body, rig.materials.coat, [[0, .1, .86], [0, .05, .34], [0, 0, .3]], .27)
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
  } else {
    rig.joints.tail = tailChain(body, rig.materials.coatDark, [[0, .08, 1], [0, .03, .24]], resident.kind === 'ox' ? .14 : .18)
  }

  if (resident.kind === 'ox') {
    for (const side of [-1, 1]) {
      addPart(head, `ox-horn-${side}`, 'cone', rig.materials.eyeWhite, {
        position: [side * .52, .3, -.02],
        scale: [.13, .52, .13],
        rotation: [0, 0, side * -62],
      })
    }
  }
  rig.accessoryAnchor = head
  rig.bodyHeight = resident.kind === 'horse' ? 2.25 : resident.kind === 'ox' ? 2.1 : 1.55
  rig.radius = resident.kind === 'horse' ? .7 : resident.kind === 'ox' ? .83 : .53
  rig.mass = profile.mass
  return rig
}

function buildBirdSpecies(resident, createMaterial) {
  const palettes = {
    peacock: { coat: '#19766b', dark: '#164a57', light: '#55b9a0', gloss: .48 },
    flamingo: { coat: '#e87d91', dark: '#a93e5c', light: '#f6b4bd', gloss: .38 },
    hawk: { coat: '#735640', dark: '#2f2925', light: '#d0b88c', gloss: .28 },
  }
  const rig = baseRig(resident, createMaterial, palettes[resident.kind])
  const tall = resident.kind === 'flamingo'
  const body = addPart(rig.root, `${resident.kind}-body`, 'sphere', rig.materials.coat, {
    position: [0, tall ? .72 : .18, 0],
    scale: tall ? [.5, .58, .75] : [.62, .78, .62],
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
    position: tall ? [0, .62, -.12] : [0, .72, -.16],
    scale: tall ? [.3, .31, .36] : [.5, .48, .48],
  })
  rig.joints.head = head
  eyes(head, rig.materials, [-.15, .08, -.34], [.15, .08, -.34], tall ? .07 : .09)
  addPart(head, `${resident.kind}-beak`, 'cone', resident.kind === 'flamingo' ? rig.materials.eye : rig.materials.accent, {
    position: [0, -.08, -.53],
    scale: tall ? [.11, .42, .11] : [.13, .31, .13],
    rotation: [90, 0, 0],
  })
  rig.joints.wings = [-1, 1].map((side, index) => {
    const pivot = new pc.Entity(`${resident.kind}-wing-pivot-${index}`)
    pivot.setLocalPosition(side * .45, tall ? .78 : .28, .02)
    body.addChild(pivot)
    addPart(pivot, `${resident.kind}-wing-${index}`, 'sphere', rig.materials.coatDark, {
      position: [side * .23, -.12, .08],
      scale: [.46, .14, .7],
      rotation: [0, 0, side * 12],
    })
    return pivot
  })
  rig.joints.legs = [-.2, .2].map((x, index) => {
    const leg = addPart(body, `${resident.kind}-leg-${index}`, 'cylinder', rig.materials.coatDark, {
      position: [x, tall ? -.48 : -.7, 0],
      scale: [tall ? .055 : .075, tall ? 1.05 : .34, tall ? .055 : .075],
    })
    addPart(leg, `${resident.kind}-foot-${index}`, 'sphere', rig.materials.coatDark, {
      position: [0, tall ? -.5 : -.43, -.12],
      scale: [.17, .06, .3],
    })
    return leg
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

export function createAnimalRig(resident, createMaterial) {
  if (resident.kind === 'pig') return buildPig(resident, createMaterial)
  if (resident.kind === 'cat') return buildCat(resident, createMaterial)
  if (resident.kind === 'owl') return buildOwl(resident, createMaterial)
  if (resident.kind === 'dragon') return buildDragon(resident, createMaterial)
  if (resident.kind === 'tortoise') return buildTortoise(resident, createMaterial)
  if (resident.kind === 'elephant') return buildElephant(resident, createMaterial)
  if (mammalProfiles[resident.kind]) return buildMammal(resident, createMaterial)
  if (['peacock', 'flamingo', 'hawk'].includes(resident.kind)) return buildBirdSpecies(resident, createMaterial)
  return buildPig(resident, createMaterial)
}

export function animateAnimalRig(actor, elapsed, delta) {
  const { rig } = actor
  const moving = actor.state === 'moving'
  const performance = actor.state === 'performing'
  const speed = moving ? actor.motionSpeed : 0
  actor.gaitClock += delta * (2.7 + speed * 1.8)
  const gait = Math.sin(actor.gaitClock)
  const breathe = Math.sin(elapsed * 2.2 + actor.phase)
  const stride = moving ? gait * 25 : breathe * 2.2

  rig.joints.legs.forEach((leg, index) => {
    const side = index % 2 === 0 ? 1 : -1
    leg.setLocalEulerAngles(stride * side, 0, 0)
  })
  rig.joints.wings.forEach((wing, index) => {
    const side = index ? -1 : 1
    const intensity = actor.resident.kind === 'owl' || moving ? 1 : .35
    wing.setLocalEulerAngles(0, 0, side * (18 + Math.sin(elapsed * 8.8 + index * .4) * 31 * intensity))
  })
  rig.joints.tail.forEach((segment, index) => {
    segment.setLocalEulerAngles(0, Math.sin(elapsed * 3.1 - index * .65 + actor.phase) * (moving ? 18 : 8), 0)
  })
  rig.joints.ears.forEach((ear, index) => {
    ear.setLocalEulerAngles(0, 0, Math.sin(elapsed * 1.7 + index * 1.9) * 4)
  })
  rig.joints.trunk.forEach((segment, index) => {
    segment.setLocalEulerAngles(Math.sin(elapsed * 2.3 - index * .6) * 11, 0, Math.cos(elapsed * 1.7 + index) * 5)
  })
  if (rig.joints.head) {
    rig.joints.head.setLocalEulerAngles(
      performance ? Math.sin(elapsed * 11) * 8 : breathe * 2.5,
      moving ? Math.sin(elapsed * 2.1) * 4 : Math.sin(elapsed * 1.1 + actor.phase) * 7,
      0,
    )
  }

  const visualY = moving ? Math.abs(gait) * .045 : breathe * .018
  rig.root.setLocalPosition(0, visualY, 0)
  if (!actor.manual || actor.manual.type !== 'spin') rig.root.setLocalEulerAngles(0, 0, 0)
}

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
