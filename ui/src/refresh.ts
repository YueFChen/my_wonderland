/**
 * 采集时机策略。
 *
 * 官方数据日更，同一天内重复采集只会拿到同样的点位，因此进入页面时先读本地序列，
 * 只有"不是今天抓的"才触发采集。
 *
 * 这条策略为什么留在前端：Rust 工作区没有日期/时区库（`chrono` / `time` 都不在依赖里），
 * 而官方的 `today_str` 要发过请求才知道——放进后端反而要多一次请求才能判断。
 * 因此把它做成不碰 DOM、不碰网络的纯函数，`now` 由调用方注入，任何入口共用同一份判断。
 */

/** 是否需要采集：从未采过，或上次采集不在 `now` 所在的本地日期。 */
export function needsCollect(updatedAt: number, now: Date = new Date()): boolean {
  if (!updatedAt) {
    return true
  }
  const fetched = new Date(updatedAt * 1000)
  return (
    fetched.getFullYear() !== now.getFullYear() ||
    fetched.getMonth() !== now.getMonth() ||
    fetched.getDate() !== now.getDate()
  )
}
