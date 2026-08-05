import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allocationGroups,
  animalSimulation,
  applySimulatedTrade,
  cashReserve,
  deriveWeather,
  dragonSimulation,
  evolutionStage,
  farmResidents,
  getHolding,
  holdings,
  neighborFarms,
  neighborHoldings,
  portfolio,
} from '../src/data.js'

test('every farm resident has a unique home and complete interaction data', () => {
  assert.equal(new Set(farmResidents.map(({ id }) => id)).size, farmResidents.length)
  assert.equal(new Set(farmResidents.map(({ home }) => home)).size, farmResidents.length)

  for (const resident of farmResidents) {
    for (const field of ['id', 'ticker', 'avatar', 'shortName', 'kind', 'value', 'weight', 'dayChange', 'x', 'y', 'pen', 'anchor', 'station', 'home', 'careAction', 'need', 'behavior', 'thesis', 'risk']) {
      assert.notEqual(resident[field], undefined)
    }
    assert.ok(resident.x > 0 && resident.x < 100)
    assert.ok(resident.y > 0 && resident.y < 100)
    assert.ok(resident.anchor.x > resident.pen.x)
    assert.ok(resident.anchor.x < resident.pen.x + resident.pen.width)
    assert.ok(resident.anchor.y > resident.pen.y)
    assert.ok(resident.anchor.y < resident.pen.y + resident.pen.height)
    assert.ok(resident.station.x >= resident.pen.x)
    assert.ok(resident.station.x <= resident.pen.x + resident.pen.width)
    assert.ok(resident.station.y >= resident.pen.y)
    assert.ok(resident.station.y <= resident.pen.y + resident.pen.height)
  }
})

test('portfolio values and allocations reconcile', () => {
  const activeValue = holdings.reduce((sum, holding) => sum + holding.value, 0) + cashReserve.value
  const activeWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0) + cashReserve.weight
  const groupWeight = allocationGroups.reduce((sum, group) => sum + group.value, 0)
  assert.equal(activeValue, portfolio.value)
  assert.equal(activeWeight, 100)
  assert.equal(groupWeight, 100)
})

test('allocation grows the resident and its habitat', () => {
  assert.equal(evolutionStage(4.9).key, 'starter')
  assert.equal(evolutionStage(5).key, 'growing')
  assert.equal(evolutionStage(15).key, 'thriving')
  assert.equal(evolutionStage(30).key, 'landmark')

  const small = animalSimulation(4, 0)
  const large = animalSimulation(35, 0)
  assert.ok(large.stage.scale > small.stage.scale)
  assert.ok(large.habitatScale > small.habitatScale)
  assert.ok(large.activity > small.activity)
})

test('market movement changes activity, vividness, speed, and mood', () => {
  const pullback = animalSimulation(18, -7)
  const rally = animalSimulation(18, 7)

  assert.equal(pullback.priceState, 'down')
  assert.equal(rally.priceState, 'up')
  assert.ok(rally.activity > pullback.activity)
  assert.ok(rally.vividness > pullback.vividness)
  assert.ok(rally.speed < pullback.speed)
  assert.equal(pullback.mood, 'sheltering')
  assert.equal(rally.mood, 'celebrating')
})

test('farm species live in appropriate, distinct locations', () => {
  assert.match(getHolding('apple').home, /Orchard Pen/)
  assert.equal(getHolding('apple').kind, 'pig')
  assert.match(getHolding('microsoft').home, /Library Loft/)
  assert.equal(getHolding('tesla').kind, 'cat')
  assert.match(getHolding('bonds').home, /Stable/)
  assert.equal(cashReserve.kind, 'crop')
  assert.equal(neighborFarms.length, 3)
})

