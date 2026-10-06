import test from 'node:test'
import assert from 'node:assert/strict'
import { subscriptionMetrics } from '../lib/subscription-metrics.ts'

test('subscription metrics exclude expired periods and separate manual access',()=>{const now=Date.parse('2026-10-06T00:00:00Z'),m=subscriptionMetrics([{status:'active',provider:'manual',current_period_end:'2026-11-01T00:00:00Z'},{status:'trialing',provider:'stripe',current_period_end:'2026-10-20T00:00:00Z',cancel_at_period_end:true},{status:'active',provider:'stripe',current_period_end:'2026-09-01T00:00:00Z'},{status:'past_due',provider:'stripe'}],now);assert.deepEqual(m,{active:2,trialing:1,manual:1,cancelAtPeriodEnd:1,pastDue:1})})
