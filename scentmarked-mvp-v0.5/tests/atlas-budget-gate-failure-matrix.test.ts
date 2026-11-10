import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasResearchBudgetGate} from '../lib/atlas-research-budget-gate.ts'

const day='2026-11-10'
function harness(reserveResult:{id:string;reservedUsdMicros:number}|null={id:'r1',reservedUsdMicros:4200}){
 const events:string[]=[]
 const store={
  reserve:async(input:{day:string;limitUsdMicros:number;amountUsdMicros:number})=>{
   events.push('reserve:'+input.day+':'+input.amountUsdMicros)
   return reserveResult
  },
  settle:async(input:{reservationId:string;actualUsdMicros:number})=>{
   events.push('settle:'+input.actualUsdMicros)
  }
 }
 const gate=createAtlasResearchBudgetGate({
  dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store,
  now:()=>new Date('2026-11-10T12:00:00Z')
 })
 return {events,gate}
}
test('budget exhausted prevents paid callback',async()=>{
 const {events,gate}=harness(null)
 let invoked=false
 await assert.rejects(gate(async()=>{invoked=true;return {value:'x',actualUsdMicros:0}}),/exhausted/)
 assert.equal(invoked,false)
 assert.deepEqual(events,['reserve:'+day+':4200'])
})
test('failed model call leaves reservation consumed and never settles',async()=>{
 const {events,gate}=harness()
 await assert.rejects(gate(async()=>{events.push('model');throw new Error('provider failed')}),/provider failed/)
 assert.deepEqual(events,['reserve:'+day+':4200','model'])
})
test('actual cost beyond reserve fails without settlement',async()=>{
 const {events,gate}=harness()
 await assert.rejects(gate(async()=>({value:'x',actualUsdMicros:4201})),/exceeds reserved budget/)
 assert.deepEqual(events,['reserve:'+day+':4200'])
})
test('successful research settles measured cost after model',async()=>{
 const {events,gate}=harness()
 assert.equal(await gate(async()=>{events.push('model');return {value:'draft',actualUsdMicros:1200}}),'draft')
 assert.deepEqual(events,['reserve:'+day+':4200','model','settle:1200'])
})
test('reservation store errors prevent model calls',async()=>{
 let invoked=false
 const gate=createAtlasResearchBudgetGate({
  dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,
  store:{reserve:async()=>{throw new Error('database unavailable')},settle:async()=>{}}
 })
 await assert.rejects(gate(async()=>{invoked=true;return {value:'x',actualUsdMicros:0}}),/database unavailable/)
 assert.equal(invoked,false)
})
test('invalid reservation cannot reach model',async()=>{
 const {events,gate}=harness({id:'r1',reservedUsdMicros:4000})
 let invoked=false
 await assert.rejects(gate(async()=>{invoked=true;return {value:'x',actualUsdMicros:0}}),/Invalid Atlas budget reservation/)
 assert.equal(invoked,false)
 assert.equal(events.length,1)
})
test('settlement errors fail closed instead of reporting success',async()=>{
 const gate=createAtlasResearchBudgetGate({
  dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,
  store:{reserve:async()=>({id:'r1',reservedUsdMicros:4200}),
   settle:async()=>{throw new Error('settlement database unavailable')}}
 })
 await assert.rejects(gate(async()=>({value:'draft',actualUsdMicros:100})),/settlement database unavailable/)
})
