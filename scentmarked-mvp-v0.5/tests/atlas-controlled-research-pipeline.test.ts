import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasControlledResearchPipeline} from '../lib/atlas-controlled-research-pipeline.ts'

test('refuses to create an Atlas pipeline without a trusted source allowlist',()=>{
 assert.throws(()=>createAtlasControlledResearchPipeline({
  client:{} as never,apiKey:'test',model:'test',allowedHosts:[]
 }),/allowlist/)
})
test('creates an explicit one-task runner without starting research',()=>{
 let requests=0
 const run=createAtlasControlledResearchPipeline({
  client:{} as never,
  apiKey:'test',model:'test',
  allowedHosts:['example.org'],
  sourceFetch:(async()=>{requests++;throw new Error('unexpected request')}) as typeof fetch,
  modelFetch:(async()=>{requests++;throw new Error('unexpected request')}) as typeof fetch
 })
 assert.equal(typeof run,'function')
 assert.equal(requests,0)
})

test('one-shot runner refuses a second invocation even when the first run fails',async()=>{
 const run=createAtlasControlledResearchPipeline({
  client:{rpc:async()=>({data:null,error:new Error('offline')})} as never,
  apiKey:'test',model:'test',allowedHosts:['example.org']
 })
 await assert.rejects(run(),/claim failed/)
 assert.throws(()=>run(),/already been invoked/)
})
