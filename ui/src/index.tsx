import { useEffect, useMemo, useRef, useState } from 'react'
import type { Scope, Series, Stage } from './types.generated'
import type { AccountSnapshot } from '@wonderland/plugin-ui-sdk'

import { Trends } from './Charts'
import { DetailView } from './DetailView'
import { WorksGrid } from './WorksView'
import { errorMessage, formatTime } from './display'
import { t, type MessageKey } from './i18n'
import { numeric } from './metrics'
import { needsCollect } from './refresh'
import './style.css'

/** 插件前端与宿主之间的契约；实现由 shell 提供（见 apps/desktop）。 */
export interface WonderlandApi {
  /** Read a current account snapshot through the Core account proxy. */
  accountSnapshot(): Promise<AccountSnapshot>
  /** 采集一次并并入本地序列，返回合并后的序列。 */
  collect(scope: Scope): Promise<Series>
  /** 只读本地序列；从未采集过时为 null。 */
  series(scope: Scope): Promise<Series | null>
}

interface Props {
  api: WonderlandApi
  snapshot: AccountSnapshot | null
}

type Filter = 'all' | 'online' | 'offline' | 'deleted'

// 存 key 而不是取好的文案：这张表是模块级常量，取值留到渲染时才发生。
const FILTERS: { value: Filter; labelKey: MessageKey; emptyKey: MessageKey; status?: string }[] = [
  { value: 'all', labelKey: 'works.filterAll', emptyKey: 'works.empty' },
  {
    value: 'online',
    labelKey: 'works.filterOnline',
    emptyKey: 'works.emptyOnline',
    status: 'GAME_LIST_STATUS_ONLINE',
  },
  {
    value: 'offline',
    labelKey: 'works.filterOffline',
    emptyKey: 'works.emptyOffline',
    status: 'GAME_LIST_STATUS_OFFLINE',
  },
  {
    value: 'deleted',
    labelKey: 'works.filterDeleted',
    emptyKey: 'works.emptyDeleted',
    status: 'GAME_LIST_STATUS_DELETED',
  },
]

const HOT = 'METRIC_STAGE_TYPE_STAGE_HOT_SCORE'
const RATE = 'METRIC_STAGE_TYPE_GOOD_RATE'
const ONLINE = 'GAME_LIST_STATUS_ONLINE'

const scopeKey = (scope: Scope) => `${scope.account_key}/${scope.region}/${scope.uid}`
const emptyScope: Scope = { account_key: '', uid: '', region: '' }

const stageMetric = (stage: Stage, metric: string): number | null => {
  const stat = stage.today_stats.find((item) => item.metric_type === metric)
  return stat ? numeric(stat.cur, stat.value_type, stat.metric_type) : null
}

