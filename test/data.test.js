import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allocations,
  formatMoney,
  getHolding,
  holdings,
  movementClass,
  optionExpedition,
  portfolio,
  signedPercent,
} from '../src/data.js'

test('portfolio holdings have unique ids and required game fields', () => {
  assert.equal(new Set(holdings.map(({ id }) => id)).size, holdings.length)
  for (const holding of holdings) {
    for (const field of ['id', 'ticker', 'name', 'value', 'weight', 'dayChange', 'mood', 'thesis', 'risk']) {
      assert.notEqual(holding[field], undefined)
    }
  }
})

test('portfolio allocation is complete and matches the portfolio value', () => {
  assert.ok(Math.abs(allocations.reduce((sum, allocation) => sum + allocation.value, 0) - 100) < Number.EPSILON * 100)
  assert.equal(portfolio.value, 12840)
})

test('formatting helpers make movements and values readable', () => {
  assert.equal(formatMoney(12840), '$12,840')
  assert.equal(signedPercent(-1.2), '−1.2%')
  assert.equal(signedPercent(2.4), '+2.4%')
  assert.equal(movementClass(-1.2), 'down')
  assert.equal(movementClass(2.4), 'up')
})

test('options expedition exposes the critical paper-risk terms', () => {
  assert.equal(getHolding('nvidia').hasOption, true)
  for (const field of ['premium', 'contractCost', 'strike', 'breakeven', 'expiration']) {
    assert.ok(optionExpedition[field])
  }
})
