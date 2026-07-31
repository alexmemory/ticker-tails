import {
  allocations,
  foundations,
  formatMoney,
  getHolding,
  holdings,
  movementClass,
  optionExpedition,
  portfolio,
  quests,
  signedPercent,
  stories,
} from './data.js'

const root = document.querySelector('#root')
const storageKey = 'ticker-tails-progress-v2'
const defaultProgress = {
  tokens: 284,
  checkedHoldings: [],
  completedQuests: [],
  collectedMorningBoost: false,
  visitedPlan: false,
  optionWalkthrough: false,
  alerts: [],
}

function loadProgress() {
  try {
    return { ...defaultProgress, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }
  } catch {
    return { ...defaultProgress }
  }
}

let progress = loadProgress()
let activeTab = 'World'
let selectedHoldingId = null
let selectedFoundationId = null
let menuOpen = false
let decision = null
let toastMessage = ''
let toastTimer

const saveProgress = () => localStorage.setItem(storageKey, JSON.stringify(progress))

function showToast(message) {
  toastMessage = message
  clearTimeout(toastTimer)
  render()
  toastTimer = setTimeout(() => {
    toastMessage = ''
    render()
  }, 2400)
}

function companionArt(holding) {
  if (holding.type === 'meadow') {
    return `<span class="meadow-art" aria-hidden="true">
      <i class="flower f1"></i><i class="flower f2"></i><i class="flower f3"></i>
      <i class="bee b1"></i><i class="bee b2"></i>
    </span>`
  }

  return `<span class="animal-art ${holding.type}" aria-hidden="true">
    <i class="tail"></i>
    <i class="ear left"></i><i class="ear right"></i>
    <i class="body"><b class="spot"></b></i>
    <i class="face"><b class="eye one"></b><b class="eye two"></b><em class="snout"></em></i>
    <i class="leg l1"></i><i class="leg l2"></i>
  </span>`
}

function holdingButton(holding) {
  return `<button class="companion ${holding.position} ${holding.type}" data-action="holding" data-id="${holding.id}" aria-label="Visit ${holding.name}, ${holding.ticker}">
    <span class="movement ${movementClass(holding.dayChange)}">${signedPercent(holding.dayChange)}</span>
    ${companionArt(holding)}
    ${holding.hasOption ? '<span class="trail-marker" aria-label="Options learning trail available">🧭</span>' : ''}
    <span class="companion-tag">
      <strong>${holding.name}</strong>
      <small>${holding.ticker} · ${formatMoney(holding.value)}</small>
    </span>
  </button>`
}

function appHeader() {
  return `<header class="app-header">
    <button class="round-button" data-action="menu" aria-label="Open prototype menu"><span></span><span></span><span></span></button>
    <button class="brand" data-action="nav" data-tab="World" aria-label="Go to Ticker Tails world">
      <span class="brand-mark">TT</span>
      <span><strong>Ticker Tails</strong><small>Willow Creek · Demo</small></span>
    </button>
    <button class="token-button" data-action="nav" data-tab="Quests" aria-label="${progress.tokens} Sun Tokens. Open quests">
      <i>✦</i><strong>${progress.tokens}</strong>
    </button>
  </header>`
}

