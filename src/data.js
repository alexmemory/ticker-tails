export const portfolio = {
  owner: 'Alex',
  value: 12840,
  dayChange: 1.83,
  stewardship: 78,
  goal: {
    name: 'First home fund',
    current: 12840,
    target: 20000,
    horizon: 'June 2028',
  },
}

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export const evolutionStage = weight => {
  if (weight < 5) return { key: 'starter', label: 'Starter', scale: 0.78 }
  if (weight < 15) return { key: 'growing', label: 'Growing', scale: 0.9 }
  if (weight < 30) return { key: 'thriving', label: 'Thriving', scale: 1.04 }
  return { key: 'landmark', label: 'Landmark', scale: 1.18 }
}

export const animalSimulation = (weight, dayChange) => {
  const activity = clamp(
    18 + weight * 1.4 + Math.max(dayChange, 0) * 5 - Math.max(-dayChange, 0) * 3,
    10,
    100,
  )

  return {
    stage: evolutionStage(weight),
    activity: Math.round(activity),
    vividness: clamp(0.68 + (dayChange + 10) / 20 * 0.52, 0.58, 1.2),
    speed: Math.round(clamp(3100 - activity * 19, 1050, 2900)),
    habitatScale: clamp(0.82 + weight / 45 * 0.38, 0.82, 1.2),
    priceState: dayChange >= 1 ? 'up' : dayChange <= -1 ? 'down' : 'flat',
    mood: dayChange >= 3 ? 'celebrating' : dayChange >= 1 ? 'bright' : dayChange <= -3 ? 'sheltering' : dayChange <= -1 ? 'quiet' : 'steady',
  }
}

export const dragonSimulation = (allocation, priceChange) => {
  const base = animalSimulation(allocation, priceChange)
  let sequence = priceChange >= 5
    ? ['flight', 'display', 'roam']
    : priceChange >= 1
      ? ['flight', 'roam', 'cuddle']
      : priceChange > -2
        ? ['roam', 'cuddle', 'idle']
        : ['cuddle', 'idle']

  if (allocation < 5) {
    sequence = priceChange >= 1 ? ['roam', 'cuddle'] : ['cuddle', 'idle']
  } else if (allocation >= 30 && priceChange > -2 && !sequence.includes('display')) {
    sequence = [sequence[0], 'display', ...sequence.slice(1)]
  }

  return {
    ...base,
    sequence,
    chipClusters: clamp(Math.ceil(allocation / 5), 1, 8),
  }
}

