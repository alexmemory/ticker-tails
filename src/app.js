import {
  allocationGroups,
  avatarCatalog,
  cashReserve,
  energyProfile,
  evolutionStage,
  formatMoney,
  getHolding,
  gravityProfile,
  holdings,
  optionExpedition,
  performanceProfile,
  physicsRules,
  portfolio,
  signedPercent,
  weatherModes,
} from './data.js'

const root = document.querySelector('#root')
const storageKey = 'market-biome-progress-v1'

const defaultProgress = {
  weather: 'profit',
  lens: 'allocation',
  discovered: [],
  savedPlans: 0,
}

function loadProgress() {
  try {
    return { ...defaultProgress, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }
  } catch {
    return { ...defaultProgress }
  }
}

let progress = loadProgress()
let activeTab = 'Biome'
let selectedHoldingId = null
let selectedCatalogTicker = null
let menuOpen = false
let decision = null
let toast = ''
let toastTimer
let sandbox = { allocation: 12, pe: 44, growth: 24, performance: 2.4 }

const saveProgress = () => localStorage.setItem(storageKey, JSON.stringify(progress))

function showToast(message) {
  toast = message
  clearTimeout(toastTimer)
  render()
  toastTimer = setTimeout(() => {
    toast = ''
    render()
  }, 2400)
}

function header() {
  return `<header class="app-header">
    <button class="menu-button" data-action="menu" aria-label="Open prototype menu"><i></i><i></i><i></i></button>
    <button class="brand" data-action="nav" data-tab="Biome" aria-label="Open Market Biome">
      <span class="brand-orbit"><i></i><b>MB</b></span>
      <span><strong>Market Biome</strong><small>Stock Avatar Engine · Demo</small></span>
    </button>
    <button class="weather-orb ${progress.weather}" data-action="cycle-weather" aria-label="Change market weather">
      ${weatherModes.find(mode => mode.id === progress.weather)?.icon || '☀'}
    </button>
  </header>`
}

function lensValue(holding) {
  if (progress.lens === 'gravity') return holding.pe == null ? 'Anchored' : `P/E ${holding.pe}`
  if (progress.lens === 'energy') return `${holding.growth}% growth`
  if (progress.lens === 'performance') return signedPercent(holding.dayChange)
  return `${holding.weight}% · ${holding.stage.label}`
}

function motionTrail(holding) {
  if (holding.energy.key === 'bloom') return '<i>✿</i><i>✿</i><i>✿</i>'
  if (holding.energy.key === 'spark') return '<i>·</i><i>✦</i><i>·</i>'
  return '<i>✦</i><i>✧</i><i>✦</i>'
}

function avatarMarkup(holding, context = 'world') {
  const style = `--avatar-scale:${holding.stage.scale};--gravity-lift:${holding.gravity.lift}px;--daily-shift:${holding.performance.displacement}px;--habitat-size:${90 + holding.weight * 3}px`
  return `<button
    class="market-avatar ${holding.type} ${holding.position} stage-${holding.stage.key} energy-${holding.energy.key} performance-${holding.performance.key} ${context === 'portrait' ? 'portrait-avatar' : ''}"
    style="${style}"
    data-action="avatar"
    data-id="${holding.id}"
    aria-label="Open ${holding.ticker}, ${holding.avatar}"
  >
    <span class="habitat-aura" aria-hidden="true"></span>
    <span class="motion-trail" aria-hidden="true">${motionTrail(holding)}</span>
    <span class="creature-shell" aria-hidden="true">
      <i class="creature-icon">${holding.creature}</i>
      <i class="creature-detail"></i>
      <i class="creature-shadow"></i>
    </span>
    <span class="avatar-label">
      <strong>${holding.ticker}</strong>
      <small>${holding.shortName}</small>
      <em>${lensValue(holding)}</em>
    </span>
  </button>`
}

function weatherControls() {
  return `<div class="weather-controls" role="group" aria-label="Simulate market weather">
    ${weatherModes.map(mode => `<button data-action="weather" data-weather="${mode.id}" class="${progress.weather === mode.id ? 'active' : ''}" aria-pressed="${progress.weather === mode.id}">
      <i>${mode.icon}</i><span><strong>${mode.label}</strong><small>${mode.note}</small></span>
    </button>`).join('')}
  </div>`
}

