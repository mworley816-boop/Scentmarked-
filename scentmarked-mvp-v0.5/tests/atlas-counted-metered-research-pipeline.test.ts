import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasCountedMeteredResearchPipeline} from '../lib/atlas-counted-metered-research-pipeline.ts'
const rates={inputUsdMicrosPerMillion:1000000,cachedInputUsdMicrosPerMillion:250000,outputUsdMicrosPerMillion:4000000}
test('official counted pipeline construction performs no network, model, or budget calls',()=>{
 let calls=0
 const run=createAtlasCountedMeteredResearchPipeline({
  client:{} as never,apiKey:'test',model:'test-model',allowedHosts:['example.org'],rates,
  maxInputTokens:4096,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:8000,store:{
   reserve:async()=>{calls++;return null},settle:async()=>{calls++}
  }},
  tokenCountFetch:(async()=>{calls++;throw Error('unexpected count')}) as typeof fetch,
  modelFetch:(async()=>{calls++;throw Error('unexpected model')}) as typeof fetch,
  sourceFetch:(async()=>{calls++;throw Error('unexpected source')}) as typeof fetch
 })
 assert.equal(typeof run,'function')
 assert.equal(calls,0)
})
test('official counted pipeline refuses missing credentials at construction',()=>{
 assert.throws(()=>createAtlasCountedMeteredResearchPipeline({
  client:{} as never,apiKey:'',model:'test-model',allowedHosts:['example.org'],rates,
  maxInputTokens:4096,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store:{reserve:async()=>null,settle:async()=>{}}}
 }),/counter is not configured/)
})