function worldScreen() {
  const checked = progress.checkedHoldings.length
  const boostText = progress.collectedMorningBoost
    ? `<span class="boost-done">✓ Morning boost collected</span>`
    : `<span><i>✦</i><span><strong>Morning boost</strong><small>Your stewardship earned 24 Sun Tokens.</small></span></span>
      <button data-action="collect-boost">Collect</button>`

  return `<section class="screen world-screen" aria-labelledby="world-title">
    <div class="portfolio-hero">
      <div>
        <span class="eyebrow">Your homestead</span>
        <h1 id="world-title">Good morning, ${portfolio.owner}</h1>
        <p>Growth weather is bright today. One habitat deserves a closer look.</p>
      </div>
      <div class="value-block">
        <small>Portfolio value</small>
        <strong>${formatMoney(portfolio.value)}</strong>
        <span class="up">↑ ${formatMoney(portfolio.today, 2)} today</span>
      </div>
    </div>

    <div class="weather-strip" aria-label="Portfolio weather summary">
      <span><i>☀️</i><strong>Bright growth weather</strong></span>
      <button data-action="nav" data-tab="Stories">See why <b>→</b></button>
    </div>

    <section class="world-scene" aria-label="Interactive portfolio world">
      <img src="/assets/portfolio-grove.png" alt="" class="world-art" />
      <div class="sun-glow" aria-hidden="true"></div>
      ${holdings.map(holdingButton).join('')}
      <button class="foundation reserve" data-action="foundation" data-id="cash" aria-label="Open cash reserve">
        <span>💧</span><small>Reserve</small>
      </button>
      <button class="foundation bond" data-action="foundation" data-id="bonds" aria-label="Open bond bridge">
        <span>🌉</span><small>Bonds</small>
      </button>
      <button class="new-habitat" data-action="new-habitat"><span>＋</span><small>New habitat</small></button>
      <div class="world-legend"><span class="legend-market">Market performance changes the weather</span><span class="legend-care">Your choices grow each bond</span></div>
    </section>

    <div class="boost-banner">${boostText}</div>

    <section class="stewardship-card">
      <div class="stewardship-top">
        <div>
          <span class="eyebrow">Stewardship</span>
          <strong>${portfolio.stewardship} / 100</strong>
        </div>
        <button data-action="nav" data-tab="Plan">View plan</button>
      </div>
      <div class="meter" role="progressbar" aria-label="Stewardship score" aria-valuenow="${portfolio.stewardship}" aria-valuemin="0" aria-valuemax="100"><i style="width:${portfolio.stewardship}%"></i></div>
      <p>Strong cash reserve. Watch how much of the world depends on three individual stocks.</p>
    </section>

    <button class="quest-preview" data-action="nav" data-tab="Quests">
      <span class="quest-medallion">🐾</span>
      <span><small>Today’s gentle quest</small><strong>Check in with 3 companions</strong><em>${checked} of 3 visited</em></span>
      <span class="quest-arrow">›</span>
    </button>
  </section>`
}

function storyCard(story) {
  return `<article class="story-card ${story.tone}">
    <div class="story-icon" aria-hidden="true">${story.tone === 'weather' ? '☀️' : story.tone === 'risk' ? '🌿' : story.tone === 'learn' ? '🧭' : '🏡'}</div>
    <div class="story-copy">
      <span class="eyebrow">${story.eyebrow}</span>
      <h2>${story.title}</h2>
      <p>${story.body}</p>
      <div><small>${story.time} · Illustrative</small><button data-action="story" data-id="${story.id}">${story.action} <b>→</b></button></div>
    </div>
  </article>`
}

function storiesScreen() {
  return `<section class="screen inner-screen" aria-labelledby="stories-title">
    <div class="screen-intro">
      <span class="eyebrow">Storybook</span>
      <h1 id="stories-title">What changed—and what didn’t</h1>
      <p>Plain-language signals from your demo portfolio. A story can invite reflection, never demand a trade.</p>
    </div>
    <div class="story-list">${stories.map(storyCard).join('')}</div>
    <div class="calm-note"><span>🌙</span><p><strong>No urgent actions</strong><br />The market can move without requiring you to move with it.</p></div>
  </section>`
}

