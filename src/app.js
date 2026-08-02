import {
  applySimulatedTrade,
  deriveWeather,
  farmResidents,
  formatMoney,
  getHolding,
  neighborFarms,
  portfolio,
  signedPercent,
} from './data.js'
import { PlayCanvasFarm } from './playcanvas-farm.js'

const root = document.querySelector('#root')
const storageKey = 'ticker-tails-engine-v3'
const animalResidents = farmResidents.filter(resident => resident.kind !== 'crop')
const ownedResidents = farmResidents.filter(resident => resident.farmId === 'alex')

const shopItems = [
  { id: 'joy-treat', type: 'trick', trick: 'spin', name: 'Joyberry Treat', detail: 'Teaches a happy spin', icon: '●', price: 45 },
  { id: 'spring-treat', type: 'trick', trick: 'jump', name: 'Spring Oat Biscuit', detail: 'Teaches a joyful hop', icon: '✦', price: 65 },
  { id: 'bandana', type: 'skin', name: 'Harvest Bandana', detail: 'Adds red farm swag', icon: '◆', price: 120 },
  { id: 'raincoat', type: 'skin', name: 'Market Raincoat', detail: 'Golden storm-ready coat', icon: '☂', price: 180 },
  { id: 'aurora', type: 'skin', name: 'Aurora Harness', detail: 'A violet risk-on glow', icon: '◇', price: 240 },
]

const defaultProgress = {
  positions: Object.fromEntries(farmResidents.map(resident => [resident.id, resident.value])),
  weather: { rates: 46, inflation: 39, geopolitics: 28, sentiment: 71 },
  tended: {},
  coins: 420,
  cosmetics: {},
  transactions: [],
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return {
      ...defaultProgress,
      ...saved,
      positions: { ...defaultProgress.positions, ...(saved.positions || {}) },
      weather: { ...defaultProgress.weather, ...(saved.weather || {}) },
      tended: { ...defaultProgress.tended, ...(saved.tended || {}) },
      cosmetics: { ...defaultProgress.cosmetics, ...(saved.cosmetics || {}) },
      transactions: Array.isArray(saved.transactions) ? saved.transactions : [],
    }
  } catch {
    return structuredClone(defaultProgress)
  }
}

let progress = loadProgress()
let selectedId = null
let activePanel = null
let tradeAmount = 100
let pendingSell = false
let toastTimer
let farmScene

const saveProgress = () => localStorage.setItem(storageKey, JSON.stringify(progress))
const totalValue = () => ownedResidents.reduce((sum, resident) => sum + (progress.positions[resident.id] || 0), 0)
const holdingAllocation = id => {
  const resident = getHolding(id)
  const farmValue = farmResidents
    .filter(entry => entry.farmId === resident?.farmId)
    .reduce((sum, entry) => sum + (progress.positions[entry.id] || 0), 0)
  return farmValue ? (progress.positions[id] || 0) / farmValue * 100 : 0
}
const cosmeticState = id => progress.cosmetics[id] || { owned: [], skin: null, tricks: [] }
const haptic = duration => navigator.vibrate?.(duration)

function residentStatus(resident) {
  const value = progress.positions[resident.id]
  const allocation = holdingAllocation(resident.id)
  if (value === 0) return 'Position sold · resident resting off-farm'
  if (progress.tended[resident.id]) return `Tended today · ${allocation.toFixed(1)}% of farm`
  return `${resident.need} · ${allocation.toFixed(1)}% of farm`
}

