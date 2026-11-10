import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasMeteredOpenAIResearchProvider} from '../lib/atlas-openai-research-provider.ts'
const context={brand:'Example',perfumeName:'Example',sources:[{url:'https://example.org/source',excerpt:'Evidence'}]}
const task={task_id:'t',perfume_id:'p',task_kind:'research_description',lease_token:'l',leased_until:'2099-01-01'}
test('metered input ceiling requires explicit counter',()=>{
 assert.throws(()=>createAtlasMeteredOpenAIResearchProvider({
  apiKey:'test',model:'test',maxInputTokens:1000,loadContext:async()=>context
 }),/requires an approved token counter/)
})
test('oversized preflight count blocks outbound model calls',async()=>{
 let calls=0
 const provider=createAtlasMeteredOpenAIResearchProvider({
  apiKey:'test',model:'test',maxInputTokens:1000,
  countInputTokens:()=>1001,loadContext:async()=>context,
  fetchImpl:(async()=>{calls++;throw Error('unexpected network')}) as typeof fetch
 })
 await assert.rejects(provider(task as never),/input token preflight failed/)
 assert.equal(calls,0)
})
test('invalid preflight token count fails closed',async()=>{
 let calls=0
 const provider=createAtlasMeteredOpenAIResearchProvider({
  apiKey:'test',model:'test',maxInputTokens:1000,
  countInputTokens:()=>Number.NaN,loadContext:async()=>context,
  fetchImpl:(async()=>{calls++;throw Error('unexpected network')}) as typeof fetch
 })
 await assert.rejects(provider(task as never),/input token preflight failed/)
 assert.equal(calls,0)
})