function lensControls() {
  return `<div class="lens-controls" role="group" aria-label="Choose the financial physics lens">
    ${physicsRules.map(rule => `<button data-action="lens" data-lens="${rule.id}" class="${progress.lens === rule.id ? 'active' : ''}" aria-pressed="${progress.lens === rule.id}">
      <i>${rule.icon}</i><span>${rule.metric}</span>
    </button>`).join('')}
  </div>`
}

function biomeScreen() {
  const activeRule = physicsRules.find(rule => rule.id === progress.lens)
  return `<section class="screen biome-screen" aria-labelledby="biome-title">
    <div class="biome-hero">
      <div>
        <span class="eyebrow">Live portfolio ecosystem</span>
        <h1 id="biome-title">Your market is alive.</h1>
        <p>Financial data becomes size, gravity, energy, and weather—not another spreadsheet.</p>
      </div>
      <div class="portfolio-value">
        <small>Biome value</small>
        <strong>${formatMoney(portfolio.value)}</strong>
        <span>${signedPercent(portfolio.dayChange)} today</span>
      </div>
    </div>

    ${weatherControls()}
    ${lensControls()}

    <section class="biome-world weather-${progress.weather} lens-${progress.lens}" aria-label="Interactive market biome">
      <img src="/assets/market-biome.png" alt="" class="biome-art" />
      <div class="weather-layer golden" aria-hidden="true"></div>
      <div class="weather-layer overcast" aria-hidden="true"></div>
      <div class="weather-layer wind" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="localized-rain" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      ${holdings.map(holding => avatarMarkup(holding)).join('')}
      <button class="cash-pool" data-action="cash" aria-label="Open cash liquidity pool"><i>≈</i><span><strong>${cashReserve.weight}%</strong><small>Cash pool</small></span></button>
      <div class="world-hud">
        <span><i>${activeRule.icon}</i><span><strong>${activeRule.title}</strong><small>${activeRule.rule}</small></span></span>
        <button data-action="nav" data-tab="Physics">Tune engine →</button>
      </div>
    </section>

    <section class="engine-readout">
      <div class="readout-heading">
        <div><span class="eyebrow">Engine readout</span><h2>${activeRule.metric} is visible</h2></div>
        <span class="live-badge"><i></i> Live demo</span>
      </div>
      <p>${activeRule.range}</p>
      <div class="readout-grid">
        ${holdings.slice(0, 3).map(holding => `<button data-action="avatar" data-id="${holding.id}">
          <span>${holding.creature}</span><span><strong>${holding.ticker}</strong><small>${lensValue(holding)}</small></span><b>›</b>
        </button>`).join('')}
      </div>
    </section>

    <button class="field-guide-promo" data-action="nav" data-tab="Field Guide">
      <span>◎</span><span><small>Avatar field guide</small><strong>Meet all 12 designed creatures</strong><em>${progress.discovered.length + holdings.length} discovered</em></span><b>→</b>
    </button>
  </section>`
}

function sandboxPreview() {
  const stage = evolutionStage(sandbox.allocation)
  const gravity = gravityProfile(sandbox.pe)
  const energy = energyProfile(sandbox.growth)
  const performance = performanceProfile(sandbox.performance)
  const style = `--sandbox-scale:${stage.scale};--sandbox-lift:${gravity.lift}px;--sandbox-daily:${performance.displacement}px`
  return `<section class="sandbox-preview weather-${progress.weather}" style="${style}" aria-label="Physics sandbox preview">
    <div class="sandbox-sky"></div>
    <div class="sandbox-ground"></div>
    <div class="sandbox-trail ${energy.key}" aria-hidden="true">${energy.key === 'bloom' ? '✿　✿　✿' : '✦　·　✧'}</div>
    <div class="sandbox-creature" aria-hidden="true"><span>🐉</span><i></i></div>
    <div class="sandbox-badges">
      <span>${stage.label} habitat</span><span>${gravity.label}</span><span>${performance.label}</span>
    </div>
  </section>`
}

