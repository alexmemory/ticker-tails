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

export const evolutionStage = weight => {
  if (weight < 5) return { key: 'basic', label: 'Basic', scale: 0.82 }
  if (weight < 15) return { key: 'emergent', label: 'Emergent', scale: 0.96 }
  if (weight < 30) return { key: 'advanced', label: 'Advanced', scale: 1.12 }
  return { key: 'peak', label: 'Peak', scale: 1.28 }
}

export const gravityProfile = pe => {
  if (pe == null) return { key: 'anchored', label: 'Anchored', lift: 0 }
  if (pe >= 50) return { key: 'ultralight', label: 'Ultra-low gravity', lift: -34 }
  if (pe >= 35) return { key: 'light', label: 'Low gravity', lift: -24 }
  if (pe >= 25) return { key: 'balanced', label: 'Balanced gravity', lift: -11 }
  return { key: 'heavy', label: 'High gravity', lift: 4 }
}

export const energyProfile = growth => {
  if (growth >= 20) return { key: 'stardust', label: 'Stardust propulsion' }
  if (growth >= 10) return { key: 'spark', label: 'Kinetic sparks' }
  return { key: 'bloom', label: 'Flower trail' }
}

export const performanceProfile = dayChange => {
  if (dayChange >= 2) return { key: 'surging', label: 'Surging', displacement: -12 }
  if (dayChange > 0) return { key: 'positive', label: 'Buoyant', displacement: -5 }
  if (dayChange <= -2) return { key: 'slumped', label: 'Sheltering', displacement: 15 }
  return { key: 'negative', label: 'Grounded', displacement: 8 }
}

