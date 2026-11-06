import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasMeteredResearchAdapter} from '../lib/atlas-metered-research-adapter.ts'
const rates={inputUsdMicrosPerMillion:1000000,cachedInputUsdMicrosPerMillion:250000,outputUsdMicrosPerMillion:4000000}
const usage={inputTokens:1000,cachedInputTokens:200,outputTokens:100,totalTokens:1100}
const evidence={proposedText:'Supported text',sources:[{url:'https://example.com',claim:'Supported claim'}]}
test('reserves before provider, then settles calculated cost',async()=>{
 const calls:string[]=[]
 const adapter=createAtlasMeteredResearchAdapter({
  rates,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:2000,store:{
   reserve:async()=>{calls.push('reserve');return {id:'r1',reservedUsdMicros:2000}},
   settle:async input=>{calls.push('settle:'+input.actualUsdMicros)}
  }},
  research:async()=>{calls.push('research');return {evidence,usage}}
 })
 assert.deepEqual(await adapter({} as never),evidence)
 assert.deepEqual(calls,['reserve','research','settle:1250'])
})
test('budget denial prevents provider request',async()=>{
 let invoked=false
 const adapter=createAtlasMeteredResearchAdapter({
  rates,budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:2000,store:{
   reserve:async()=>null,settle:async()=>{}
  }},
  research:async()=>{invoked=true;return {evidence,usage}}
 })
 await assert.rejects(adapter({} as never),/budget exhausted/)
 assert.equal(invoked,false)
})
test('cost above reservation fails closed without settling',async()=>{
 let settled=false
 const adapter=createAtlasMeteredResearchAdapter({
  rates,budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:100,store:{
   reserve:async()=>({id:'r1',reservedUsdMicros:100}),
   settle:async()=>{settled=true}
  }},
  research:async()=>({evidence,usage})
 })
 await assert.rejects(adapter({} as never),/exceeds reserved budget/)
 assert.equal(settled,false)
})
