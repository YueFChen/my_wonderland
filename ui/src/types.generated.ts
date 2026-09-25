// Generated from Rust by examples/generate_bindings.rs. Do not edit.
export type Scope = { account_key: string, uid: string, region: string, };
export type Stat = { metric_type: string, cur: string, cur_invalid: boolean, delta: string, delta_invalid: boolean, value_type: string, calculate_type: string, };
export type DailyStat = { date: string, cur: string, delta: string, value_type: string, cur_invalid: boolean, };
export type DistributionRange = { min: string, max: string, };
export type DistributionConfig = { group_index: number, name_mi18n_key: string, ranges: Array<DistributionRange>, };
export type Bucket = { min: string, max: string, count: string, percent: number, };
export type DistributionDay = { date: string, buckets: Array<Bucket>, };
export type DistributionData = { daily_items: Array<DistributionDay>, };
export type Distribution = { group_configs: Array<DistributionConfig>, group_data: { [key in string]: DistributionData }, recommended_group_index: number, };
export type Trend = { metric_type: string, delta_7_day: string, delta_7_day_invalid: boolean, delta_30_day: string, delta_30_day_invalid: boolean, daily_stats: Array<DailyStat>, value_type: string, calculate_type: string, normalized_stats_7d: Array<DailyStat>, multi_group_dist: Distribution | null, };
export type StageInfo = { uid: string, region: string, stage_id: string, stage_name: string, cover_url: string, latest_online_time: number, game_list_status: string, };
export type Stage = { base_info: StageInfo, today_stats: Array<Stat>, };
export type Overview = { today_str: string, today_stats: Array<Stat>, trend_data: Array<Trend>, };
export type MetricGroup = { group_type: string, metric_types: Array<string>, };
export type Comment = { comment_id: string, nickname: string, content: string, is_recommend: boolean, comment_unix: number, };
export type Comments = { total_comment_num: string, comment_list: Array<Comment>, };
export type Detail = { today_str: string, stage_info: StageInfo, today_stats: Array<Stat>, trend_data: Array<Trend>, metric_groups: Array<MetricGroup>, comment_module_info: Comments, };
export type Series = { schema_version: number, scope: Scope,
/**
 * 最近一次采集时间（Unix 秒）。
 */
updated_at: number,
/**
 * 累计采集次数。
 */
fetch_count: number, overview: Overview, stages: Array<Stage>, details: { [key in string]: Detail }, };
