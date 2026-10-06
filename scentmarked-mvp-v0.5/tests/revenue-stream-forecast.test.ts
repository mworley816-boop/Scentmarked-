import test from 'node:test'
import assert from 'node:assert/strict'
import { revenueStreamForecast } from '../lib/revenue-stream-forecast.ts'
const now=new Date('2026-10-10T12:00:00Z')
test('forecasts each revenue stream from month-to-date pace',()=>{
 const rows:any[]=[
  {revenue_type:'affiliate',gross_cents:11000,fee_cents:1000,status:'paid',occurred_at:'2026-10-02T00:00:00Z'},
  {revenue_type:'affiliate',gross_cents:5000,fee_cents:0,status:'confirmed',occurred_at:'2026-10-05T00:00:00Z'},
  {revenue_type:'sponsorship',gross_cents:5000,fee_cents:0,status:'paid',occurred_at:'2026-10-06T00:00:00Z'}
 ]
 const m=revenueStreamForecast(rows,now),affiliate=m.find(x=>x.type==='affiliate')!,sponsor=m.find(x=>x.type==='sponsorship')!
 assert.equal(affiliate.monthToDateCents,15000);assert.equal(affiliate.projectedCents,46500);assert.equal(affiliate.transactions,2);assert.equal(affiliate.share,.75)
 assert.equal(sponsor.monthToDateCents,5000);assert.equal(sponsor.projectedCents,15500)
})
test('excludes refunds, voids and prior months',()=>{
 const rows:any[]=[
  {revenue_type:'advertising',gross_cents:9000,fee_cents:0,status:'refunded',occurred_at:'2026-10-02T00:00:00Z'},
  {revenue_type:'subscription',gross_cents:5000,fee_cents:0,status:'paid',occurred_at:'2026-09-20T00:00:00Z'}
 ]
 assert.ok(revenueStreamForecast(rows,now).every(x=>x.monthToDateCents===0&&x.projectedCents===0))
})