function planScreen() {
  const goalPercent = Math.round((portfolio.goal.current / portfolio.goal.target) * 100)
  return `<section class="screen inner-screen" aria-labelledby="plan-title">
    <div class="screen-intro">
      <span class="eyebrow">Goal road</span>
      <h1 id="plan-title">${portfolio.goal.name}</h1>
      <p>The whole world is working toward one destination: ${portfolio.goal.horizon}.</p>
    </div>

    <section class="goal-card">
      <div class="goal-illustration" aria-hidden="true"><span>🏡</span><i></i></div>
      <div class="goal-numbers"><span><small>Grown so far</small><strong>${formatMoney(portfolio.goal.current)}</strong></span><span><small>Destination</small><strong>${formatMoney(portfolio.goal.target)}</strong></span></div>
      <div class="goal-track" role="progressbar" aria-label="First home goal progress" aria-valuenow="${goalPercent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${goalPercent}%"><span>${goalPercent}%</span></i></div>
      <p>Progress is illustrative and does not project future returns.</p>
    </section>

    <section class="allocation-section">
      <div class="section-heading"><div><span class="eyebrow">Habitat mix</span><h2>What the world depends on</h2></div><span class="watch-badge">Watch concentration</span></div>
      <div class="allocation-stack" aria-label="Portfolio allocation">
        ${allocations.map(allocation => `<i class="${allocation.tone}" style="width:${allocation.value}%" title="${allocation.label}: ${allocation.value}%"></i>`).join('')}
      </div>
      <ul class="allocation-list">
        ${allocations.map(allocation => `<li><span><i class="${allocation.tone}"></i>${allocation.label}</span><strong>${allocation.value}%</strong></li>`).join('')}
      </ul>
    </section>

    <section class="resilience-section">
      <span class="eyebrow">Resilience check</span>
      <h2>Three things your plan can control</h2>
      <div class="resilience-list">
        <div><span class="status good">✓</span><span><strong>Near-term reserve</strong><small>10.1% is available as cash.</small></span></div>
        <div><span class="status watch">!</span><span><strong>Single-company weight</strong><small>AAPL is 25.6% of the portfolio.</small></span></div>
        <div><span class="status good">✓</span><span><strong>Goal is visible</strong><small>Every decision can be compared with June 2028.</small></span></div>
      </div>
      <button class="primary-button" data-action="mark-plan">${progress.visitedPlan ? 'Weekly check complete ✓' : 'Complete weekly stewardship check'}</button>
    </section>
  </section>`
}

function questReadiness(quest) {
  if (quest.kind === 'checkins') return progress.checkedHoldings.length >= quest.target
  if (quest.id === 'risk') return progress.checkedHoldings.includes('tesla')
  if (quest.id === 'option') return progress.optionWalkthrough
  if (quest.id === 'allocation') return progress.visitedPlan
  return false
}

function questsScreen() {
  const completed = progress.completedQuests.length
  return `<section class="screen inner-screen" aria-labelledby="quests-title">
    <div class="screen-intro quest-intro">
      <div>
        <span class="eyebrow">Quest book</span>
        <h1 id="quests-title">Grow wisdom, not trade count</h1>
        <p>Rewards come from learning, planning, and understanding what you own.</p>
      </div>
      <div class="sun-wallet"><i>✦</i><span><strong>${progress.tokens}</strong><small>Sun Tokens</small></span></div>
    </div>

    <div class="quest-progress">
      <span><strong>${completed} of ${quests.length}</strong> stewardship quests complete</span>
      <div class="meter" role="progressbar" aria-label="Quest completion" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${quests.length}"><i style="width:${completed / quests.length * 100}%"></i></div>
    </div>

    <div class="quest-list">
      ${quests.map(quest => {
        const done = progress.completedQuests.includes(quest.id)
        const ready = questReadiness(quest)
        const progressText = quest.kind === 'checkins'
          ? `${Math.min(progress.checkedHoldings.length, quest.target)} / ${quest.target}`
          : done ? 'Complete' : ready ? 'Ready' : 'Explore first'
        return `<article class="quest-row ${done ? 'done' : ''}">
          <span class="quest-symbol">${done ? '✓' : quest.icon}</span>
          <div><h2>${quest.title}</h2><p>${quest.body}</p><small>+${quest.reward} Sun Tokens · ${progressText}</small></div>
          ${done
            ? '<span class="claimed">Claimed</span>'
            : ready
              ? `<button data-action="complete-quest" data-id="${quest.id}">Claim</button>`
              : `<button class="ghost" data-action="quest-go" data-id="${quest.id}">Go</button>`}
        </article>`
      }).join('')}
    </div>

    <section class="cosmetic-card">
      <div aria-hidden="true">🌻</div>
      <div><span class="eyebrow">Cosmetic collection</span><h2>Sunflower gate</h2><p>Unlocks at 350 tokens. It changes the world’s look, never investment outcomes.</p></div>
      <strong>${progress.tokens} / 350</strong>
    </section>
  </section>`
}

