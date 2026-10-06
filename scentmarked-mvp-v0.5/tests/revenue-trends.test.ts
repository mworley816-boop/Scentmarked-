import test from 'node:test'
import assert from 'node:assert/strict'
import { revenueTrendMetrics } from '../lib/revenue-trends.ts'

const now=new Date('2026-10-15T12:00:00Z')
test('compares current and previous month net revenue',()=>{
 const rows:any[]=[
  {gross_cents:12000,fee_cents:2000,status:'paid',occurred_at:'2026-10-03T00:00:00Z'},
  {gross_cents:6000,fee_cents:1000,status:'confirmed',occurred_at:'2026-10-10T00:00:00Z'},
  {gross_cents:5000,fee_cents:0,status:'paid',occurred_at:'2026-09-10T00:00:00Z'}
 ]
 const m=revenueTrendMetrics(rows,now)
 assert.equal(m.currentNetCents,15000);assert.equal(m.previousNetCents,5000);assert.equal(m.growthRate,2)
 assert.equal(m.currentTransactions,2);assert.equal(m.previousTransactions,1)
})
test('tracks pending separately and excludes refunded or void revenue',()=>{
 const rows:any[]=[
  {gross_cents:3000,fee_cents:500,status:'pending',occurred_at:'2026-10-01T00:00:00Z'},
  {gross_cents:7000,fee_cents:1000,status:'confirmed',occurred_at:'2026-10-02T00:00:00Z'},
  {gross_cents:9000,fee_cents:0,status:'refunded',occurred_at:'2026-10-03T00:00:00Z'}
 ]
 const m=revenueTrendMetrics(rows,now)
 assert.equal(m.pendingCents,2500);assert.equal(m.realizedCents,6000);assert.equal(m.currentNetCents,8500)
})
test('reports 100 percent growth when revenue starts from zero',()=>{
 const m=revenueTrendMetrics([{gross_cents:1000,fee_cents:0,status:'paid',occurred_at:'2026-10-02T00:00:00Z'}] as any,now)
 assert.equal(m.growthRate,1)
})
