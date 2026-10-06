import test from 'node:test'
import assert from 'node:assert/strict'
import { pnlSummary } from '../lib/pnl-summary.ts'
test('summarizes custom P&L date range',()=>{const p=pnlSummary([{revenue_type:'affiliate',gross_cents:100000,fee_cents:10000,status:'paid',occurred_at:'2026-10-05T12:00:00Z'},{revenue_type:'affiliate',gross_cents:5000,fee_cents:0,status:'refunded',occurred_at:'2026-10-05T12:00:00Z'}],[{category:'software',amount_cents:20000,incurred_at:'2026-10-03'}],'2026-10-01','2026-10-31');assert.equal(p.netRevenueCents,90000);assert.equal(p.expenseCents,20000);assert.equal(p.profitCents,70000);assert.equal(p.revenueTransactions,1);assert.deepEqual(p.revenueByStream,[['affiliate',90000]])})