const rawHoldings = [
  {
    id: 'nvidia',
    ticker: 'NVDA',
    avatar: 'Emerald Tech-Dragon',
    shortName: 'Tech-Dragon',
    creature: '🐉',
    type: 'dragon',
    sector: 'Tech & Growth',
    value: 2311,
    weight: 18,
    pe: 44,
    growth: 28,
    dayChange: 4.8,
    position: 'nvda',
    vibe: 'Unstoppable momentum, computing power, and the AI revolution.',
    visual: 'A sleek dragon with etched silicon-wafer scales, an internal emerald glow, and a tiny black leather jacket.',
    behaviors: [
      'Sleeps on a nest of glowing microchips and GPUs.',
      'Breathes pixelated AI fire when the stock surges.',
      'Takes a computational nap with a slow neon pulse during market lulls.',
    ],
    thesis: 'Demand for accelerated computing remains the central investment case.',
    risk: 'High expectations make the position sensitive to small disappointments.',
    hasOption: true,
  },
  {
    id: 'apple',
    ticker: 'AAPL',
    avatar: 'Walled-Garden Swan',
    shortName: 'Titanium Swan',
    creature: '🦢',
    type: 'swan',
    sector: 'Tech & Growth',
    value: 2825,
    weight: 22,
    pe: 32,
    growth: 10,
    dayChange: 2.4,
    position: 'aapl',
    vibe: 'Sleek, elite, pristine, and protective of a curated ecosystem.',
    visual: 'An elegant futuristic swan with brushed-titanium feathers and a precise glowing force field.',
    behaviors: [
      'Meticulously aligns every titanium feather.',
      'Projects a walled-garden force field around its nest.',
      'Refuses generic treats and eats only premium organic apples.',
    ],
    thesis: 'A durable consumer ecosystem with recurring services revenue.',
    risk: 'One company represents more than a fifth of the portfolio.',
  },
  {
    id: 'microsoft',
    ticker: 'MSFT',
    avatar: 'Cloud-Crafter Owl',
    shortName: 'Cloud Owl',
    creature: '🦉',
    type: 'owl',
    sector: 'Tech & Growth',
    value: 1798,
    weight: 14,
    pe: 36,
    growth: 15,
    dayChange: 1.1,
    position: 'msft',
    vibe: 'Wise, structured, enterprise-minded, and at home in the cloud.',
    visual: 'A spectacled owl with cirrus-cloud feathers and a utility belt filled with tiny enterprise tools.',
    behaviors: [
      'Organizes nearby avatars into neat color-coded rows.',
      'Rotates its head to scan the cloud for threats.',
      'Flies toward the user’s finger to co-pilot when tapped.',
    ],
    thesis: 'Cloud infrastructure and software distribution reinforce one another.',
    risk: 'Its valuation assumes continued execution across several large businesses.',
  },
  {
    id: 'tesla',
    ticker: 'TSLA',
    avatar: 'Cyber-Hound',
    shortName: 'Cyber-Hound',
    creature: '🐕',
    type: 'hound',
    sector: 'Tech & Growth',
    value: 1027,
    weight: 8,
    pe: 72,
    growth: 20,
    dayChange: -1.2,
    position: 'tsla',
    vibe: 'Fast, autonomous, highly engineered, and occasionally unpredictable.',
    visual: 'An angular stainless-steel greyhound with red LED eyes and a charging-cable tail.',
    behaviors: [
      'Zips along the biome edges in autonomous mode on green days.',
      'Plays fetch with a miniature humanoid robot.',
      'Backs perfectly into a glowing charger to sleep.',
    ],
    thesis: 'A long-duration bet on manufacturing scale and transportation technology.',
    risk: 'The story depends on execution across several uncertain businesses.',
  },
  {
    id: 'berkshire',
    ticker: 'BRK.B',
    avatar: 'Mindful Tortoise',
    shortName: 'Tortoise',
    creature: '🐢',
    type: 'tortoise',
    sector: 'Traditional & Value',
    value: 2054,
    weight: 16,
    pe: 24,
    growth: 6,
    dayChange: 0.3,
    position: 'brkb',
    vibe: 'Unshakable patience, long-term value, and indifference to short-term noise.',
    visual: 'An ancient tortoise whose shell holds a moving train, a brick house, and a tiny ice-cream shop.',
    behaviors: [
      'Moves slowly while high-growth avatars dart overhead.',
      'Munches old-fashioned paper dividends.',
      'Naps through market storms inside its industrial shell.',
    ],
    thesis: 'Diverse operating companies and patient capital allocation provide resilience.',
    risk: 'Size can limit future growth and results still depend on capital allocation.',
  },
  {
    id: 'bonds',
    ticker: 'BND',
    avatar: 'Anchor Elephant',
    shortName: 'Anchor Elephant',
    creature: '🐘',
    type: 'elephant',
    sector: 'Traditional & Value',
    value: 1541,
    weight: 12,
    pe: null,
    growth: 3,
    dayChange: 0.1,
    position: 'bnd',
    vibe: 'Ultimate stability, immense weight, and a calm portfolio foundation.',
    visual: 'A gentle elephant wearing a harness of government bonds and glowing with a soft aura of safety.',
    behaviors: [
      'Acts as a literal anchor near the bottom of the biome.',
      'Sprays calming mist over frantic growth creatures.',
      'Sleeps against a giant immovable block of stone.',
    ],
    thesis: 'Broad bond exposure can counterbalance equity volatility.',
    risk: 'Bond prices can fall when rates rise, and stability is not a guarantee.',
  },
]

export const holdings = rawHoldings.map(holding => ({
  ...holding,
  stage: evolutionStage(holding.weight),
  gravity: gravityProfile(holding.pe),
  energy: energyProfile(holding.growth),
  performance: performanceProfile(holding.dayChange),
}))

export const cashReserve = { id: 'cash', ticker: 'CASH', value: 1284, weight: 10, label: 'Liquidity pool' }

