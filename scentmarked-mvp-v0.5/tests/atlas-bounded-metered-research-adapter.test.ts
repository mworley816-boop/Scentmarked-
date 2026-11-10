import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasBoundedMeteredResearchAdapter} from '../lib/atlas-bounded-metered-research-adapter.ts'
const rates={inputUsdMicrosPerMillion:1000000,cachedInputUsdMicrosPerMillion:250000,outputUsdMicrosPerMillion:4000000}
const evidence={proposedText:'Supported text',sources:[{url:'https://example.org',claim:'Supported'}]}
const usage={inputTokens:1000,cachedInputTokens:200,outputTokens:100,totalTokens:1100}
test('rejects underfunded reservation before any model or store calls',()=>{
 let called=false
 assert.throws(()=>createAtlasBoundedMeteredResearchAdapter({
  rates,maxInputTokens:1000,maxOutputTokens:800,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:2000,store:{
   reserve:async()=>{called=true;return null},settle:async()=>{called=true}
  }},
  research:async()=>{called=true;return {evidence,usage}}
 }),/below worst-case cost/)
 assert.equal(called,false)
})
test('accepts sufficient reservation and settles measured usage',async()=>{
 const calls:string[]=[]
 const run=createAtlasBoundedMeteredResearchAdapter({
  rates,maxInputTokens:1000,maxOutputTokens:800,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store:{
   reserve:async()=>{calls.push('reserve');return {id:'r1',reservedUsdMicros:4200}},
   settle:async input=>{calls.push('settle:'+input.actualUsdMicros)}
  }},
  research:async()=>{calls.push('research');return {evidence,usage}}
 })
 assert.deepEqual(await run({} as never),evidence)
 assert.deepEqual(calls,['reserve','research','settle:1250'])
})

test('rejects token usage beyond configured input ceiling without settling',async()=>{
 let settled=false
 const run=createAtlasBoundedMeteredResearchAdapter({
  rates,maxInputTokens:1000,maxOutputTokens:800,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store:{
   reserve:async()=>({id:'r1',reservedUsdMicros:4200}),
   settle:async()=>{settled=true}
  }},
  research:async()=>({evidence,usage:{...usage,inputTokens:1001,totalTokens:1101}})
 })
 await assert.rejects(run({} as never),/exceeds configured ceiling/)
 assert.equal(settled,false)
})
test('rejects token usage beyond configured output ceiling without settling',async()=>{
 let settled=false
 const run=createAtlasBoundedMeteredResearchAdapter({
  rates,maxInputTokens:1000,maxOutputTokens:800,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store:{
   reserve:async()=>({id:'r1',reservedUsdMicros:4200}),
   settle:async()=>{settled=true}
  }},
  research:async()=>({evidence,usage:{inputTokens:100,outputTokens:801,cachedInputTokens:0,totalTokens:901}})
 })
 await assert.rejects(run({} as never),/exceeds configured ceiling/)
 assert.equal(settled,false)
})
