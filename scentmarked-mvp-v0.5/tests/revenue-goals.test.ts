import test from 'node:test'
import assert from 'node:assert/strict'
import { revenueGoalMetrics } from '../lib/revenue-goals.ts'
test('calculates goal progress and projection',()=>{const m=revenueGoalMetrics(50000,100000,new Date('2026-10-10T12:00:00Z'));assert.equal(m.progress,.5);assert.equal(m.projectedCents,155000);assert.equal(m.remainingCents,50000);assert.equal(m.dailyNeededCents,2381);assert.equal(m.onPace,true)})
test('shows no daily requirement after goal is reached',()=>{const m=revenueGoalMetrics(120000,100000,new Date('2026-10-20T12:00:00Z'));assert.equal(m.remainingCents,0);assert.equal(m.dailyNeededCents,0)})
