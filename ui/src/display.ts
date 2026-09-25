import { t } from './i18n'

/** 归档/评论时间：Unix 秒 → 本地化字符串。 */
export const formatTime = (seconds: number) => new Date(seconds * 1000).toLocaleString('zh-CN')

/** 官方作品状态码 → 展示文案。 */
export const statusLabel = (status: string) =>
  status === 'GAME_LIST_STATUS_ONLINE'
    ? t('common.statusOnline')
    : status === 'GAME_LIST_STATUS_OFFLINE'
      ? t('common.statusOffline')
      : status === 'GAME_LIST_STATUS_DELETED'
        ? t('common.statusDeleted')
        : t('common.unknown')

/** 官方作品状态码 → 徽章修饰类。 */
export const statusClass = (status: string) =>
  status === 'GAME_LIST_STATUS_ONLINE'
    ? 'mw-status--online'
    : status === 'GAME_LIST_STATUS_OFFLINE'
      ? 'mw-status--offline'
      : 'mw-status--deleted'

/** IPC 错误载荷优先取 message，其余落到通用失败文案。 */
export const errorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String(error.message) : t('common.failed')