function rangeControl(field, label, value, min, max, step, unit) {
  return `<label class="range-control">
    <span><strong>${label}</strong><b>${value}${unit}</b></span>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-sandbox="${field}" />
  </label>`
}

function physicsScreen() {
  return `<section class="screen inner-screen physics-screen" aria-labelledby="physics-title">
    <div class="screen-intro">
      <span class="eyebrow">Avatar engine</span>
      <h1 id="physics-title">Tune the financial physics</h1>
      <p>Move the four inputs and watch the same creature evolve. The sandbox is illustrative and does not predict returns.</p>
    </div>

    ${sandboxPreview()}

    <section class="sandbox-controls">
      ${rangeControl('allocation', 'Portfolio allocation', sandbox.allocation, 1, 40, 1, '%')}
      ${rangeControl('pe', 'P/E gravity', sandbox.pe, 8, 80, 1, '×')}
      ${rangeControl('growth', 'Projected growth energy', sandbox.growth, 0, 35, 1, '%')}
      ${rangeControl('performance', 'Daily movement', sandbox.performance, -6, 6, .2, '%')}
    </section>

    <div class="physics-rule-list">
      ${physicsRules.map(rule => `<article>
        <span>${rule.icon}</span>
        <div><small>${rule.metric}</small><h2>${rule.title}</h2><p>${rule.rule}</p><em>${rule.range}</em></div>
      </article>`).join('')}
    </div>

    <section class="weather-lab">
      <span class="eyebrow">Global environment</span>
      <h2>Market weather affects every habitat</h2>
      <p>Switch between a profitable ecosystem, portfolio losses, and volatility wind.</p>
      ${weatherControls()}
    </section>
  </section>`
}

function guideCard(item, active = false) {
  const discovered = active || progress.discovered.includes(item.ticker)
  return `<button class="guide-card ${active ? 'active-holding' : ''} ${discovered ? 'discovered' : ''}" data-action="${active ? 'avatar' : 'catalog'}" ${active ? `data-id="${item.id}"` : `data-ticker="${item.ticker}"`}>
    <span class="guide-creature ${item.type || ''}">${item.creature}</span>
    <span><small>${item.ticker} · ${item.sector}</small><strong>${item.avatar}</strong><em>${item.vibe}</em></span>
    <b>${active ? `${item.weight}%` : discovered ? 'Found' : 'Meet'}</b>
  </button>`
}

function fieldGuideScreen() {
  return `<section class="screen inner-screen guide-screen" aria-labelledby="guide-title">
    <div class="screen-intro guide-intro">
      <div><span class="eyebrow">Creature collection</span><h1 id="guide-title">Avatar field guide</h1><p>Each identity turns a company’s market character into memorable behavior.</p></div>
      <div><strong>${progress.discovered.length + holdings.length}</strong><small>of ${holdings.length + avatarCatalog.length}<br />discovered</small></div>
    </div>

    <div class="guide-section-heading"><span>In your biome</span><small>Tap to inspect live physics</small></div>
    <div class="guide-list">${holdings.map(item => guideCard(item, true)).join('')}</div>

    <div class="guide-section-heading"><span>Waiting in the wild</span><small>Concept roster</small></div>
    <div class="guide-list">${avatarCatalog.map(item => guideCard(item)).join('')}</div>
  </section>`
}