function shellMarkup() {
  return `<div class="engine-app">
    <header class="game-header">
      <div class="brand-lockup">
        <span class="brand-mark"><i></i><b>TT</b></span>
        <span><strong>Ticker Tails</strong><small>Alex’s living investment farm</small></span>
      </div>
      <div class="portfolio-pulse">
        <span><small>ILLUSTRATIVE PORTFOLIO</small><strong id="portfolio-value">${formatMoney(totalValue())}</strong></span>
        <b>${signedPercent(portfolio.dayChange)}</b>
      </div>
      <nav class="header-actions" aria-label="Farm systems">
        <button data-action="open-weather" class="climate-button"><i id="weather-icon">☀</i><span><strong>Market weather</strong><small id="weather-label">Balanced growing weather</small></span></button>
        <button data-action="open-shop" class="shop-button"><i>◇</i><span><strong>Treats &amp; swag</strong><small><b id="coin-balance">${progress.coins}</b> virtual acorns</small></span></button>
      </nav>
    </header>

    <main class="game-stage">
      <canvas id="game-canvas" aria-label="Interactive PlayCanvas investment farm scene"></canvas>

      <nav class="farm-nav" aria-label="Farm camera shortcuts">
        ${neighborFarms.map(farm => {
          const residentCount = farmResidents.filter(resident => resident.farmId === farm.id).length
          const label = farm.id === 'alex' ? 'My farm' : farm.owner
          const descriptor = farm.id === 'maya' ? 'Innovation' : farm.id === 'jordan' ? 'Growth' : 'Ticker Tails'
          return `<button data-action="jump-farm" data-world-x="${farm.centerX}" data-world-z="${farm.centerZ}" class="${farm.id === 'alex' ? 'active' : ''}" aria-label="${label}, ${farm.name}, ${residentCount} residents">
            <i>${farm.id === 'alex' ? '⌂' : '♧'}</i><span><strong>${label}</strong><small>${descriptor} · ${residentCount}</small></span>
          </button>`
        }).join('')}
      </nav>

      <div class="climate-pill">
        <i id="climate-pill-icon">☀</i>
        <span><small>MACRO CLIMATE</small><strong id="climate-pill-label">Balanced growing weather</strong></span>
        <b id="climate-stress">32</b>
      </div>

      <section class="tending-card" id="tending-card" aria-label="Farm round progress"></section>

      <div class="camera-tools" aria-label="Map controls">
        <button data-action="zoom-in" aria-label="Zoom in">+</button>
        <button data-action="home" aria-label="Center my farm">⌂</button>
        <button data-action="zoom-out" aria-label="Zoom out">−</button>
      </div>

      <div class="engine-badge"><i></i><span><strong>PLAYCANVAS + AMMO PHYSICS</strong><small>High-density creatures · physical 3D farm & nameplates</small></span></div>
      <div id="holding-drawer" class="holding-drawer" aria-live="polite"></div>
      <div id="weather-panel" class="system-panel"></div>
      <div id="shop-panel" class="system-panel"></div>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
    </main>
  </div>`
}

function tendingMarkup() {
  const tendedCount = ownedResidents.filter(resident => progress.tended[resident.id]).length
  const nextResident = ownedResidents.find(resident => !progress.tended[resident.id])
  const complete = tendedCount === ownedResidents.length
  return `<span class="quest-icon">${complete ? '✓' : '☀'}</span>
    <span>
      <small>${complete ? 'ROUND COMPLETE' : 'TODAY’S FARM ROUND'}</small>
      <strong>${complete ? 'Every holding is cared for' : `${tendedCount} of ${ownedResidents.length} tended`}</strong>
      <em>${complete ? '+30 stewardship' : `Next: ${nextResident.need} at ${nextResident.ticker}`}</em>
    </span>
    <i><b style="width:${tendedCount / ownedResidents.length * 100}%"></b></i>`
}

