import test from 'node:test'
import assert from 'node:assert/strict'
import { money, monetizationSummary, netCents } from '../lib/monetization.ts'

test('net revenue subtracts fees',()=>assert.equal(netCents({gross_cents:1250,fee_cents:150}),1100))
test('net revenue never becomes negative',()=>assert.equal(netCents({gross_cents:100,fee_cents:150}),0))
test('summary excludes refunded and void revenue',()=>{
 const summary=monetizationSummary([
  {revenue_type:'affiliate',gross_cents:1000,fee_cents:100,status:'paid',occurred_at:'2026-10-01',currency:'USD'},
  {revenue_type:'sponsorship',gross_cents:5000,fee_cents:0,status:'confirmed',occurred_at:'2026-10-02',currency:'USD'},
  {revenue_type:'advertising',gross_cents:2000,fee_cents:0,status:'refunded',occurred_at:'2026-10-03',currency:'USD'},
 ])
 assert.equal(summary.grossCents,6000)
 assert.equal(summary.feeCents,100)
 assert.equal(summary.netCents,5900)
 assert.equal(summary.byType.get('affiliate'),900)
 assert.equal(summary.byType.get('sponsorship'),5000)
})
test('money formats cents',()=>assert.equal(money(12345),'$123.45'))