function planScreen() {
  const goalPercent = Math.round(portfolio.goal.current / portfolio.goal.target * 100)
  return `<section class="screen inner-screen plan-screen" aria-labelledby="plan-title">
    <div class="screen-intro">
      <span class="eyebrow">Stewardship map</span>
      <h1 id="plan-title">${portfolio.goal.name}</h1>
      <p>Creature behavior can be playful; the destination and risk still need to be explicit.</p>
    </div>

    <section class="goal-card">
      <div><small>Grown so far</small><strong>${formatMoney(portfolio.goal.current)}</strong><span>toward ${formatMoney(portfolio.goal.target)}</span></div>
      <span class="goal-home">⌂</span>
      <div class="goal-track" role="progressbar" aria-label="First home goal progress" aria-valuenow="${goalPercent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${goalPercent}%"><b>${goalPercent}%</b></i></div>
      <p>Target: ${portfolio.goal.horizon} · Illustrative progress, not a return projection.</p>
    </section>

    <section class="allocation-card">
      <div><span class="eyebrow">Biome composition</span><h2>Where the ecosystem’s weight lives</h2></div>
      <div class="allocation-stack" aria-label="Portfolio allocation">
        ${allocationGroups.map(group => `<i class="${group.tone}" style="width:${group.value}%"></i>`).join('')}
      </div>
      <ul>
        ${allocationGroups.map(group => `<li><span><i class="${group.tone}"></i>${group.label}</span><strong>${group.value}%</strong></li>`).join('')}
      </ul>
    </section>

    <section class="stewardship-card">
      <div class="score-orbit"><strong>${portfolio.stewardship}</strong><small>Stewardship</small></div>
      <div>
        <span class="eyebrow">Controllable health</span>
        <h2>Bright world, concentrated canopy</h2>
        <p>Six avatars make the portfolio legible, but Tech & Growth still represents 62% of the ecosystem.</p>
      </div>
    </section>

    <div class="plan-signals">
      <article class="good"><span>✓</span><div><strong>Liquidity pool</strong><small>${cashReserve.weight}% remains available for near-term needs.</small></div></article>
      <article class="watch"><span>!</span><div><strong>Growth habitat</strong><small>Weather in one sector can affect most of the biome at once.</small></div></article>
      <article class="good"><span>✓</span><div><strong>Anchor present</strong><small>BND and BRK.B add more grounded physics.</small></div></article>
    </div>
  </section>`
}

function bottomNav() {
  const tabs = [
    ['Biome', '◉'],
    ['Physics', '⌁'],
    ['Field Guide', '◎'],
    ['Plan', '⌂'],
  ]
  return `<nav class="bottom-nav" aria-label="Primary navigation">
    ${tabs.map(([tab, icon]) => `<button data-action="nav" data-tab="${tab}" class="${activeTab === tab ? 'active' : ''}" ${activeTab === tab ? 'aria-current="page"' : ''}><i>${icon}</i><span>${tab}</span></button>`).join('')}
  </nav>`
}

function holdingSheet() {
  const holding = getHolding(selectedHoldingId)
  if (!holding) return ''
  return `<div class="overlay" data-action="overlay-close">
    <section class="avatar-sheet" role="dialog" aria-modal="true" aria-labelledby="avatar-title">
      <button class="sheet-close" data-action="close-sheet" aria-label="Close">×</button>
      <div class="avatar-sheet-hero ${holding.type}">
        <div class="sheet-gravity-line"></div>
        <span>${holding.creature}</span>
        <i>${holding.energy.key === 'bloom' ? '✿　✿' : '✦　✧'}</i>
      </div>
      <span class="eyebrow">${holding.ticker} · ${holding.sector}</span>
      <h1 id="avatar-title">${holding.avatar}</h1>
      <p class="avatar-vibe">${holding.vibe}</p>

      <div class="physics-metrics">
        <div><small>Allocation</small><strong>${holding.weight}%</strong><em>${holding.stage.label}</em></div>
        <div><small>P/E gravity</small><strong>${holding.pe == null ? 'N/A' : `${holding.pe}×`}</strong><em>${holding.gravity.label}</em></div>
        <div><small>Growth energy</small><strong>${holding.growth}%</strong><em>${holding.energy.label}</em></div>
        <div><small>Today</small><strong class="${holding.dayChange < 0 ? 'negative-text' : 'positive-text'}">${signedPercent(holding.dayChange)}</strong><em>${holding.performance.label}</em></div>
      </div>

      <section class="visual-profile">
        <span class="eyebrow">Visual design</span>
        <p>${holding.visual}</p>
      </section>

      <section class="behavior-list">
        <span class="eyebrow">Signature behaviors</span>
        ${holding.behaviors.map((behavior, index) => `<div><span>${index + 1}</span><p>${behavior}</p></div>`).join('')}
      </section>

      <div class="thesis-risk">
        <div><small>Investment story</small><p>${holding.thesis}</p></div>
        <div><small>Known risk</small><p>${holding.risk}</p></div>
      </div>

      <div class="sheet-actions">
        ${holding.hasOption ? `<button class="secondary-button" data-action="open-option" data-id="${holding.id}">Options trail</button>` : '<button class="secondary-button" data-action="nav" data-tab="Physics">Open physics</button>'}
        <button class="primary-button" data-action="open-decision" data-id="${holding.id}">Paper decision lab</button>
      </div>
      <p class="disclaimer">Illustrative data only. No brokerage is connected and no action here places a trade.</p>
    </section>
  </div>`
}