function drawerMarkup() {
  if (!selectedId) return ''
  const resident = getHolding(selectedId)
  const value = progress.positions[resident.id]
  const allocation = holdingAllocation(resident.id)
  const cosmetics = cosmeticState(resident.id)
  const isCash = resident.id === 'cash'
  const lastTrades = progress.transactions.filter(transaction => transaction.id === resident.id).slice(0, 2)

  return `<div class="drawer-handle" aria-hidden="true"></div>
    <button class="drawer-close" data-action="close-drawer" aria-label="Close holding">×</button>
    <div class="drawer-heading">
      <span class="resident-medallion ${resident.kind}">${resident.kind === 'crop' ? '☘' : resident.ticker.slice(0, 1)}</span>
      <span><small>${resident.home}</small><h2>${resident.shortName} <b>${resident.ticker}</b></h2><p>${resident.avatar}</p></span>
      <span class="holding-value"><strong>${formatMoney(value)}</strong><small>${allocation.toFixed(1)}% allocation</small></span>
    </div>

    <div class="habitat-status">
      <span><i></i><span><small>PLAYCANVAS ENTITY STATE</small><strong>${residentStatus(resident)}</strong></span></span>
      <em>Bound to ${resident.home}</em>
    </div>

    <p class="behavior-copy">${resident.behavior}</p>

    ${isCash ? `<section class="reserve-card">
      <span>☘</span><p><strong>Liquidity supports every habitat.</strong><small>Buying and selling the animal holdings moves value into or out of this clover field.</small></p>
    </section>` : resident.tradable === false ? `<section class="reserve-card neighbor-visit-card">
      <span>♧</span><p><strong>Visiting ${resident.farmId === 'maya' ? 'Maya’s' : 'Jordan’s'} farm.</strong><small>This technology holding is part of a neighboring illustrative portfolio. You can observe and tend it, but trading remains on My Farm.</small></p>
    </section>` : `<section class="trade-card">
      <div class="trade-title"><span><small>SIMULATED INVESTMENT ACTION</small><strong>Feed the holding or reduce it</strong></span><i>No real trade</i></div>
      <div class="amount-picker" role="group" aria-label="Choose simulated trade amount">
        ${[50, 100, 250].map(amount => `<button data-action="trade-amount" data-amount="${amount}" class="${tradeAmount === amount ? 'active' : ''}">${formatMoney(amount)}</button>`).join('')}
      </div>
      <div class="trade-actions">
        <button data-action="feed-buy" data-id="${resident.id}" class="feed-button" ${progress.positions.cash < tradeAmount ? 'disabled' : ''}>
          <i>♥</i><span><strong>Feed + invest ${formatMoney(tradeAmount)}</strong><small>Uses simulated cash · triggers local interaction</small></span>
        </button>
        <button data-action="begin-sell" data-id="${resident.id}" class="sell-button" ${value <= 0 ? 'disabled' : ''}>
          <i>↙</i><span><strong>Sell ${formatMoney(Math.min(tradeAmount, value))}</strong><small>Returns value to Treasury Clover</small></span>
        </button>
      </div>
      ${pendingSell ? `<div class="sell-confirm">
        <p>Sell ${formatMoney(Math.min(tradeAmount, value))} of ${resident.ticker}? <small>This only changes the prototype.</small></p>
        <button data-action="cancel-sell">Cancel</button>
        <button data-action="confirm-sell" data-id="${resident.id}">Confirm sale</button>
      </div>` : ''}
    </section>`}

    <div class="drawer-quick-actions">
      <button data-action="tend-only" data-id="${resident.id}"><i>✓</i><span><strong>${progress.tended[resident.id] ? 'Tended today' : resident.careAction}</strong><small>${progress.tended[resident.id] ? 'Care round recorded' : 'Care without changing the position'}</small></span></button>
      ${resident.kind !== 'crop' ? `<button data-action="open-shop"><i>◇</i><span><strong>Customize ${resident.shortName}</strong><small>${cosmetics.skin ? `${cosmetics.skin} equipped` : `${cosmetics.owned.length} items owned`}</small></span></button>` : ''}
    </div>

    <details class="investment-note">
      <summary>Investment thesis and risk</summary>
      <p><strong>Thesis:</strong> ${resident.thesis}</p>
      <p><strong>Watch:</strong> ${resident.risk}</p>
    </details>

    ${lastTrades.length ? `<div class="recent-actions"><small>RECENT SIMULATED ACTIONS</small>${lastTrades.map(transaction => `<span><b>${transaction.side === 'buy' ? 'Fed' : 'Sold'}</b>${formatMoney(transaction.amount)} · ${transaction.time}</span>`).join('')}</div>` : ''}`
}

