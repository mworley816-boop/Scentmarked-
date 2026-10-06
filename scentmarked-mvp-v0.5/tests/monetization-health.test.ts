import test from 'node:test'
import assert from 'node:assert/strict'
import { monetizationHealthAlerts } from '../lib/monetization-health.ts'
const base:any={goal:{goalCents:100000,projectedCents:120000,onPace:true},pendingCents:1000,realizedCents:9000,reconciliation:{conflict:0,unresolved:0},affiliateClicks:10,affiliateConversions:1,streams:[{type:'affiliate',monthToDateCents:1000,projectedCents:3000},{type:'sponsorship',monthToDateCents:1000,projectedCents:3000},{type:'advertising',monthToDateCents:1000,projectedCents:3000},{type:'subscription',monthToDateCents:1000,projectedCents:3000}]}
test('flags goal pace, pending revenue, conflicts, unresolved attribution and low conversion',()=>{
 const alerts=monetizationHealthAlerts({...base,goal:{goalCents:100000,projectedCents:50000,onPace:false},pendingCents:6000,realizedCents:4000,reconciliation:{conflict:2,unresolved:3},affiliateClicks:100,affiliateConversions:0})
 const codes=alerts.map(x=>x.code)
 for(const code of ['below_goal_pace','high_pending','attribution_conflicts','unresolved_attribution','low_affiliate_conversion'])assert.ok(codes.includes(code))
})
test('flags inactive streams as informational',()=>{const alerts=monetizationHealthAlerts({...base,streams:[...base.streams.slice(0,3),{type:'subscription',monthToDateCents:0,projectedCents:0}]});assert.equal(alerts.find(x=>x.code==='inactive_subscription')?.severity,'info')})
test('stays quiet when core metrics are healthy',()=>assert.equal(monetizationHealthAlerts(base).length,0))
