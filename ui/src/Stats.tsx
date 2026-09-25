import type { Stat } from './types.generated'

import { formatMetric, formatStat } from './metrics'
import { t } from './i18n'
import { metricLabel } from './i18n/metric'

/** 今日指标卡片；delta 无效时展示占位而不按 0 计算。 */
export function Stats({ stats }: { stats: Stat[] }) {
  return (
    <div className="mw-stats">
      {stats.map((stat) => {
        const delta = formatMetric(
          stat.delta,
          stat.value_type,
          stat.metric_type,
          stat.delta_invalid,
          stat.calculate_type,
        )
        const rising = !stat.delta_invalid && Number(stat.delta) > 0
        return (
          <article className="mw-stat" key={stat.metric_type}>
            <span>{metricLabel(stat.metric_type)}</span>
            <strong>{formatStat(stat)}</strong>
            <small>
              {t('stats.changedVsYesterday')}{' '}
              <em className={rising ? 'mw-up' : ''}>
                {rising ? '+' : ''}
                {delta}
              </em>
            </small>
          </article>
        )
      })}
    </div>
  )
}
