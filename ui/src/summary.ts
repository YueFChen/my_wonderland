import type { Stage } from './types.generated'

import { numeric } from './metrics.ts'

const HOT = 'METRIC_STAGE_TYPE_STAGE_HOT_SCORE'
const RATE = 'METRIC_STAGE_TYPE_GOOD_RATE'
const ONLINE = 'GAME_LIST_STATUS_ONLINE'

function stageMetric(stage: Stage, metric: string): number | null {
  const stat = stage.today_stats.find((item) => item.metric_type === metric)
  return !stat || stat.cur_invalid ? null : numeric(stat.cur, stat.value_type, stat.metric_type)
}

export function summarizeStages(stages: Stage[]) {
  let hotTotal = 0
  let hotCount = 0
  const rates: number[] = []

  for (const stage of stages) {
    const hot = stageMetric(stage, HOT)
    if (hot !== null) {
      hotTotal += hot
      hotCount++
    }
    const rate = stageMetric(stage, RATE)
    if (rate !== null) rates.push(rate)
  }

  return {
    total: stages.length,
    online: stages.filter((stage) => stage.base_info.game_list_status === ONLINE).length,
    hot: hotCount ? hotTotal : null,
    rate: rates.length ? rates.reduce((sum, value) => sum + value, 0) / rates.length : null,
  }
}
