import { useState } from 'react'
import type { Detail, Stage } from './types.generated'

import { statusClass, statusLabel } from './display'
import { t, type MessageKey } from './i18n'
import { formatMetric } from './metrics'

const PAGE_SIZE = 12
// 存 key 而不是取好的文案：卡片是模块级常量，取值留到渲染时才发生。
const CARD_METRICS: [string, MessageKey][] = [
  ['METRIC_STAGE_TYPE_STAGE_HOT_SCORE', 'works.hotScore'],
  ['METRIC_STAGE_TYPE_GOOD_RATE', 'works.goodRate'],
  ['METRIC_STAGE_TYPE_AVG_TIME', 'works.avgTime'],
]

interface WorksGridProps {
  stages: Stage[]
  /** 已抓取详情的作品集合；缺失（如官网已删除）的作品不可进入详情。 */
  details: Record<string, Detail>
  /** 当前筛选下的空态文案。 */
  empty: string
  onOpen: (stageId: string) => void
}

function cardValue(stage: Stage, metric: string): string {
  const stat = stage.today_stats.find((item) => item.metric_type === metric)
  if (!stat) return '—'
  return formatMetric(stat.cur, stat.value_type, stat.metric_type, stat.cur_invalid, stat.calculate_type)
}

/** 作品卡片网格：封面 + 状态徽章 + 热度/推荐率/平均时长；点开进入详情。 */
export function WorksGrid({ stages, details, empty, onOpen }: WorksGridProps) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(stages.length / PAGE_SIZE))
  const current = Math.min(page, pages)

  if (stages.length === 0) {
    return <div className="mw-empty">{empty}</div>
  }

  return (
    <>
      <div className="mw-grid">
        {stages.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((stage) => {
          const info = stage.base_info
          const openable = Boolean(details[info.stage_id])
          const cover = info.cover_url?.startsWith('https://') ? info.cover_url : ''
          return (
            <article
              key={info.stage_id}
              className="mw-card"
              data-openable={openable}
              onClick={openable ? () => onOpen(info.stage_id) : undefined}
            >
              <div className="mw-card-cover">
                {cover ? (
                  <img src={cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="mw-card-blank" />
                )}
                <span className={`mw-status ${statusClass(info.game_list_status)}`}>
                  {statusLabel(info.game_list_status)}
                </span>
                {openable && <span className="mw-card-hint">{t('works.viewDetail')}</span>}
              </div>
              <div className="mw-card-body">
                <h3 title={info.stage_name}>{info.stage_name}</h3>
                <div className="mw-card-stats">
                  {CARD_METRICS.map(([metric, labelKey]) => (
                    <span key={metric}>
                      <small>{t(labelKey)}</small>
                      <strong>{cardValue(stage, metric)}</strong>
                    </span>
                  ))}
                </div>
                <div className="mw-card-id">
                  {t('works.stageId')}: {info.stage_id}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {pages > 1 && (
        <div className="mw-pagination">
          <button disabled={current <= 1} onClick={() => setPage(current - 1)}>
            {t('works.previous')}
          </button>
          <span>
            {current} / {pages} · {t('common.worksUnit', { count: stages.length })}
          </span>
          <button disabled={current >= pages} onClick={() => setPage(current + 1)}>
            {t('works.next')}
          </button>
        </div>
      )}
    </>
  )
}
