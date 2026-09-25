import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMetric, numeric, trendPoints } from './metrics.ts'
test('percent, x100, score and duration retain upstream units',()=>{
 assert.equal(formatMetric('9650','METRIC_VALUE_TYPE_PER_TEN_THOUSAND','good'),'96.5%')
 assert.equal(formatMetric('125','METRIC_VALUE_TYPE_DOUBLE_X100','average'),'1.3')
 assert.equal(formatMetric('125','METRIC_VALUE_TYPE_SCORE','METRIC_USER_TYPE_PLAY_SCALE_CUMULATIVE'),'1.25')
 assert.equal(formatMetric('3661','METRIC_VALUE_TYPE_SECOND','time'),'1小时 1分 1秒')
 assert.equal(formatMetric('0','METRIC_VALUE_TYPE_NORMAL','count'),'0')
 assert.equal(formatMetric('0','METRIC_VALUE_TYPE_NORMAL','count',true),'—')
 assert.equal(numeric('','METRIC_VALUE_TYPE_NORMAL','count'),null)
})
test('history preserves gaps and ordering',()=>{
 const trend={daily_stats:[{date:'2026-08-02',cur_invalid:true},{date:'2026-08-01',cur_invalid:false}]}
 assert.deepEqual(trendPoints(trend as never,1).map(p=>[p.date,p.cur_invalid]),[['2026-08-02',true]])
})
