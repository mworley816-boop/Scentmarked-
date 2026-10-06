import test from 'node:test'
import assert from 'node:assert/strict'
import { profitabilityMetrics } from '../lib/profitability.ts'
test('calculates monthly profit, margin and expense categories',()=>{const m=profitabilityMetrics(100000,[{category:'software',amount_cents:10000,incurred_at:'2026-10-02'},{category:'marketing',amount_cents:20000,incurred_at:'2026-10-04'},{category:'software',amount_cents:5000,incurred_at:'2026-09-20'}],new Date('2026-10-06T12:00:00Z'));assert.equal(m.expenseCents,30000);assert.equal(m.profitCents,70000);assert.equal(m.profitMargin,.7);assert.deepEqual(m.byCategory,[{category:'marketing',amountCents:20000},{category:'software',amountCents:10000}])})
