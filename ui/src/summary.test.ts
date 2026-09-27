import assert from 'node:assert/strict'
import test from 'node:test'

import type { Stage, Stat } from './types.generated'
import { summarizeStages } from './summary.ts'

function stat(
  metric_type: string,
  cur: string,
  cur_invalid = false,
  value_type = 'METRIC_VALUE_TYPE_NORMAL',
): Stat {
  return {
    metric_type,
    cur,
    cur_invalid,
    delta: '0',
    delta_invalid: false,
    value_type,
    calculate_type: '',
  }
}

function stage(id: string, status: string, stats: Stat[]): Stage {
  return {
    base_info: {
      uid: 'test-uid',
      region: 'test-region',
      stage_id: id,
      stage_name: id,
      cover_url: '',
      latest_online_time: 0,
      game_list_status: status,
    },
    today_stats: stats,
  }
}

test('valid zero values count; invalid zero values are excluded from summaries', () => {
  const result = summarizeStages([
    stage('zero', 'GAME_LIST_STATUS_ONLINE', [
      stat('METRIC_STAGE_TYPE_STAGE_HOT_SCORE', '0'),
      stat('METRIC_STAGE_TYPE_GOOD_RATE', '0', false, 'METRIC_VALUE_TYPE_PER_TEN_THOUSAND'),
    ]),
    stage('positive', 'GAME_LIST_STATUS_ONLINE', [
      stat('METRIC_STAGE_TYPE_STAGE_HOT_SCORE', '100'),
      stat('METRIC_STAGE_TYPE_GOOD_RATE', '5000', false, 'METRIC_VALUE_TYPE_PER_TEN_THOUSAND'),
    ]),
    stage('unavailable', 'GAME_LIST_STATUS_OFFLINE', [
      stat('METRIC_STAGE_TYPE_STAGE_HOT_SCORE', '999', true),
      stat('METRIC_STAGE_TYPE_GOOD_RATE', '0', true, 'METRIC_VALUE_TYPE_PER_TEN_THOUSAND'),
    ]),
  ])

  assert.deepEqual(result, { total: 3, online: 2, hot: 100, rate: 25 })
})

test('missing valid metrics stay unavailable instead of becoming zero', () => {
  const result = summarizeStages([
    stage('unavailable', 'GAME_LIST_STATUS_ONLINE', [
      stat('METRIC_STAGE_TYPE_STAGE_HOT_SCORE', '0', true),
      stat('METRIC_STAGE_TYPE_GOOD_RATE', '0', true),
    ]),
  ])

  assert.equal(result.hot, null)
  assert.equal(result.rate, null)
})
