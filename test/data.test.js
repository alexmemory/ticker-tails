import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allocationGroups,
  avatarCatalog,
  cashReserve,
  energyProfile,
  evolutionStage,
  getHolding,
  gravityProfile,
  holdings,
  performanceProfile,
  physicsRules,
  portfolio,
} from '../src/data.js'

test('active avatars have unique ids and complete physics inputs', () => {
  assert.equal(new Set(holdings.map(({ id }) => id)).size, holdings.length)
  for (const holding of holdings) {
    for (const field of ['id', 'ticker', 'avatar', 'creature', 'value', 'weight', 'growth', 'dayChange', 'stage', 'gravity', 'energy', 'performance']) {
      assert.notEqual(holding[field], undefined)
    }
    assert.equal(holding.behaviors.length, 3)
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

test('evolution thresholds match the Market Biome rules', () => {
  assert.equal(evolutionStage(4.9).key, 'basic')
  assert.equal(evolutionStage(5).key, 'emergent')
  assert.equal(evolutionStage(15).key, 'advanced')
  assert.equal(evolutionStage(30).key, 'peak')
})

test('valuation, growth, and daily movement translate into physics', () => {
  assert.equal(gravityProfile(72).key, 'ultralight')
  assert.equal(gravityProfile(18).key, 'heavy')
  assert.equal(gravityProfile(null).key, 'anchored')
  assert.equal(energyProfile(28).key, 'stardust')
  assert.equal(energyProfile(4).key, 'bloom')
  assert.equal(performanceProfile(4.8).key, 'surging')
  assert.equal(performanceProfile(-1.2).key, 'negative')
})

test('the field guide includes every exported avatar family', () => {
  assert.equal(holdings.length + avatarCatalog.length, 12)
  assert.equal(physicsRules.length, 4)
  assert.equal(getHolding('nvidia').avatar, 'Emerald Tech-Dragon')
  assert.ok(avatarCatalog.some(item => item.ticker === 'JPM'))
})