function catalogSheet() {
  const item = avatarCatalog.find(entry => entry.ticker === selectedCatalogTicker)
  if (!item) return ''
  const discovered = progress.discovered.includes(item.ticker)
  return `<div class="overlay" data-action="overlay-close">
    <section class="avatar-sheet catalog-sheet" role="dialog" aria-modal="true" aria-labelledby="catalog-title">
      <button class="sheet-close" data-action="close-sheet" aria-label="Close">×</button>
      <div class="catalog-creature">${item.creature}</div>
      <span class="eyebrow">${item.ticker} · ${item.sector}</span>
      <h1 id="catalog-title">${item.avatar}</h1>
      <p class="avatar-vibe">${item.vibe}</p>
      <section class="visual-profile"><span class="eyebrow">Visual design</span><p>${item.visual}</p></section>
      <section class="behavior-list">
        <span class="eyebrow">Signature behaviors</span>
        ${item.behaviors.map((behavior, index) => `<div><span>${index + 1}</span><p>${behavior}</p></div>`).join('')}
      </section>
      <button class="primary-button full-button" data-action="discover" data-ticker="${item.ticker}">${discovered ? 'Creature discovered ✓' : 'Add to field guide'}</button>
      <p class="disclaimer">Concept profile only. Adding a creature does not add an investment.</p>
    </section>
  </div>`
}

function menuSheet() {
  if (!menuOpen) return ''
  return `<div class="overlay" data-action="overlay-close">
    <section class="avatar-sheet menu-sheet" role="dialog" aria-modal="true" aria-labelledby="menu-title">
      <button class="sheet-close" data-action="close-sheet" aria-label="Close">×</button>
      <span class="eyebrow">Local prototype</span>
      <h1 id="menu-title">Market Biome engine</h1>
      <p>This demo translates illustrative financial inputs into creature physics. It is educational product design—not investment advice.</p>
      <div class="menu-links">
        <button data-action="nav" data-tab="Biome"><span>◉</span><span><strong>Return to biome</strong><small>Explore the active portfolio</small></span><b>›</b></button>
        <button data-action="nav" data-tab="Physics"><span>⌁</span><span><strong>Tune the engine</strong><small>Test every system rule</small></span><b>›</b></button>
        <button data-action="reset"><span>↺</span><span><strong>Reset prototype</strong><small>Restore weather and discoveries</small></span><b>›</b></button>
      </div>
    </section>
  </div>`
}