const rawHoldings = [
  {
    id: 'nvidia',
    ticker: 'NVDA',
    avatar: 'Emerald Tech-Dragon',
    shortName: 'Nori',
    kind: 'dragon',
    value: 2311,
    weight: 18,
    dayChange: 4.8,
    x: 82,
    y: 39,
    pen: { x: 1395, y: 284, width: 270, height: 175 },
    anchor: { x: 1518, y: 386 },
    station: { x: 1588, y: 344 },
    stationKind: 'chip nest',
    home: 'Compute Paddock',
    careAction: 'Cool the chip nest',
    need: 'Cooling check',
    behavior: 'Flaps between the workshop and its GPU pile, then curls around the warmest chips.',
    thesis: 'Accelerated computing demand remains the central investment case.',
    risk: 'High expectations make the position sensitive to small disappointments.',
    accent: '#35e788',
  },
  {
    id: 'apple',
    ticker: 'AAPL',
    avatar: 'Orchard Pig',
    shortName: 'Pippa',
    kind: 'pig',
    spriteColumn: 0,
    value: 2825,
    weight: 22,
    dayChange: 2.4,
    x: 20,
    y: 47,
    pen: { x: 95, y: 342, width: 290, height: 175 },
    anchor: { x: 246, y: 454 },
    station: { x: 153, y: 414 },
    stationKind: 'apple trough',
    home: 'Apple Orchard Pen',
    careAction: 'Fill the apple trough',
    need: 'Apple feed',
    behavior: 'Roots through the orchard pen, polishes its favorite apple, and naps by the white fence.',
    thesis: 'A durable consumer ecosystem with recurring services revenue.',
    risk: 'One company represents more than a fifth of the portfolio.',
    accent: '#f2a18e',
  },
  {
    id: 'microsoft',
    ticker: 'MSFT',
    avatar: 'Cloud-Crafter Owl',
    shortName: 'Azure',
    kind: 'owl',
    spriteColumn: 1,
    value: 1798,
    weight: 14,
    dayChange: 1.1,
    x: 50,
    y: 20,
    pen: { x: 738, y: 118, width: 220, height: 150 },
    anchor: { x: 849, y: 188 },
    station: { x: 850, y: 165 },
    stationKind: 'loft antenna',
    home: 'Cloud Barn Loft',
    careAction: 'Tune the loft antenna',
    need: 'Cloud scan',
    behavior: 'Perches above the barn, scans the valley, and circles the silo when cloud activity rises.',
    thesis: 'Cloud infrastructure and software distribution reinforce one another.',
    risk: 'Its valuation assumes continued execution across several large businesses.',
    accent: '#71bfea',
  },
  {
    id: 'tesla',
    ticker: 'TSLA',
    avatar: 'Cyber Barn Cat',
    shortName: 'Volt',
    kind: 'cat',
    spriteColumn: 2,
    value: 1027,
    weight: 8,
    dayChange: -1.2,
    x: 30,
    y: 34,
    pen: { x: 421, y: 238, width: 230, height: 145 },
    anchor: { x: 522, y: 325 },
    station: { x: 486, y: 298 },
    stationKind: 'charger',
    home: 'Solar Charging Yard',
    careAction: 'Charge the collar',
    need: 'Battery low',
    behavior: 'Stalks sunbeams under the solar roof, pounces on cable shadows, and returns to its charger.',
    thesis: 'A long-duration bet on manufacturing scale and transportation technology.',
    risk: 'The story depends on execution across several uncertain businesses.',
    accent: '#ef6c54',
  },
  {
    id: 'berkshire',
    ticker: 'BRK.B',
    avatar: 'Mindful Tortoise',
    shortName: 'Berk',
    kind: 'tortoise',
    spriteColumn: 3,
    value: 2054,
    weight: 16,
    dayChange: 0.3,
    x: 67,
    y: 41,
    pen: { x: 1083, y: 294, width: 273, height: 172 },
    anchor: { x: 1194, y: 399 },
    station: { x: 1260, y: 384 },
    stationKind: 'clover stone',
    home: 'Stone Value Pasture',
    careAction: 'Refresh the clover',
    need: 'Clover check',
    behavior: 'Takes the long route around the stone wall and rests through noisy market weather.',
    thesis: 'Diverse operating companies and patient capital allocation provide resilience.',
    risk: 'Size can limit future growth and results still depend on capital allocation.',
    accent: '#a8c45b',
  },
  {
    id: 'bonds',
    ticker: 'BND',
    avatar: 'Anchor Elephant',
    shortName: 'Harbor',
    kind: 'elephant',
    spriteColumn: 4,
    value: 1541,
    weight: 12,
    dayChange: 0.1,
    x: 76,
    y: 63,
    pen: { x: 1287, y: 466, width: 325, height: 190 },
    anchor: { x: 1480, y: 583 },
    station: { x: 1346, y: 538 },
    stationKind: 'water trough',
    home: 'Anchor Stable',
    careAction: 'Fill the water trough',
    need: 'Fresh water',
    behavior: 'Walks between the stable and pond, then sprays a calming mist across the lower farm.',
    thesis: 'Broad bond exposure can counterbalance equity volatility.',
    risk: 'Bond prices can fall when rates rise, and stability is not a guarantee.',
    accent: '#8faec6',
  },
]

export const holdings = rawHoldings.map(holding => ({
  ...holding,
  farmId: 'alex',
  tradable: true,
  stage: evolutionStage(holding.weight),
  simulation: animalSimulation(holding.weight, holding.dayChange),
}))

export const cashReserve = {
  id: 'cash',
  ticker: 'CASH',
  avatar: 'Treasury Clover',
  shortName: 'Clover',
  kind: 'crop',
  value: 1284,
  weight: 10,
  dayChange: 0.1,
  x: 48,
  y: 76,
  pen: { x: 351, y: 628, width: 760, height: 188 },
  anchor: { x: 810, y: 743 },
  station: { x: 876, y: 700 },
  stationKind: 'irrigation pump',
  home: 'Liquidity Field',
  careAction: 'Water the clover rows',
  need: 'Irrigation',
  behavior: 'Clover rows sway gently and send up new leaves as the reserve grows.',
  thesis: 'A liquid reserve can fund near-term needs and reduce forced selling.',
  risk: 'Cash may lose purchasing power and can lag productive assets over time.',
  accent: '#7ec86f',
  farmId: 'alex',
  tradable: true,
  stage: evolutionStage(10),
  simulation: animalSimulation(10, 0.1),
}

