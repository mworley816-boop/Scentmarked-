import test from 'node:test'
import assert from 'node:assert/strict'
import { monthlyProfitHistory } from '../lib/profit-history.ts'
test('builds monthly profit history and top expense category',()=>{const h=monthlyProfitHistory([{gross_cents:100000,fee_cents:10000,status:'paid',occurred_at:'2026-10-03T00:00:00Z'}],[{category:'software',amount_cents:10000,incurred_at:'2026-10-02'},{category:'marketing',amount_cents:20000,incurred_at:'2026-10-04'}],1,new Date('2026-10-06T12:00:00Z'))[0];assert.equal(h.revenueCents,90000);assert.equal(h.expenseCents,30000);assert.equal(h.profitCents,60000);assert.notEqual(h.margin,null);assert.ok(Math.abs((h.margin as number)-2/3)<.0001);assert.equal(h.topExpenseCategory,'marketing')})

test('marks margin unavailable when revenue is zero',()=>{const h=monthlyProfitHistory([],[{category:'software',amount_cents:10000,incurred_at:'2026-10-02'}],1,new Date('2026-10-06T12:00:00Z'))[0];assert.equal(h.revenueCents,0);assert.equal(h.profitCents,-10000);assert.equal(h.margin,null)})

test('marks historical margin unavailable when net revenue is negative',()=>{const h=monthlyProfitHistory([{gross_cents:1000,fee_cents:2000,status:'paid',occurred_at:'2026-10-03T00:00:00Z'}],[],1,new Date('2026-10-06T12:00:00Z'))[0];assert.equal(h.revenueCents,-1000);assert.equal(h.margin,null)})