test('three full farm districts have distinct technology residents', () => {
  const byFarm = Object.groupBy(farmResidents, resident => resident.farmId)
  assert.equal(byFarm.alex.length, 7)
  assert.equal(byFarm.maya.length, 5)
  assert.equal(byFarm.jordan.length, 5)
  assert.equal(neighborHoldings.length, 10)
  assert.deepEqual(new Set(byFarm.maya.map(resident => resident.ticker)), new Set(['GOOGL', 'AMZN', 'META', 'AVGO', 'CRM']))
  assert.deepEqual(new Set(byFarm.jordan.map(resident => resident.ticker)), new Set(['AMD', 'ORCL', 'NFLX', 'PLTR', 'QCOM']))
  assert.equal(byFarm.maya.every(resident => resident.tradable === false), true)
  assert.equal(byFarm.jordan.every(resident => resident.tradable === false), true)
})

test('every animal habitat directly borders several animal neighbors', () => {
  const animals = farmResidents.filter(resident => resident.kind !== 'crop')
  const sharesBorder = (a, b) => {
    if (a.farmId !== b.farmId) return false
    const aRight = a.pen.x + a.pen.width
    const bRight = b.pen.x + b.pen.width
    const aFar = a.pen.y + a.pen.height
    const bFar = b.pen.y + b.pen.height
    const verticalOverlap = Math.min(aFar, bFar) - Math.max(a.pen.y, b.pen.y)
    const horizontalOverlap = Math.min(aRight, bRight) - Math.max(a.pen.x, b.pen.x)
    return (
      ((aRight === b.pen.x || bRight === a.pen.x) && verticalOverlap > 60)
      || ((aFar === b.pen.y || bFar === a.pen.y) && horizontalOverlap > 60)
    )
  }

  for (const animal of animals) {
    const neighbors = animals.filter(candidate => candidate !== animal && sharesBorder(animal, candidate))
    assert.ok(neighbors.length >= 2, `${animal.ticker} should border at least two animal habitats`)
  }
})

test('the NVIDIA dragon keeps its richer behavior sequence', () => {
  const starterDrop = dragonSimulation(4, -6)
  const peakSurge = dragonSimulation(35, 8)

  assert.equal(starterDrop.stage.key, 'starter')
  assert.equal(peakSurge.stage.key, 'landmark')
  assert.ok(peakSurge.chipClusters > starterDrop.chipClusters)
  assert.ok(peakSurge.activity > starterDrop.activity)
  assert.deepEqual(starterDrop.sequence, ['cuddle', 'idle'])
  assert.deepEqual(peakSurge.sequence, ['flight', 'display', 'roam'])
})

test('simulated buys and sells reconcile with the cash crop', () => {
  const positions = Object.fromEntries(farmResidents.map(resident => [resident.id, resident.value]))
  const total = Object.values(positions).reduce((sum, value) => sum + value, 0)

  const bought = applySimulatedTrade(positions, 'nvidia', 'buy', 250)
  assert.equal(bought.executed, 250)
  assert.equal(bought.positions.nvidia, positions.nvidia + 250)
  assert.equal(bought.positions.cash, positions.cash - 250)
  assert.equal(Object.values(bought.positions).reduce((sum, value) => sum + value, 0), total)

  const sold = applySimulatedTrade(bought.positions, 'nvidia', 'sell', 100)
  assert.equal(sold.executed, 100)
  assert.equal(sold.positions.nvidia, bought.positions.nvidia - 100)
  assert.equal(sold.positions.cash, bought.positions.cash + 100)
  assert.equal(Object.values(sold.positions).reduce((sum, value) => sum + value, 0), total)
})

test('weather factors produce distinct farm-wide conditions', () => {
  const calm = deriveWeather({ rates: 20, inflation: 20, geopolitics: 10, sentiment: 85 })
  const storm = deriveWeather({ rates: 70, inflation: 65, geopolitics: 90, sentiment: 20 })
  const heat = deriveWeather({ rates: 40, inflation: 80, geopolitics: 20, sentiment: 55 })

  assert.equal(storm.label, 'Geopolitical storm front')
  assert.equal(storm.rain, true)
  assert.equal(storm.lightning, true)
  assert.equal(heat.label, 'Inflation heat wave')
  assert.ok(storm.stress > calm.stress)
  assert.ok(storm.animalPace < calm.animalPace)
  assert.ok(storm.brightness < calm.brightness)
})