export function MyWonderlandPage({ api, snapshot }: Props) {
  const [series, setSeries] = useState<Series | null>(null)
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [stageId, setStageId] = useState<string | null>(null)
  // 账号/角色切换后丢弃在途响应，避免旧数据覆盖新选择。
  const generation = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      generation.current++
    }
  }, [])

  // 可选范围 = 当前账号绑定的游戏角色（采集要求角色属于该账号）。
  const scopes = useMemo(() => {
    const list: { scope: Scope; label: string }[] = []
    for (const account of snapshot?.accounts ?? []) {
      for (const role of account.game_roles) {
        list.push({
          scope: { account_key: account.account_key, uid: role.uid, region: role.region },
          label: `${role.nickname} · ${role.region_name} · ${role.uid}`,
        })
      }
    }
    return list
  }, [snapshot])

  const current = scopes.find((item) => item.scope.account_key === snapshot?.current_account_key)
  const key = selected || scopeKey(current?.scope ?? scopes[0]?.scope ?? emptyScope)
  const chosen = scopes.find((item) => scopeKey(item.scope) === key)
  const scope = chosen?.scope

  useEffect(() => {
    const id = ++generation.current
    setSeries(null)
    setError('')
    setStageId(null)
    setFilter('all')
    setBusy(false)
    if (!scope) {
      setLoading(false)
      return
    }
    setLoading(true)
    void (async () => {
      try {
        // 先用本地序列秒开，再按「当天是否已抓过」决定要不要自动更新。
        const cached = await api.series(scope)
        if (generation.current !== id || !mounted.current) return
        setSeries(cached)
        setLoading(false)
        if (cached && !needsCollect(cached.updated_at)) return
        setBusy(true)
        const fresh = await api.collect(scope)
        if (generation.current !== id || !mounted.current) return
        setSeries(fresh)
        setError('')
      } catch (cause) {
        if (generation.current === id && mounted.current) setError(errorMessage(cause))
      } finally {
        if (generation.current === id && mounted.current) {
          setLoading(false)
          setBusy(false)
        }
      }
    })()
    return () => {
      generation.current++
    }
    // scope 每次账号刷新都会重建，用稳定的 key 代表其身份。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, key])

  const active = FILTERS.find((item) => item.value === filter) ?? FILTERS[0]
  const stages = useMemo(() => {
    const list = series?.stages ?? []
    return active.status ? list.filter((stage) => stage.base_info.game_list_status === active.status) : list
  }, [series, active.status])

  // 概览统计：总关卡数 / 在线关卡 / 总热度 / 平均好评率。
  const summary = useMemo(() => {
    const list = series?.stages ?? []
    let hot = 0
    const rates: number[] = []
    for (const stage of list) {
      hot += stageMetric(stage, HOT) ?? 0
      const rate = stageMetric(stage, RATE)
      if (rate !== null && rate > 0) rates.push(rate)
    }
    return {
      total: list.length,
      online: list.filter((stage) => stage.base_info.game_list_status === ONLINE).length,
      hot,
      rate: rates.length ? rates.reduce((sum, value) => sum + value, 0) / rates.length : null,
    }
  }, [series])

  const detail = stageId ? series?.details[stageId] : undefined

  return (
    <section className="mw" aria-label={t('works.title')}>
      <div className="mw-toolbar">
        <label>
          {t('works.account')}
          <select
            aria-label={t('works.account')}
            value={key}
            onChange={(event) => {
              generation.current++
              setSelected(event.target.value)
            }}
          >
            {scopes.map((item) => (
              <option key={scopeKey(item.scope)} value={scopeKey(item.scope)}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <span>
          {busy
            ? t('works.updating')
            : series
              ? `${t('works.updatedAt')} · ${formatTime(series.updated_at)}`
              : t('works.archivePolicy')}
        </span>
      </div>

      {!scope && <div className="mw-empty">{t('works.noAccount')}</div>}
      {error && (
        <div className="mw-error" role="alert">
          <span>{error}</span>
        </div>
      )}
      {busy && (
        <div className="mw-progress" role="status">
          <span />
          {t('works.collecting')}
          <small>{t('works.partial')}</small>
        </div>
      )}

      {loading ? (
        <div className="mw-empty" role="status">
          {t('works.loading')}
        </div>
      ) : !series ? (
        <div className="mw-empty">{t('works.emptyLocal')}</div>
      ) : detail ? (
        <>
          <button className="mw-back" onClick={() => setStageId(null)}>
            ← {t('works.back')}
          </button>
          <DetailView detail={detail} />
        </>
      ) : (
        <>
          <div className="mw-stats">
            <article className="mw-stat">
              <span>{t('works.totalStages')}</span>
              <strong>{summary.total}</strong>
            </article>
            <article className="mw-stat">
              <span>{t('works.onlineStages')}</span>
              <strong>{summary.online}</strong>
            </article>
            <article className="mw-stat">
              <span>{t('works.totalHot')}</span>
              <strong>{summary.hot.toLocaleString('zh-CN')}</strong>
            </article>
            <article className="mw-stat">
              <span>{t('works.avgRate')}</span>
              <strong>{summary.rate === null ? '—' : `${summary.rate.toFixed(2)}%`}</strong>
            </article>
          </div>

          <nav className="mw-filters" aria-label={t('works.filterAria')}>
            {FILTERS.map((item) => (
              <button
                key={item.value}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </nav>

          <WorksGrid
            key={filter}
            stages={stages}
            details={series.details}
            empty={t(active.emptyKey)}
            onOpen={(id) => setStageId(id)}
          />

          {series.overview.trend_data.length > 0 && <Trends trends={series.overview.trend_data} />}
        </>
      )}

      <footer>{t('works.invalid')}</footer>
    </section>
  )
}
