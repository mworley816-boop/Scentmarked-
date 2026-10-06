import test from 'node:test'
import assert from 'node:assert/strict'
import { filterRevenuePeriod, normalizeRevenuePeriod, revenuePeriodStart } from '../lib/revenue-period.ts'
const now=new Date('2026-10-06T12:00:00Z')
test('normalizes reporting period',()=>{assert.equal(normalizeRevenuePeriod('7d'),'7d');assert.equal(normalizeRevenuePeriod('bad'),'30d')})
test('calculates rolling starts',()=>{assert.equal(revenuePeriodStart('7d',now)?.toISOString(),'2026-09-29T12:00:00.000Z');assert.equal(revenuePeriodStart('all',now),null)})
test('filters rows to the selected rolling period',()=>{
 const rows=[{occurred_at:'2026-10-05T00:00:00Z',id:1},{occurred_at:'2026-09-01T00:00:00Z',id:2}]
 assert.deepEqual(filterRevenuePeriod(rows,'30d',now).map(x=>x.id),[1]);assert.equal(filterRevenuePeriod(rows,'all',now).length,2)
})