function weatherPanelMarkup() {
  const weather = deriveWeather(progress.weather)
  const factors = [
    { id: 'rates', label: 'Interest rates', low: 'Tailwind', high: 'Headwind', icon: '↗' },
    { id: 'inflation', label: 'Inflation', low: 'Cool', high: 'Heat', icon: '♨' },
    { id: 'geopolitics', label: 'Geopolitics', low: 'Calm', high: 'Storm', icon: '⚑' },
    { id: 'sentiment', label: 'Investor sentiment', low: 'Fear', high: 'Optimism', icon: '☀' },
  ]

  return `<div class="panel-heading">
      <span class="panel-icon">${weather.icon}</span>
      <span><small>PLAYCANVAS WEATHER SYSTEM</small><h2>Market Weather</h2><p>Macro forces reshape the whole valley and every animal’s pace.</p></span>
      <button data-action="close-panel" aria-label="Close market weather">×</button>
    </div>
    <div class="weather-forecast">
      <span><small>CURRENT CLIMATE</small><strong id="panel-weather-label">${weather.label}</strong></span>
      <i><b id="panel-stress-value">${weather.stress}</b><small>stress</small></i>
    </div>
    <div class="factor-list">
      ${factors.map(factor => `<label>
        <span><i>${factor.icon}</i><span><strong>${factor.label}</strong><small>${factor.low} → ${factor.high}</small></span><output id="${factor.id}-output">${weather[factor.id]}</output></span>
        <input type="range" min="0" max="100" step="1" value="${weather[factor.id]}" data-weather-factor="${factor.id}" />
      </label>`).join('')}
    </div>
    <div class="weather-legend">
      <span><i class="rates"></i><strong>Rates</strong><small>Wind and animal pace</small></span>
      <span><i class="inflation"></i><strong>Inflation</strong><small>Heat and crop color</small></span>
      <span><i class="geopolitics"></i><strong>Geopolitics</strong><small>Rain and lightning</small></span>
      <span><i class="sentiment"></i><strong>Sentiment</strong><small>Light and activity</small></span>
    </div>
    <p class="panel-disclaimer">This is a visual teaching metaphor, not a forecast or investing signal.</p>`
}

function shopPanelMarkup() {
  const resident = getHolding(selectedId) || animalResidents[0]
  const shopResident = resident.kind === 'crop' ? animalResidents[0] : resident
  const cosmetics = cosmeticState(shopResident.id)

  return `<div class="panel-heading shop-heading">
      <span class="panel-icon">◇</span>
      <span><small>OPTIONAL CUSTOMIZATION</small><h2>Treat Cart</h2><p>Teach tricks and equip swag. Prototype currency only.</p></span>
      <button data-action="close-panel" aria-label="Close treat shop">×</button>
    </div>
    <div class="shop-wallet">
      <span><small>CUSTOMIZING</small><strong>${shopResident.shortName} · ${shopResident.ticker}</strong></span>
      <i><b>${progress.coins}</b><small>virtual acorns</small></i>
    </div>
    <div class="shop-grid">
      ${shopItems.map(item => {
        const owned = cosmetics.owned.includes(item.id)
        const equipped = item.type === 'skin' && cosmetics.skin === item.id
        return `<article class="shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
          <span class="item-art ${item.id}">${item.icon}</span>
          <span><small>${item.type === 'trick' ? 'PERMANENT TRICK' : 'SKIN / SWAG'}</small><strong>${item.name}</strong><p>${item.detail}</p></span>
          <button data-action="shop-item" data-item="${item.id}" data-id="${shopResident.id}" ${!owned && progress.coins < item.price ? 'disabled' : ''}>
            ${equipped ? 'Equipped' : owned ? item.type === 'trick' ? 'Perform' : 'Equip' : `${item.price} ◇`}
          </button>
        </article>`
      }).join('')}
    </div>
    ${cosmetics.skin ? `<button class="natural-coat" data-action="natural-coat" data-id="${shopResident.id}">Return to natural coat</button>` : ''}
    <p class="panel-disclaimer"><strong>Commerce concept:</strong> these are optional cosmetic and behavior items. No payment account, checkout, or real purchase exists in this prototype.</p>`
}

