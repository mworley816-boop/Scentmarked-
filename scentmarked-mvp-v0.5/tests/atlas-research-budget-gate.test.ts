import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasResearchBudgetGate} from '../lib/atlas-research-budget-gate.ts'

test('budget gate reserves before running and settles actual cost',async()=>{
 const events:string[]=[]
 const gate=createAtlasResearchBudgetGate({
  dailyLimitUsdMicros:1000000,perRequestReserveUsdMicros:100000,
  now:()=>new Date('2026-11-06T12:00:00Z'),
  store:{
   reserve:async input=>{events.push('reserve:'+input.day);return {id:'r1',reservedUsdMicros:input.amountUsdMicros}},
   settle:async input=>{events.push('settle:'+input.actualUsdMicros)}
  }
 })
 assert.equal(await gate(async()=>{events.push('run');return {value:'ok',actualUsdMicros:40000}}),'ok')
 assert.deepEqual(events,['reserve:2026-11-06','run','settle:40000'])
})
test('budget denial never calls the model',async()=>{
 let ran=false
 const gate=createAtlasResearchBudgetGate({
  dailyLimitUsdMicros:100,perRequestReserveUsdMicros:100,
  store:{reserve:async()=>null,settle:async()=>{throw new Error('unexpected settle')}}
 })
 await assert.rejects(gate(async()=>{ran=true;return {value:'bad',actualUsdMicros:0}}),/exhausted/)
 assert.equal(ran,false)
})
test('invalid or under-reserved usage fails closed',async()=>{
 const gate=createAtlasResearchBudgetGate({
  dailyLimitUsdMicros:100,perRequestReserveUsdMicros:50,
  store:{reserve:async()=>({id:'r',reservedUsdMicros:50}),settle:async()=>{throw new Error('unexpected settle')}}
 })
 await assert.rejects(gate(async()=>({value:'x',actualUsdMicros:51})),/exceeds reserved/)
})