function bottomNav() {
  const items = [
    ['World', '⌂', 'World'],
    ['Stories', '◫', 'Stories'],
    ['Plan', '⌁', 'Plan'],
    ['Quests', '✦', 'Quests'],
  ]
  return `<nav class="bottom-nav" aria-label="Primary navigation">
    ${items.map(([tab, icon, label]) => `<button data-action="nav" data-tab="${tab}" class="${activeTab === tab ? 'active' : ''}" ${activeTab === tab ? 'aria-current="page"' : ''}><i>${icon}</i><span>${label}</span></button>`).join('')}
  </nav>`
}

function holdingSheet() {
  const holding = getHolding(selectedHoldingId)
  if (!holding) return ''
  const alertSet = progress.alerts.includes(holding.id)
  return `<div class="overlay" data-action="overlay-close">
    <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="holding-title">
      <button class="sheet-close" data-action="close" aria-label="Close">×</button>
      <div class="portrait">${companionArt(holding)}<span class="portrait-mood">${holding.mood}</span></div>
      <span class="eyebrow">${holding.ticker} · ${holding.kind}</span>
      <h1 id="holding-title">${holding.name} in ${holding.habitat}</h1>
      <div class="holding-stats">
        <span><small>Position</small><strong>${formatMoney(holding.value)}</strong></span>
        <span><small>Portfolio</small><strong>${holding.weight}%</strong></span>
        <span><small>Today</small><strong class="${movementClass(holding.dayChange)}">${signedPercent(holding.dayChange)}</strong></span>
      </div>
      <div class="bond-row"><span><i style="width:${holding.bond * 10}%"></i></span><small>Understanding bond · Level ${holding.bond}</small></div>
      <section class="story-panel">
        <span class="panel-icon">📖</span>
        <div><span class="eyebrow">Today’s story</span><p>${holding.story}</p></div>
      </section>
      <div class="thesis-grid">
        <div><small>Why it lives here</small><p>${holding.thesis}</p></div>
        <div><small>Largest known risk</small><p>${holding.risk}</p></div>
      </div>
      <div class="sheet-actions">
        <button class="secondary-button" data-action="set-alert" data-id="${holding.id}">${alertSet ? 'Alert saved ✓' : 'Set a calm alert'}</button>
        <button class="primary-button" data-action="open-decision" data-id="${holding.id}">Review & simulate</button>
      </div>
      ${holding.hasOption ? `<button class="option-trail-button" data-action="open-option" data-id="${holding.id}"><span>🧭</span><span><strong>Timed options trail</strong><small>Learn with a paper-only contract</small></span><b>›</b></button>` : ''}
      <p class="disclaimer">Illustrative data only. No brokerage is connected and no action here places a trade.</p>
    </section>
  </div>`
}

function foundationSheet() {
  const item = foundations.find(found => found.id === selectedFoundationId)
  if (!item) return ''
  return `<div class="overlay" data-action="overlay-close">
    <section class="bottom-sheet foundation-sheet" role="dialog" aria-modal="true" aria-labelledby="foundation-title">
      <button class="sheet-close" data-action="close" aria-label="Close">×</button>
      <div class="foundation-hero" aria-hidden="true">${item.icon}</div>
      <span class="eyebrow">Portfolio foundation</span>
      <h1 id="foundation-title">${item.label}</h1>
      <strong class="foundation-value">${formatMoney(item.value)} · ${item.weight}%</strong>
      <p>${item.note}. Foundations do not need daily attention; they help the rest of the world handle changing weather.</p>
      <button class="primary-button" data-action="nav" data-tab="Plan">See the full habitat mix</button>
    </section>
  </div>`
}

