import test from 'node:test'
import assert from 'node:assert/strict'
import { canSubmit, formatDuration, selectedTotal, toggleSelection } from '../game-core.js'

test('selection toggles without exceeding the server limit', () => {
  let selected = new Set()
  for (let index = 0; index < 5; index += 1) selected = toggleSelection(selected, index)
  assert.deepEqual([...selected], [0, 1, 2, 3])
  assert.deepEqual([...toggleSelection(selected, 2)], [0, 1, 3])
})

test('submission requires two to four cells matching the target', () => {
  const cells = [4, 7, 9, 12]
  assert.equal(selectedTotal(cells, new Set([0, 2])), 13)
  assert.equal(canSubmit(cells, new Set([0, 2]), 13), true)
  assert.equal(canSubmit(cells, new Set([2]), 9), false)
})

test('durations use a stable timer format', () => {
  assert.equal(formatDuration(62_009), '01:02.009')
  assert.equal(formatDuration(-10), '00:00.000')
})
