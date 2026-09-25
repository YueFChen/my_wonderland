import assert from 'node:assert/strict'
import test from 'node:test'
import { needsCollect } from './refresh.ts'

const at = (iso: string) => new Date(iso)

test('never-fetched series needs a collect', () => {
  assert.equal(needsCollect(0, at('2026-09-19T10:00:00')), true)
})

test('same local day is skipped, crossing midnight is not', () => {
  const fetched = Math.floor(at('2026-09-19T08:00:00').getTime() / 1000)
  assert.equal(needsCollect(fetched, at('2026-09-19T23:59:00')), false)
  assert.equal(needsCollect(fetched, at('2026-09-20T00:01:00')), true)
})

test('previous day needs a collect', () => {
  const fetched = Math.floor(at('2026-09-18T23:59:00').getTime() / 1000)
  assert.equal(needsCollect(fetched, at('2026-09-19T00:01:00')), true)
})