function menuSheet() {
  if (!menuOpen) return ''
  return `<div class="overlay" data-action="overlay-close">
    <section class="bottom-sheet menu-sheet" role="dialog" aria-modal="true" aria-labelledby="menu-title">
      <button class="sheet-close" data-action="close" aria-label="Close">×</button>
      <span class="eyebrow">Local prototype</span>
      <h1 id="menu-title">Ticker Tails demo</h1>
      <p>This browser-only prototype uses fictional progress and illustrative market values. It does not connect to a financial account.</p>
      <div class="menu-list">
        <button data-action="nav" data-tab="World"><span>🌾</span><span><strong>Return to the world</strong><small>Visit your portfolio companions</small></span><b>›</b></button>
        <button data-action="nav" data-tab="Stories"><span>📖</span><span><strong>Open the storybook</strong><small>Understand portfolio movement</small></span><b>›</b></button>
        <button data-action="reset"><span>↺</span><span><strong>Reset demo progress</strong><small>Restore tokens, quests, and alerts</small></span><b>›</b></button>
      </div>
      <p class="disclaimer">Educational prototype. Not investment advice.</p>
    </section>
  </div>`
}

function decisionMetric(label, value, note = '') {
  return `<div><small>${label}</small><strong>${value}</strong>${note ? `<em>${note}</em>` : ''}</div>`
}

