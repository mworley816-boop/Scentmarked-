import test from 'node:test'
import assert from 'node:assert/strict'
import { monthlyRevenueHistory } from '../lib/revenue-history.ts'
test('builds monthly revenue and preserves historical goals',()=>{
 const rows:any[]=[{gross_cents:10000,fee_cents:1000,status:'paid',occurred_at:'2026-09-10T00:00:00Z'},{gross_cents:20000,fee_cents:0,status:'paid',occurred_at:'2026-10-05T00:00:00Z'}]
 const goals:any[]=[{month_start:'2026-09-01',goal_cents:8000,currency:'USD'},{month_start:'2026-10-01',goal_cents:25000,currency:'USD'}]
 const h=monthlyRevenueHistory(rows,goals,2,new Date('2026-10-06T12:00:00Z'))
 assert.equal(h[0].netCents,9000);assert.equal(h[0].goalHit,true);assert.equal(h[1].netCents,20000);assert.equal(h[1].goalHit,false);assert.ok(Math.abs((h[1].changeRate||0)-1.2222222)<.0001)
})
test('excludes refunded and void revenue',()=>{const h=monthlyRevenueHistory([{gross_cents:10000,fee_cents:0,status:'refunded',occurred_at:'2026-10-05T00:00:00Z'}],[],1,new Date('2026-10-06T12:00:00Z'));assert.equal(h[0].netCents,0)})