const neighborSlots = [
  {
    pen: { x: 110, y: 310, width: 275, height: 175 },
    anchor: { x: 248, y: 410 },
    station: { x: 160, y: 370 },
  },
  {
    pen: { x: 430, y: 225, width: 265, height: 170 },
    anchor: { x: 560, y: 330 },
    station: { x: 630, y: 282 },
  },
  {
    pen: { x: 760, y: 120, width: 250, height: 170 },
    anchor: { x: 880, y: 225 },
    station: { x: 940, y: 170 },
  },
  {
    pen: { x: 1070, y: 280, width: 275, height: 180 },
    anchor: { x: 1205, y: 390 },
    station: { x: 1280, y: 335 },
  },
  {
    pen: { x: 1370, y: 400, width: 300, height: 195 },
    anchor: { x: 1510, y: 520 },
    station: { x: 1435, y: 470 },
  },
]

const neighborSpecs = [
  {
    id: 'alphabet',
    farmId: 'maya',
    ticker: 'GOOGL',
    avatar: 'Search & Shepherd Collie',
    shortName: 'Query',
    kind: 'dog',
    value: 2460,
    weight: 24,
    dayChange: 1.7,
    home: 'Search Meadow',
    careAction: 'Hide a search toy',
    need: 'Discovery exercise',
    stationKind: 'search course',
    behavior: 'Tracks query trails through the meadow, pauses at branching paths, and returns with the most useful result.',
    thesis: 'Search, advertising, cloud infrastructure, and AI research form a broad technology platform.',
    risk: 'Regulatory pressure and changing discovery behavior could weaken established distribution advantages.',
    accent: '#4d8df7',
  },
  {
    id: 'amazon',
    farmId: 'maya',
    ticker: 'AMZN',
    avatar: 'Delivery Draft Horse',
    shortName: 'Prime',
    kind: 'horse',
    value: 2200,
    weight: 21,
    dayChange: 2.1,
    home: 'Commerce Stable',
    careAction: 'Load the delivery cart',
    need: 'Route preparation',
    stationKind: 'delivery depot',
    behavior: 'Pulls a parcel cart between the warehouse and cloud stable, changing pace as orders accumulate.',
    thesis: 'Commerce scale, logistics infrastructure, and cloud computing reinforce a large operating ecosystem.',
    risk: 'Large investment requirements and retail margins can amplify execution risk.',
    accent: '#f0a33b',
  },
  {
    id: 'meta',
    farmId: 'maya',
    ticker: 'META',
    avatar: 'Social Signal Peacock',
    shortName: 'Reel',
    kind: 'peacock',
    value: 1850,
    weight: 18,
    dayChange: -0.6,
    home: 'Connection Courtyard',
    careAction: 'Polish the signal mirrors',
    need: 'Community check',
    stationKind: 'signal mirror',
    behavior: 'Fans its display when engagement rises and patrols the courtyard between community gathering points.',
    thesis: 'Large social networks and advertising tools provide scale for new AI-enabled products.',
    risk: 'Attention shifts, regulation, and heavy platform investment can change returns quickly.',
    accent: '#6b76e8',
  },
  {
    id: 'broadcom',
    farmId: 'maya',
    ticker: 'AVGO',
    avatar: 'Infrastructure Beaver',
    shortName: 'Switch',
    kind: 'beaver',
    value: 1640,
    weight: 16,
    dayChange: 3.2,
    home: 'Network Millpond',
    careAction: 'Reinforce the data dam',
    need: 'Network inspection',
    stationKind: 'data dam',
    behavior: 'Carries polished silicon branches to a small dam and keeps the farm’s information channels flowing.',
    thesis: 'Semiconductor and infrastructure software exposure participates in networking and AI build-outs.',
    risk: 'Customer concentration, integration, and semiconductor cycles can create uneven results.',
    accent: '#d56f55',
  },
  {
    id: 'salesforce',
    farmId: 'maya',
    ticker: 'CRM',
    avatar: 'Cloud Cotton',
    shortName: 'Nimbus',
    kind: 'crop',
    cropType: 'cotton',
    value: 1230,
    weight: 12,
    dayChange: 0.8,
    home: 'Customer Cloud Field',
    careAction: 'Irrigate the cloud rows',
    need: 'Customer tending',
    stationKind: 'cloud irrigation',
    behavior: 'Soft cotton bolls brighten as recurring customer relationships deepen across the field.',
    thesis: 'A large installed base supports recurring enterprise software revenue and platform expansion.',
    risk: 'Competition and slower enterprise spending can pressure growth.',
    accent: '#64a7df',
  },
  {
    id: 'amd',
    farmId: 'jordan',
    ticker: 'AMD',
    avatar: 'Ruby Compute Fox',
    shortName: 'Ryzen',
    kind: 'fox',
    value: 2380,
    weight: 23,
    dayChange: 3.6,
    home: 'Ruby Processor Run',
    careAction: 'Cool the processor den',
    need: 'Thermal check',
    stationKind: 'processor den',
    behavior: 'Darts between CPU stones and the accelerator den, then listens for changes in the compute trail.',
    thesis: 'Competitive CPUs and accelerators offer exposure to data-center and client computing demand.',
    risk: 'Product cycles and intense competition can produce sharp changes in market share.',
    accent: '#df4c45',
  },
  {
    id: 'oracle',
    farmId: 'jordan',
    ticker: 'ORCL',
    avatar: 'Database Ox',
    shortName: 'Ledger',
    kind: 'ox',
    value: 2050,
    weight: 20,
    dayChange: 1.2,
    home: 'Database Terrace',
    careAction: 'Turn the record wheel',
    need: 'Archive rotation',
    stationKind: 'record wheel',
    behavior: 'Moves steadily around a stone data wheel and stores each completed pass in the archive barn.',
    thesis: 'Database software and cloud infrastructure combine recurring relationships with infrastructure growth.',
    risk: 'Cloud competition and large capital commitments can affect the pace of returns.',
    accent: '#d96852',
  },
  {
    id: 'netflix',
    farmId: 'jordan',
    ticker: 'NFLX',
    avatar: 'Cinema Flamingo',
    shortName: 'Flick',
    kind: 'flamingo',
    value: 1710,
    weight: 17,
    dayChange: 2.4,
    home: 'Streaming Lagoon',
    careAction: 'Refresh the story pool',
    need: 'Programming cycle',
    stationKind: 'story pool',
    behavior: 'Wades through the lagoon’s story reels and performs a bright dance when viewing demand rises.',
    thesis: 'Global streaming scale supports content investment, advertising, and membership monetization.',
    risk: 'Content costs, competition, and shifting consumer preferences remain material.',
    accent: '#eb5265',
  },
  {
    id: 'palantir',
    farmId: 'jordan',
    ticker: 'PLTR',
    avatar: 'Sentinel Analytics Hawk',
    shortName: 'AIP',
    kind: 'hawk',
    value: 1420,
    weight: 14,
    dayChange: 4.1,
    home: 'Analytics Watchtower',
    careAction: 'Tune the watchtower',
    need: 'Signal analysis',
    stationKind: 'watchtower',
    behavior: 'Circles above the watchtower, dives toward new signals, and returns to assemble a clearer operational picture.',
    thesis: 'Data integration and AI deployment tools address demanding government and commercial workflows.',
    risk: 'A high valuation and concentrated contracts can magnify disappointments.',
    accent: '#8d93a2',
  },
  {
    id: 'qualcomm',
    farmId: 'jordan',
    ticker: 'QCOM',
    avatar: 'Signal Corn',
    shortName: 'Snap',
    kind: 'crop',
    cropType: 'corn',
    value: 980,
    weight: 10,
    dayChange: -0.3,
    home: 'Wireless Cornfield',
    careAction: 'Tune the irrigation mast',
    need: 'Wireless coverage',
    stationKind: 'signal mast',
    behavior: 'Rows align toward the strongest signal mast and ripple as wireless demand crosses the field.',
    thesis: 'Wireless intellectual property and device platforms participate in connectivity across several markets.',
    risk: 'Handset cycles, customer concentration, and licensing disputes can affect results.',
    accent: '#d9b84a',
  },
]