function decisionLab() {
  if (!decision) return ''
  const holding = getHolding(decision.holdingId)
  const isOption = decision.mode === 'option'
  const amount = isOption ? optionExpedition.contractCost : decision.amount
  const signedAmount = decision.action === 'sell' ? -amount : decision.action === 'hold' ? 0 : amount
  const nextWeight = decision.action === 'hold'
    ? holding.weight
    : Math.max(0, holding.value + signedAmount) / Math.max(1, portfolio.value + signedAmount) * 100
  const nextStage = evolutionStage(nextWeight)
  const ready = decision.checks.length === 3

  return `<div class="decision-overlay">
    <section class="decision-lab" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <header>
        <button data-action="close-decision" aria-label="Close">×</button>
        <div><span class="eyebrow">${isOption ? 'Options learning trail' : 'Paper decision lab'}</span><h1 id="decision-title">${holding.ticker} · See the biome consequence</h1></div>
        <span>Paper only</span>
      </header>

      ${holding.hasOption ? `<div class="mode-switch">
        <button data-action="decision-mode" data-mode="shares" class="${!isOption ? 'active' : ''}">Shares</button>
        <button data-action="decision-mode" data-mode="option" class="${isOption ? 'active' : ''}">Option trail</button>
      </div>` : ''}

      ${isOption ? `<section class="option-panel">
        <div><span>🧭</span><div><small>Illustrative contract</small><h2>${optionExpedition.label}</h2></div></div>
        <div class="option-road"><span>Today</span><i></i><b>${optionExpedition.days} days</b><i></i><span>Expiry</span></div>
        <div class="option-metrics"><span><small>Premium</small><strong>${formatMoney(optionExpedition.premium, 2)}</strong></span><span><small>Maximum loss</small><strong>${formatMoney(optionExpedition.contractCost)}</strong></span><span><small>Breakeven</small><strong>${formatMoney(optionExpedition.breakeven, 2)}</strong></span></div>
        <p><strong>The premium can fall to zero.</strong> This paper contract risks 100% of the premium paid.</p>
      </section>` : `<section class="share-panel">
        <div class="action-switch">
          ${['buy', 'hold', 'sell'].map(action => `<button data-action="decision-action" data-value="${action}" class="${decision.action === action ? 'active' : ''}">${action}</button>`).join('')}
        </div>
        <label><span><strong>${decision.action === 'hold' ? 'No transaction' : `Paper ${decision.action} amount`}</strong><b>${decision.action === 'hold' ? '$0' : formatMoney(decision.amount)}</b></span><input type="range" min="100" max="1500" step="100" value="${decision.amount}" data-decision-amount ${decision.action === 'hold' ? 'disabled' : ''} /></label>
        <div class="biome-consequence">
          <div><small>Before</small><strong>${holding.weight}%</strong><span>${holding.stage.label}</span></div>
          <b>→</b>
          <div><small>After paper plan</small><strong>${nextWeight.toFixed(1)}%</strong><span>${nextStage.label}</span></div>
        </div>
      </section>`}

      <section class="pause-points">
        <span class="eyebrow">Pause points</span>
        <h2>Confirm the reasoning, not the excitement</h2>
        ${[
          isOption ? 'I understand the entire premium can be lost.' : 'I can explain how this supports my goal.',
          isOption ? 'I know the expiration and breakeven.' : 'I reviewed the new portfolio weight.',
          'I would still choose this after a calm 24-hour pause.',
        ].map((label, index) => `<label><input type="checkbox" data-decision-check="${index}" ${decision.checks.includes(index) ? 'checked' : ''} /><span>${label}</span></label>`).join('')}
      </section>
      <div class="decision-actions"><button class="secondary-button" data-action="close-decision">Cancel</button><button class="primary-button" data-action="save-plan" ${ready ? '' : 'disabled'}>Save paper plan${ready ? '' : ` · ${decision.checks.length}/3`}</button></div>
      <p class="disclaimer">No trade will be placed. Values are illustrative and are not a quote, recommendation, or projection.</p>
    </section>
  </div>`
}

function cashSheet() {
  if (selectedHoldingId !== 'cash') return ''
  return `<div class="overlay" data-action="overlay-close">
    <section class="avatar-sheet cash-sheet" role="dialog" aria-modal="true" aria-labelledby="cash-title">
      <button class="sheet-close" data-action="close-sheet" aria-label="Close">×</button>
      <div class="catalog-creature">💧</div>
      <span class="eyebrow">Portfolio foundation</span>
      <h1 id="cash-title">${cashReserve.label}</h1>
      <p class="avatar-vibe">${formatMoney(cashReserve.value)} · ${cashReserve.weight}% of the illustrative portfolio.</p>
      <section class="visual-profile"><span class="eyebrow">Biome role</span><p>Cash appears as a calm liquidity pool. It does not evolve into a creature; it gives the rest of the ecosystem room to handle changing weather.</p></section>
      <button class="primary-button full-button" data-action="nav" data-tab="Plan">See portfolio composition</button>
    </section>
  </div>`
}

