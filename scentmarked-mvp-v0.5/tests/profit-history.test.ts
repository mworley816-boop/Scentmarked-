import test from 'node:test'
import assert from 'node:assert/strict'
import { monthlyProfitHistory } from '../lib/profit-history.ts'
test('builds monthly profit history and top expense category',()=>{const h=monthlyProfitHistory([{gross_cents:100000,fee_cents:10000,status:'paid',occurred_at:'2026-10-03T00:00:00Z'}],[{category:'software',amount_cents:10000,incurred_at:'2026-10-02'},{category:'marketing',amount_cents:20000,incurred_at:'2026-10-04'}],1,new Date('2026-10-06T12:00:00Z'))[0];assert.equal(h.revenueCents,90000);assert.equal(h.expenseCents,30000);assert.equal(h.profitCents,60000);assert.ok(Math.abs(h.margin-2/3)<.0001);assert.equal(h.topExpenseCategory,'marketing')})