function renderDrawer() {
  const drawer = document.querySelector('#holding-drawer')
  drawer.innerHTML = drawerMarkup()
  drawer.classList.toggle('open', Boolean(selectedId))
}

function renderPanel() {
  const weatherPanel = document.querySelector('#weather-panel')
  const shopPanel = document.querySelector('#shop-panel')
  weatherPanel.classList.toggle('open', activePanel === 'weather')
  shopPanel.classList.toggle('open', activePanel === 'shop')
  weatherPanel.innerHTML = activePanel === 'weather' ? weatherPanelMarkup() : ''
  shopPanel.innerHTML = activePanel === 'shop' ? shopPanelMarkup() : ''
}

function updateHud() {
  const weather = deriveWeather(progress.weather)
  document.querySelector('#portfolio-value').textContent = formatMoney(totalValue())
  document.querySelector('#coin-balance').textContent = progress.coins
  document.querySelector('#weather-icon').textContent = weather.icon
  document.querySelector('#weather-label').textContent = weather.label
  document.querySelector('#climate-pill-icon').textContent = weather.icon
  document.querySelector('#climate-pill-label').textContent = weather.label
  document.querySelector('#climate-stress').textContent = weather.stress
  document.querySelector('#tending-card').innerHTML = tendingMarkup()
}

function showToast(message) {
  const toast = document.querySelector('#toast')
  clearTimeout(toastTimer)
  toast.textContent = message
  toast.classList.add('show')
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800)
}

function selectResident(id) {
  haptic(18)
  selectedId = id
  pendingSell = false
  renderDrawer()
}

function recordTransaction(id, side, amount) {
  progress.transactions.unshift({
    id,
    side,
    amount,
    time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date()),
  })
  progress.transactions = progress.transactions.slice(0, 12)
}

function executeTrade(id, side) {
  const result = applySimulatedTrade(progress.positions, id, side, tradeAmount)
  if (result.error) {
    showToast(result.error)
    return
  }

  progress.positions = result.positions
  progress.tended[id] = Date.now()
  recordTransaction(id, side, result.executed)
  pendingSell = false
  saveProgress()
  updateHud()
  renderDrawer()
  farmScene?.updateInvestment(id)
  farmScene?.updateInvestment('cash')
  farmScene?.sendResidentToStation(id, side === 'buy' ? 'feed' : 'sell')

  const resident = getHolding(id)
  showToast(side === 'buy'
    ? `${resident.shortName} was fed — ${formatMoney(result.executed)} moved from simulated cash.`
    : `${formatMoney(result.executed)} of ${resident.ticker} sold into Treasury Clover.`)
  haptic(side === 'buy' ? [18, 28, 18] : [28, 18])
}

function startGame() {
  if (!window.pc || !window.Ammo) {
    showToast('The local 3D physics engine could not load.')
    return
  }
  farmScene = new PlayCanvasFarm(document.querySelector('#game-canvas'), {
    getPosition: id => progress.positions[id] || 0,
    getAllocation: holdingAllocation,
    getCosmetic: cosmeticState,
    getWeather: () => progress.weather,
    onResidentSelect: selectResident,
    onLabelClusterSelect: residents => {
      haptic(16)
      showToast(`${residents.length} nearby labels expanded. Tap a creature to inspect it.`)
    },
    onReady: () => showToast('3D physics farm ready. Drag to explore and tap an animal.'),
    onError: error => {
      console.error(error)
      showToast('The 3D physics scene could not finish loading.')
    },
  })
  farmScene.initialize()
}