function render() {
  const screen = activeTab === 'Physics'
    ? physicsScreen()
    : activeTab === 'Field Guide'
      ? fieldGuideScreen()
      : activeTab === 'Plan'
        ? planScreen()
        : biomeScreen()

  root.innerHTML = `<main class="prototype">
    <section class="app-shell">
      ${header()}
      ${screen}
      ${bottomNav()}
    </section>
    ${holdingSheet()}
    ${catalogSheet()}
    ${cashSheet()}
    ${menuSheet()}
    ${decisionLab()}
    ${toast ? `<div class="toast" role="status">${toast}</div>` : ''}
  </main>`
}

function closePanels() {
  selectedHoldingId = null
  selectedCatalogTicker = null
  menuOpen = false
}

function navigate(tab) {
  activeTab = tab
  closePanels()
  decision = null
  render()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectAvatar(id) {
  selectedHoldingId = id
  selectedCatalogTicker = null
  menuOpen = false
  render()
}

function startDecision(id, mode = 'shares') {
  closePanels()
  decision = { holdingId: id, mode, action: 'hold', amount: 500, checks: [] }
  render()
}

root.addEventListener('click', event => {
  const trigger = event.target.closest('[data-action]')
  if (!trigger) return
  const action = trigger.dataset.action

  if (action === 'nav') return navigate(trigger.dataset.tab)
  if (action === 'menu') {
    closePanels()
    menuOpen = true
    return render()
  }
  if (action === 'weather') {
    progress.weather = trigger.dataset.weather
    saveProgress()
    return render()
  }
  if (action === 'cycle-weather') {
    const index = weatherModes.findIndex(mode => mode.id === progress.weather)
    progress.weather = weatherModes[(index + 1) % weatherModes.length].id
    saveProgress()
    return render()
  }
  if (action === 'lens') {
    progress.lens = trigger.dataset.lens
    saveProgress()
    return render()
  }
  if (action === 'avatar') return selectAvatar(trigger.dataset.id)
  if (action === 'cash') {
    closePanels()
    selectedHoldingId = 'cash'
    return render()
  }
  if (action === 'catalog') {
    selectedCatalogTicker = trigger.dataset.ticker
    selectedHoldingId = null
    menuOpen = false
    return render()
  }
  if (action === 'discover') {
    if (!progress.discovered.includes(trigger.dataset.ticker)) {
      progress.discovered = [...progress.discovered, trigger.dataset.ticker]
      saveProgress()
      return showToast(`${trigger.dataset.ticker} added to the field guide`)
    }
    return showToast('Already discovered')
  }
  if (action === 'close-sheet') {
    closePanels()
    return render()
  }
  if (action === 'overlay-close' && event.target === trigger) {
    closePanels()
    return render()
  }
  if (action === 'open-decision') return startDecision(trigger.dataset.id)
  if (action === 'open-option') return startDecision(trigger.dataset.id, 'option')
  if (action === 'decision-mode') {
    decision.mode = trigger.dataset.mode
    decision.action = 'hold'
    decision.checks = []
    return render()
  }
  if (action === 'decision-action') {
    decision.action = trigger.dataset.value
    decision.checks = []
    return render()
  }
  if (action === 'close-decision') {
    decision = null
    return render()
  }
  if (action === 'save-plan' && decision?.checks.length === 3) {
    progress.savedPlans += 1
    saveProgress()
    decision = null
    return showToast('Paper plan saved · no trade placed')
  }
  if (action === 'reset') {
    progress = { ...defaultProgress }
    localStorage.removeItem(storageKey)
    activeTab = 'Biome'
    closePanels()
    return showToast('Market Biome reset')
  }
})

root.addEventListener('change', event => {
  const sandboxField = event.target.dataset.sandbox
  if (sandboxField) {
    sandbox[sandboxField] = Number(event.target.value)
    return render()
  }
  if (event.target.matches('[data-decision-amount]') && decision) {
    decision.amount = Number(event.target.value)
    return render()
  }
  if (event.target.matches('[data-decision-check]') && decision) {
    const index = Number(event.target.dataset.decisionCheck)
    decision.checks = event.target.checked
      ? [...new Set([...decision.checks, index])]
      : decision.checks.filter(item => item !== index)
    return render()
  }
})

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  if (decision) decision = null
  else closePanels()
  render()
})

render()
