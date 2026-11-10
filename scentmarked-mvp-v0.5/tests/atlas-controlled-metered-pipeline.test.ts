import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasControlledMeteredResearchPipeline} from '../lib/atlas-controlled-research-pipeline.ts'
const rates={inputUsdMicrosPerMillion:1000000,cachedInputUsdMicrosPerMillion:250000,outputUsdMicrosPerMillion:4000000}
test('metered pipeline creation makes no network or budget requests',()=>{
 let calls=0
 const run=createAtlasControlledMeteredResearchPipeline({
  client:{} as never,apiKey:'test',model:'test',allowedHosts:['example.org'],rates,maxInputTokens:1000,countInputTokens:()=>100,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store:{reserve:async()=>{calls++;return null},settle:async()=>{calls++}}},
  sourceFetch:(async()=>{calls++;throw Error('unexpected')}) as typeof fetch,
  modelFetch:(async()=>{calls++;throw Error('unexpected')}) as typeof fetch
 })
 assert.equal(typeof run,'function')
 assert.equal(calls,0)
})
test('metered pipeline fails before network calls when task claim fails',async()=>{
 let calls=0
 const run=createAtlasControlledMeteredResearchPipeline({
  client:{rpc:async()=>({data:null,error:new Error('offline')})} as never,
  apiKey:'test',model:'test',allowedHosts:['example.org'],rates,maxInputTokens:1000,countInputTokens:()=>100,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:4200,store:{reserve:async()=>{calls++;return null},settle:async()=>{calls++}}},
  modelFetch:(async()=>{calls++;throw Error('unexpected')}) as typeof fetch
 })
 await assert.rejects(run(),/claim failed/)
 assert.equal(calls,0)
 assert.throws(()=>run(),/already been invoked/)
})

test('metered pipeline rejects an underfunded budget at construction',()=>{
 assert.throws(()=>createAtlasControlledMeteredResearchPipeline({
  client:{} as never,apiKey:'test',model:'test',allowedHosts:['example.org'],rates,
  maxInputTokens:1000,countInputTokens:()=>100,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:2000,store:{
   reserve:async()=>null,settle:async()=>{}
  }}
 }),/below worst-case cost/)
})
