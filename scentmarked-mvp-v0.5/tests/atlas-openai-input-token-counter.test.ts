import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasOpenAIInputTokenCounter} from '../lib/atlas-openai-input-token-counter.ts'
const request={model:'test-model',instructions:'Use supplied sources',input:'{"brand":"Sample"}'}
test('counter sends exact model instructions and input to counting endpoint',async()=>{
 let calls=0
 const count=createAtlasOpenAIInputTokenCounter({apiKey:'test',model:'test-model',fetchImpl:(async(url,init)=>{
  calls++
  assert.equal(url,'https://api.openai.com/v1/responses/input_tokens')
  assert.equal(init?.method,'POST')
  assert.deepEqual(JSON.parse(String(init?.body)),request)
  return {ok:true,json:async()=>({object:'response.input_tokens',input_tokens:123})} as Response
 }) as typeof fetch})
 assert.equal(await count(request),123)
 assert.equal(calls,1)
})
test('counter rejects model mismatch before network',async()=>{
 let calls=0
 const count=createAtlasOpenAIInputTokenCounter({apiKey:'test',model:'test-model',fetchImpl:(async()=>{
  calls++;throw Error('must not fetch')
 }) as typeof fetch})
 await assert.rejects(count({...request,model:'other-model'}),/model mismatch/)
 assert.equal(calls,0)
})
test('counter fails closed on malformed counts and provider failures',async()=>{
 for(const result of [{object:'response.input_tokens',input_tokens:-1},{object:'response.input_tokens',input_tokens:1.5},{object:'wrong',input_tokens:10},{input_tokens:10}]){
  const count=createAtlasOpenAIInputTokenCounter({apiKey:'test',model:'test-model',fetchImpl:(async()=>({ok:true,json:async()=>result} as Response)) as typeof fetch})
  await assert.rejects(count(request),/response is invalid/)
 }
 const count=createAtlasOpenAIInputTokenCounter({apiKey:'test',model:'test-model',fetchImpl:(async()=>({ok:false,status:503} as Response)) as typeof fetch})
 await assert.rejects(count(request),/failed \(503\)/)
})
test('counter creation is offline and requires credentials',()=>{
 assert.throws(()=>createAtlasOpenAIInputTokenCounter({apiKey:'',model:'test-model'}),/not configured/)
 assert.throws(()=>createAtlasOpenAIInputTokenCounter({apiKey:'test',model:''}),/not configured/)
})