root.addEventListener('input', event => {
  const input = event.target.closest('[data-weather-factor]')
  if (!input) return
  progress.weather[input.dataset.weatherFactor] = Number(input.value)
  const weather = deriveWeather(progress.weather)
  document.querySelector(`#${input.dataset.weatherFactor}-output`).textContent = input.value
  document.querySelector('#panel-weather-label').textContent = weather.label
  document.querySelector('#panel-stress-value').textContent = weather.stress
  updateHud()
  farmScene?.setWeather(progress.weather)
})

root.addEventListener('change', event => {
  if (event.target.closest('[data-weather-factor]')) saveProgress()
})

root.addEventListener('click', event => {
  const target = event.target.closest('[data-action]')
  if (!target) return
  const action = target.dataset.action

  if (action === 'close-drawer') {
    selectedId = null
    pendingSell = false
    renderDrawer()
  } else if (action === 'trade-amount') {
    tradeAmount = Number(target.dataset.amount)
    pendingSell = false
    renderDrawer()
  } else if (action === 'feed-buy') {
    executeTrade(target.dataset.id, 'buy')
  } else if (action === 'begin-sell') {
    pendingSell = true
    renderDrawer()
  } else if (action === 'cancel-sell') {
    pendingSell = false
    renderDrawer()
  } else if (action === 'confirm-sell') {
    executeTrade(target.dataset.id, 'sell')
  } else if (action === 'tend-only') {
    const resident = getHolding(target.dataset.id)
    progress.tended[resident.id] = Date.now()
    saveProgress()
    updateHud()
    renderDrawer()
    farmScene?.sendResidentToStation(resident.id, 'environment')
    showToast(`${resident.careAction} complete — no simulated trade made.`)
    haptic(22)
  } else if (action === 'open-weather') {
    activePanel = 'weather'
    renderPanel()
  } else if (action === 'open-shop') {
    activePanel = 'shop'
    renderPanel()
  } else if (action === 'close-panel') {
    activePanel = null
    renderPanel()
  } else if (action === 'jump-farm') {
    const worldX = Number(target.dataset.worldX)
    const worldZ = Number(target.dataset.worldZ)
    const destination = neighborFarms.find(farm => farm.centerX === worldX)
    farmScene?.focusWorld(worldX, worldZ)
    document.querySelectorAll('.farm-nav button').forEach(button => button.classList.toggle('active', button === target))
    if (destination) {
      const residentCount = farmResidents.filter(resident => resident.farmId === destination.id).length
      showToast(`${destination.name} · full-size farm · ${residentCount} technology residents`)
    }
  } else if (action === 'zoom-in') {
    if (farmScene) farmScene.setZoom(farmScene.zoom + .12)
  } else if (action === 'zoom-out') {
    if (farmScene) farmScene.setZoom(farmScene.zoom - .12)
  } else if (action === 'home') {
    farmScene?.focusWorld(0, -10)
  } else if (action === 'shop-item') {
    const item = shopItems.find(entry => entry.id === target.dataset.item)
    const id = target.dataset.id
    const current = cosmeticState(id)
    const owned = current.owned.includes(item.id)
    if (!owned) {
      if (progress.coins < item.price) return
      progress.coins -= item.price
      current.owned = [...current.owned, item.id]
      if (item.type === 'trick') current.tricks = [...new Set([...current.tricks, item.trick])]
      if (item.type === 'skin') current.skin = item.id
      progress.cosmetics[id] = current
      showToast(`${item.name} unlocked with virtual acorns.`)
    } else if (item.type === 'skin') {
      current.skin = item.id
      progress.cosmetics[id] = current
    }
    saveProgress()
    updateHud()
    if (item.type === 'skin') farmScene?.applyCosmetic(id)
    if (item.type === 'trick') farmScene?.performTrick(id, item.trick)
    renderPanel()
    renderDrawer()
  } else if (action === 'natural-coat') {
    const current = cosmeticState(target.dataset.id)
    current.skin = null
    progress.cosmetics[target.dataset.id] = current
    saveProgress()
    farmScene?.applyCosmetic(target.dataset.id)
    renderPanel()
    renderDrawer()
  }
})

root.innerHTML = shellMarkup()
updateHud()
requestAnimationFrame(startGame)