function decisionLab() {
  if (!decision) return ''
  const holding = getHolding(decision.holdingId)
  const isOption = decision.mode === 'option'
  const amount = isOption ? optionExpedition.contractCost : decision.amount
  const signedAmount = decision.action === 'sell' ? -amount : decision.action === 'hold' ? 0 : amount
  const newHoldingValue = Math.max(0, holding.value + signedAmount)
  const newPortfolioValue = Math.max(1, portfolio.value + signedAmount)
  const nextWeight = decision.action === 'hold' ? holding.weight : (newHoldingValue / newPortfolioValue) * 100
  const concentrationTone = nextWeight > 25 ? 'watch' : 'good'
  const checksComplete = decision.checks.length === 3

  return `<div class="decision-overlay">
    <section class="decision-lab" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <header class="decision-header">
        <button data-action="close-decision" aria-label="Close decision lab">×</button>
        <div><span class="eyebrow">${isOption ? 'Options learning trail' : 'Decision lab'}</span><h1 id="decision-title">${holding.name}: look before you leap</h1></div>
        <span class="paper-badge">Paper only</span>
      </header>

      ${holding.hasOption ? `<div class="mode-switch" role="group" aria-label="Simulation type">
        <button data-action="decision-mode" data-mode="shares" class="${!isOption ? 'active' : ''}">Shares</button>
        <button data-action="decision-mode" data-mode="option" class="${isOption ? 'active' : ''}">Option trail</button>
      </div>` : ''}

      ${isOption ? `
        <section class="option-contract">
          <div class="option-heading"><span>🧭</span><div><span class="eyebrow">Illustrative contract</span><h2>${optionExpedition.label}</h2><p>${optionExpedition.note}</p></div></div>
          <div class="contract-road" aria-label="Option timeline">
            <div><span>Today</span><i></i><b>${optionExpedition.days} days</b><i></i><span>Expires</span></div>
            <strong>${optionExpedition.expiration}</strong>
          </div>
          <div class="decision-metrics">
            ${decisionMetric('Premium', formatMoney(optionExpedition.premium, 2) + ' / share')}
            ${decisionMetric('Maximum loss', formatMoney(optionExpedition.contractCost), '100% of premium')}
            ${decisionMetric('Breakeven at expiry', formatMoney(optionExpedition.breakeven, 2))}
          </div>
          <div class="risk-callout"><span>!</span><p><strong>The premium can fall to zero.</strong> This paper contract risks ${formatMoney(optionExpedition.contractCost)}, or ${(optionExpedition.contractCost / portfolio.value * 100).toFixed(1)}% of the demo portfolio.</p></div>
        </section>
      ` : `
        <section class="share-plan">
          <div class="action-switch" role="group" aria-label="Paper decision">
            ${['buy', 'hold', 'sell'].map(action => `<button data-action="decision-action" data-value="${action}" class="${decision.action === action ? 'active' : ''}">${action[0].toUpperCase() + action.slice(1)}</button>`).join('')}
          </div>
          <label class="amount-control ${decision.action === 'hold' ? 'disabled' : ''}">
            <span><strong>${decision.action === 'hold' ? 'No transaction' : `Paper ${decision.action} amount`}</strong><b>${decision.action === 'hold' ? '$0' : formatMoney(decision.amount)}</b></span>
            <input type="range" min="100" max="1500" step="100" value="${decision.amount}" data-action="decision-amount" ${decision.action === 'hold' ? 'disabled' : ''} />
          </label>
          <div class="decision-metrics">
            ${decisionMetric('Position now', `${holding.weight}%`)}
            ${decisionMetric('After paper plan', `${nextWeight.toFixed(1)}%`, concentrationTone === 'watch' ? 'Concentration watch' : 'Within guide')}
            ${decisionMetric('Goal served', portfolio.goal.name)}
          </div>
          <div class="before-after">
            <div><small>Before</small><span><i style="width:${holding.weight}%"></i></span><strong>${holding.weight}%</strong></div>
            <div><small>After</small><span class="${concentrationTone}"><i style="width:${Math.min(nextWeight, 100)}%"></i></span><strong>${nextWeight.toFixed(1)}%</strong></div>
          </div>
        </section>
      `}

      <section class="reflection-checks">
        <span class="eyebrow">Pause points</span>
        <h2>Say these back before saving a plan</h2>
        ${[
          isOption ? 'I understand the entire premium can be lost.' : 'I can explain why this belongs in my goal plan.',
          isOption ? 'I know the strike, breakeven, and expiration date.' : 'I reviewed what this does to concentration.',
          'I would still choose this after a calm 24-hour pause.',
        ].map((label, index) => `<label><input type="checkbox" data-action="decision-check" data-index="${index}" ${decision.checks.includes(index) ? 'checked' : ''} /><span>${label}</span></label>`).join('')}
      </section>

      <div class="decision-footer">
        <button class="secondary-button" data-action="close-decision">Cancel</button>
        <button class="primary-button" data-action="save-paper-plan" ${checksComplete ? '' : 'disabled'}>Save paper plan${checksComplete ? '' : ` · ${decision.checks.length}/3`}</button>
      </div>
      <p class="disclaimer">No order will be placed. Values and option terms are illustrative and are not a quote, recommendation, or projection.</p>
    </section>
  </div>`
}

function render() {
  const screen = activeTab === 'Stories'
    ? storiesScreen()
    : activeTab === 'Plan'
      ? planScreen()
      : activeTab === 'Quests'
        ? questsScreen()
        : worldScreen()

  root.innerHTML = `<main class="prototype">
    <section class="app-shell">
      ${appHeader()}
      ${screen}
      ${bottomNav()}
    </section>
    ${holdingSheet()}
    ${foundationSheet()}
    ${menuSheet()}
    ${decisionLab()}
    ${toastMessage ? `<div class="toast" role="status">${toastMessage}</div>` : ''}
  </main>`
}

function closePanels() {
  selectedHoldingId = null
  selectedFoundationId = null
  menuOpen = false
}