export const neighborHoldings = neighborSpecs.map((resident, index) => {
  const slot = neighborSlots[index % neighborSlots.length]
  return {
    ...resident,
    ...slot,
    x: slot.anchor.x / 1774 * 100,
    y: slot.anchor.y / 887 * 100,
    tradable: false,
    stage: evolutionStage(resident.weight),
    simulation: animalSimulation(resident.weight, resident.dayChange),
  }
})

export const farmResidents = [...holdings, cashReserve, ...neighborHoldings]

export const neighborFarms = [
  { id: 'maya', owner: 'Maya', name: 'Innovation Homestead', centerX: -320, centerZ: -4 },
  { id: 'jordan', owner: 'Jordan', name: 'Growth Acres', centerX: 320, centerZ: -4 },
  { id: 'alex', owner: 'Alex', name: 'Ticker Tails Farm', centerX: 0, centerZ: -10 },
]

export const weatherModes = [
  { id: 'sunny', label: 'Market sun', icon: '☀', note: 'Portfolio up' },
  { id: 'overcast', label: 'Soft pullback', icon: '☁', note: 'Portfolio cooling' },
  { id: 'windy', label: 'Volatility wind', icon: '≋', note: 'Prices moving' },
]

export const deriveWeather = factors => {
  const rates = clamp(Number(factors.rates), 0, 100)
  const inflation = clamp(Number(factors.inflation), 0, 100)
  const geopolitics = clamp(Number(factors.geopolitics), 0, 100)
  const sentiment = clamp(Number(factors.sentiment), 0, 100)
  const stress = Math.round(rates * 0.24 + inflation * 0.24 + geopolitics * 0.3 + (100 - sentiment) * 0.22)

  let label = 'Balanced growing weather'
  let icon = '☀'
  if (geopolitics >= 68) {
    label = 'Geopolitical storm front'
    icon = '⛈'
  } else if (inflation >= 68) {
    label = 'Inflation heat wave'
    icon = '♨'
  } else if (rates >= 68) {
    label = 'High-rate headwind'
    icon = '≋'
  } else if (sentiment <= 32) {
    label = 'Sentiment fog'
    icon = '☁'
  } else if (sentiment >= 72 && stress < 45) {
    label = 'Risk-on sunshine'
    icon = '☀'
  }

  return {
    rates,
    inflation,
    geopolitics,
    sentiment,
    stress,
    label,
    icon,
    rain: geopolitics >= 55 || sentiment <= 25,
    lightning: geopolitics >= 74,
    wind: Math.round(clamp(rates * 0.55 + inflation * 0.25 + geopolitics * 0.2, 0, 100)),
    warmth: inflation,
    brightness: clamp(1.08 - stress / 190, 0.62, 1.05),
    animalPace: clamp(0.72 + sentiment / 170 - stress / 320, 0.55, 1.22),
  }
}

