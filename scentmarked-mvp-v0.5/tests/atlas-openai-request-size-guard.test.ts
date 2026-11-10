import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasMeteredOpenAIResearchProvider} from '../lib/atlas-openai-research-provider.ts'
import type {ClaimedTask} from '../lib/atlas-worker-execution.ts'
const task:ClaimedTask={task_id:'task',perfume_id:'perfume',task_kind:'research_description',lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
test('oversized model request is rejected before any outbound call',async()=>{
 let calls=0
 const provider=createAtlasMeteredOpenAIResearchProvider({
  apiKey:'test',model:'test-model',maxRequestBytes:1024,
  loadContext:async()=>({brand:'Sample',perfumeName:'Sample',sources:[{url:'https://example.org',excerpt:'A'.repeat(3000)}]}),
  fetchImpl:(async()=>{calls++;throw new Error('unexpected request')}) as typeof fetch
 })
 await assert.rejects(provider(task),/exceeds byte limit/)
 assert.equal(calls,0)
})
test('invalid byte limit fails at provider construction',()=>{
 assert.throws(()=>createAtlasMeteredOpenAIResearchProvider({
  apiKey:'test',model:'test-model',maxRequestBytes:0,
  loadContext:async()=>({brand:'Sample',perfumeName:'Sample',sources:[]})
 }),/byte limit/)
})