function navigate(tab) {
  activeTab = tab
  closePanels()
  decision = null
  if (tab === 'Plan') {
    progress.visitedPlan = true
    saveProgress()
  }
  render()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openHolding(id) {
  selectedHoldingId = id
  selectedFoundationId = null
  menuOpen = false
  if (!progress.checkedHoldings.includes(id)) {
    progress.checkedHoldings = [...progress.checkedHoldings, id]
    saveProgress()
  }
  render()
}

function startDecision(id, mode = 'shares') {
  closePanels()
  decision = { holdingId: id, mode, action: 'hold', amount: 500, checks: [] }
  render()
}

function handleStory(id) {
  const story = stories.find(item => item.id === id)
  if (story.tab) return navigate(story.tab)
  if (story.option) return startDecision(story.holdingId, 'option')
  if (story.holdingId) return openHolding(story.holdingId)
}

function handleQuestGo(id) {
  const quest = quests.find(item => item.id === id)
  if (quest.tab) return navigate(quest.tab)
  if (quest.option) return startDecision(quest.holdingId, 'option')
  if (quest.holdingId) return openHolding(quest.holdingId)
  navigate('World')
}

root.addEventListener('click', event => {
  const button = event.target.closest('[data-action]')
  if (!button) return
  const action = button.dataset.action

  if (action === 'nav') return navigate(button.dataset.tab)
  if (action === 'holding') return openHolding(button.dataset.id)
  if (action === 'foundation') {
    selectedFoundationId = button.dataset.id
    selectedHoldingId = null
    menuOpen = false
    return render()
  }
  if (action === 'menu') {
    menuOpen = true
    selectedHoldingId = null
    selectedFoundationId = null
    return render()
  }
  if (action === 'close') {
    closePanels()
    return render()
  }
  if (action === 'overlay-close' && event.target === button) {
    closePanels()
    return render()
  }
  if (action === 'collect-boost') {
    progress.collectedMorningBoost = true
    progress.tokens += 24
    saveProgress()
    return showToast('24 Sun Tokens collected')
  }
  if (action === 'new-habitat') return showToast('Connect another demo holding in a future build')
  if (action === 'set-alert') {
    if (!progress.alerts.includes(button.dataset.id)) progress.alerts = [...progress.alerts, button.dataset.id]
    saveProgress()
    return showToast('A calm, non-urgent alert was saved')
  }
  if (action === 'story') return handleStory(button.dataset.id)
  if (action === 'quest-go') return handleQuestGo(button.dataset.id)
  if (action === 'complete-quest') {
    const quest = quests.find(item => item.id === button.dataset.id)
    if (quest && questReadiness(quest) && !progress.completedQuests.includes(quest.id)) {
      progress.completedQuests = [...progress.completedQuests, quest.id]
      progress.tokens += quest.reward
      saveProgress()
      return showToast(`Quest complete · +${quest.reward} Sun Tokens`)
    }
  }
  if (action === 'mark-plan') {
    progress.visitedPlan = true
    saveProgress()
    return showToast('Weekly stewardship check complete')
  }
  if (action === 'open-decision') return startDecision(button.dataset.id, 'shares')
  if (action === 'open-option') return startDecision(button.dataset.id, 'option')
  if (action === 'decision-mode') {
    decision.mode = button.dataset.mode
    decision.action = 'hold'
    decision.checks = []
    return render()
  }
  if (action === 'decision-action') {
    decision.action = button.dataset.value
    decision.checks = []
    return render()
  }
  if (action === 'close-decision') {
    decision = null
    return render()
  }
  if (action === 'save-paper-plan' && decision?.checks.length === 3) {
    const wasOption = decision.mode === 'option'
    if (wasOption) progress.optionWalkthrough = true
    saveProgress()
    decision = null
    return showToast(wasOption ? 'Options trail complete · no trade placed' : 'Paper plan saved · no trade placed')
  }
  if (action === 'reset') {
    localStorage.removeItem(storageKey)
    progress = { ...defaultProgress }
    closePanels()
    activeTab = 'World'
    return showToast('Demo progress reset')
  }
})

root.addEventListener('change', event => {
  const control = event.target.closest('[data-action]')
  if (!control || !decision) return
  if (control.dataset.action === 'decision-amount') {
    decision.amount = Number(control.value)
    render()
  }
  if (control.dataset.action === 'decision-check') {
    const index = Number(control.dataset.index)
    decision.checks = control.checked
      ? [...new Set([...decision.checks, index])]
      : decision.checks.filter(item => item !== index)
    render()
  }
})

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  if (decision) decision = null
  else closePanels()
  render()
})

render()