export const applySimulatedTrade = (positions, id, side, requestedAmount) => {
  const amount = Math.max(0, Number(requestedAmount) || 0)
  const next = { ...positions }
  if (!Object.hasOwn(next, id) || id === 'cash') {
    return { positions: next, executed: 0, error: 'Choose an invested holding.' }
  }

  if (side === 'buy') {
    const executed = Math.min(amount, Math.max(0, next.cash || 0))
    if (!executed) return { positions: next, executed: 0, error: 'Not enough simulated cash.' }
    next.cash -= executed
    next[id] += executed
    return { positions: next, executed, error: null }
  }

  if (side === 'sell') {
    const executed = Math.min(amount, Math.max(0, next[id] || 0))
    if (!executed) return { positions: next, executed: 0, error: 'There is nothing left to sell.' }
    next[id] -= executed
    next.cash = (next.cash || 0) + executed
    return { positions: next, executed, error: null }
  }

  return { positions: next, executed: 0, error: 'Unknown simulated trade.' }
}

export const allocationGroups = [
  { label: 'Tech & Growth', value: 62 },
  { label: 'Traditional & Value', value: 28 },
  { label: 'Cash reserve', value: 10 },
]

export const optionExpedition = {
  underlying: 'NVDA',
  label: 'Sep 18, 2026 · $195 call',
  premium: 6.2,
  contractCost: 620,
  breakeven: 201.2,
  expiration: 'September 18, 2026',
  days: 49,
}

export const formatMoney = (value, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)

export const signedPercent = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}%`
export const getHolding = id => farmResidents.find(holding => holding.id === id)