export const avatarCatalog = [
  {
    ticker: 'GOOG',
    avatar: 'Prismatic Octopus',
    creature: '🐙',
    sector: 'Tech & Growth',
    vibe: 'Inquisitive, omnipresent, and highly intelligent.',
    visual: 'A brilliant octopus that cycles through prismatic primary colors and juggles search, video, and mobility artifacts.',
    behaviors: ['Juggles ecosystem tools.', 'Squirts broken search links when startled.', 'Dances in tiny VR goggles on strong days.'],
  },
  {
    ticker: 'AMZN',
    avatar: 'Infinite Kangaroo',
    creature: '🦘',
    sector: 'Tech & Growth',
    vibe: 'Boundless energy, logistics scale, and a bottomless cloud pouch.',
    visual: 'A sturdy kangaroo in a high-tech blue harness with a glowing pouch that evolves from backpack to drone-assisted logistics hub.',
    behaviors: ['Pulls surprising items from its pouch.', 'Leaves cardboard parcels after purchases.', 'Gains robotic arms at advanced stages.'],
  },
  {
    ticker: 'META',
    avatar: 'Omniscient Chameleon',
    creature: '🦎',
    sector: 'Tech & Growth',
    vibe: 'Hyper-adaptable, AI-focused, and constantly observing.',
    visual: 'A blue-purple chameleon in smart glasses whose scales reflect the day’s movement.',
    behaviors: ['Catches data bugs.', 'Projects AI holograms.', 'Unrolls a perfectly targeted ad scroll when tapped.'],
  },
  {
    ticker: 'NFLX',
    avatar: 'Binge-Watching Red Panda',
    creature: '🐼',
    sector: 'Tech & Growth',
    vibe: 'Cozy, captivating, and built for mass entertainment.',
    visual: 'A bright-red panda with popcorn, a remote, and 3D glasses perched on its head.',
    behaviors: ['Builds a pillow fort.', 'Rolls out a red carpet on surges.', 'Falls asleep beneath an “Are you still watching?” bubble.'],
  },
  {
    ticker: 'JPM',
    avatar: 'Fortress Griffin',
    creature: '🦅',
    sector: 'Traditional & Value',
    vibe: 'Legacy, structural importance, and fortress-like resilience.',
    visual: 'A marble-and-gold griffin resting on an immense steel vault door.',
    behaviors: ['Protects its nest with stone wings.', 'Flips a pristine gold coin.', 'Braces rather than panics during volatile weather.'],
  },
  {
    ticker: 'V',
    avatar: 'Network Weaver-Bird',
    creature: '🐦',
    sector: 'Traditional & Value',
    vibe: 'Constant motion, global reach, and invisible payment infrastructure.',
    visual: 'A nimble bird woven from gold and navy fiber-optic threads.',
    behaviors: ['Connects avatars with glowing payment webs.', 'Drops receipts that dissolve into sparkles.', 'Chirps like a contactless terminal.'],
  },
]

export const physicsRules = [
  {
    id: 'allocation',
    icon: '◌',
    metric: 'Allocation size',
    title: 'Habitat & evolution',
    rule: 'Portfolio weight controls habitat footprint and evolutionary stage.',
    range: '0–5% Basic · 5–15% Emergent · 15–30% Advanced · 30%+ Peak',
  },
  {
    id: 'gravity',
    icon: '↓',
    metric: 'P/E ratio',
    title: 'Gravity & density',
    rule: 'Higher valuations create low gravity; value-oriented avatars feel dense and grounded.',
    range: 'High P/E floats · Low P/E leaves deep footprints',
  },
  {
    id: 'energy',
    icon: '✦',
    metric: 'Projected growth',
    title: 'Kinetic energy',
    rule: 'Growth estimates control motion intensity and the trail an avatar leaves behind.',
    range: 'High growth: stardust · Steady growth: flowers',
  },
  {
    id: 'performance',
    icon: '↗',
    metric: 'Daily performance',
    title: 'Daily physics',
    rule: 'Positive movement lifts and energizes; negative movement grounds and slows.',
    range: 'Green: buoyant · Red: sheltered near the ground',
  },
]

export const weatherModes = [
  { id: 'profit', label: 'Golden hour', icon: '☀', note: 'Profitable ecosystem' },
  { id: 'loss', label: 'Overcast', icon: '☂', note: 'Portfolio losses' },
  { id: 'volatility', label: 'VIX wind', icon: '≋', note: 'High volatility' },
]

export const allocationGroups = [
  { label: 'Tech & Growth', value: 62, tone: 'growth' },
  { label: 'Traditional & Value', value: 28, tone: 'value' },
  { label: 'Cash reserve', value: 10, tone: 'cash' },
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
export const getHolding = id => holdings.find(holding => holding.id === id)
