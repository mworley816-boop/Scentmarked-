import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasMeteredOpenAIResearchProvider} from '../lib/atlas-openai-research-provider.ts'
import type {ClaimedTask} from '../lib/atlas-worker-execution.ts'
const task:ClaimedTask={task_id:'task',perfume_id:'perfume',task_kind:'research_description',lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
const context={brand:'Sample Brand',perfumeName:'Sample Scent',sources:[{url:'https://example.org/reference',excerpt:'Vanilla is listed in the scent notes.'}]}
const output=[{content:[{type:'output_text',text:JSON.stringify({proposedText:'Vanilla scent',citations:[{id:1,claim:'Vanilla is listed'}]})}]}]
test('metered provider returns validated evidence and actual response usage',async()=>{
 const provider=createAtlasMeteredOpenAIResearchProvider({apiKey:'test',model:'test-model',maxInputTokens:4096,loadContext:async()=>context,
  fetchImpl:async()=>({ok:true,json:async()=>({output,usage:{input_tokens:120,output_tokens:30,total_tokens:150,input_tokens_details:{cached_tokens:20}}})} as Response)})
 assert.deepEqual(await provider(task),{evidence:{proposedText:'Vanilla scent',sources:[{url:'https://example.org/reference',claim:'Vanilla is listed'}]},usage:{inputTokens:120,outputTokens:30,totalTokens:150,cachedInputTokens:20}})
})
test('metered provider rejects successful output with missing usage',async()=>{
 const provider=createAtlasMeteredOpenAIResearchProvider({apiKey:'test',model:'test-model',maxInputTokens:4096,loadContext:async()=>context,
  fetchImpl:async()=>({ok:true,json:async()=>({output})} as Response)})
 await assert.rejects(provider(task),/usage missing/)
})
test('metered provider rejects inconsistent token accounting',async()=>{
 const provider=createAtlasMeteredOpenAIResearchProvider({apiKey:'test',model:'test-model',maxInputTokens:4096,loadContext:async()=>context,
  fetchImpl:async()=>({ok:true,json:async()=>({output,usage:{input_tokens:120,output_tokens:30,total_tokens:149}})} as Response)})
 await assert.rejects(provider(task),/Inconsistent/)
})

test('metered provider rejects missing input ceiling before fetch',async()=>{
 let called=false
 const provider=createAtlasMeteredOpenAIResearchProvider({apiKey:'test',model:'test-model',loadContext:async()=>context,
  fetchImpl:async()=>{called=true;throw Error('must not fetch')}})
 await assert.rejects(provider(task),/input ceiling is required/)
 assert.equal(called,false)
})
test('metered provider rejects oversized input before fetch',async()=>{
 let called=false
 const provider=createAtlasMeteredOpenAIResearchProvider({apiKey:'test',model:'test-model',maxInputTokens:513,
  loadContext:async()=>({...context,sources:[{...context.sources[0],excerpt:'A'.repeat(3000)}]}),
  fetchImpl:async()=>{called=true;throw Error('must not fetch')}})
 await assert.rejects(provider(task),/conservative preflight ceiling/)
 assert.equal(called,false)
})
