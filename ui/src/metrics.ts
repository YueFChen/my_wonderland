import type { Stat, Trend } from './types.generated'

// 显式写 `/index.ts`：本模块被 `node --experimental-strip-types --test` 直接加载，
// 而 Node 的 ESM 解析不支持目录导入。
import { t } from './i18n/index.ts'

/** 官方值类型 / 特殊指标到数值的还原；返回 null 表示无效值，不按 0 计算。 */
export function numeric(value: string, type: string, metric: string): number | null {
  if (value.trim() === '' || !Number.isFinite(Number(value))) return null
  const n = Number(value)
  const scaled =
    type === 'METRIC_VALUE_TYPE_PER_TEN_THOUSAND' ||
    type === 'METRIC_VALUE_TYPE_DOUBLE_X100' ||
    metric === 'METRIC_USER_TYPE_PLAY_SCALE_CUMULATIVE'
  return scaled ? n / 100 : n
}

export function formatMetric(
  value: string,
  type: string,
  metric: string,
  invalid = false,
  calculate = '',
): string {
  const n = numeric(value, type, metric)
  if (invalid || n === null) return '—'
  if (type === 'METRIC_VALUE_TYPE_SECOND') {
    const sec = Math.floor(Math.abs(n))
    const hours = Math.floor(sec / 3600)
    const hoursPart = hours > 0 ? `${t('metric.hours', { hours })} ` : ''
    const duration = t('metric.duration', {
      minutes: Math.floor((sec % 3600) / 60),
      seconds: sec % 60,
    })
    return `${n < 0 ? '-' : ''}${hoursPart}${duration}`
  }
  const precision =
    metric === 'METRIC_USER_TYPE_PLAY_SCALE_CUMULATIVE'
      ? 2
      : type === 'METRIC_VALUE_TYPE_PER_TEN_THOUSAND' || type === 'METRIC_VALUE_TYPE_DOUBLE_X100'
        ? 1
        : 0
  const factor = 10 ** precision
  const rounded = calculate === 'METRIC_CALCULATE_TYPE_FLOOR' ? Math.floor(n * factor) / factor : n
  return (
    rounded.toLocaleString('zh-CN', { maximumFractionDigits: precision }) +
    (type === 'METRIC_VALUE_TYPE_PER_TEN_THOUSAND' ? '%' : '')
  )
}

export function formatStat(stat: Stat): string {
  return formatMetric(stat.cur, stat.value_type, stat.metric_type, stat.cur_invalid, stat.calculate_type)
}

/** 近 7 天的部分指标使用官方归一化序列；其余用原始日序列。 */
export function trendPoints(trend: Trend, days: number) {
  const normalized =
    days === 7 &&
    ['METRIC_USER_TYPE_STAGE_PLAY_USERS', 'METRIC_USER_TYPE_SUBSCRIBER_NUM'].includes(trend.metric_type) &&
    trend.normalized_stats_7d?.length
      ? trend.normalized_stats_7d
      : trend.daily_stats
  const points = [...normalized].sort((a, b) => a.date.localeCompare(b.date))
  return days ? points.slice(-days) : points
}
