import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasOpenAIResearchProvider} from '../lib/atlas-openai-research-provider.ts'
import type {ClaimedTask} from '../lib/atlas-worker-execution.ts'
const task:ClaimedTask={task_id:'task',perfume_id:'perfume',task_kind:'research_description',lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
const context={brand:'Sample Brand',perfumeName:'Sample Scent',sources:[{url:'https://example.org/reference',excerpt:'The scent features vanilla.'}]}
test('provider maps model citations only to supplied HTTPS sources',async()=>{
 const provider=createAtlasOpenAIResearchProvider({apiKey:'test',model:'test-model',loadContext:async()=>context,
  fetchImpl:async(_url,init)=>{const body=JSON.parse(String(init?.body));assert.equal(body.store,false)
   return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({proposedText:'Vanilla scent',citations:[{id:1,claim:'Source identifies vanilla'}]})}]}]})} as Response
  }})
 assert.deepEqual(await provider(task),{proposedText:'Vanilla scent',sources:[{url:'https://example.org/reference',claim:'Source identifies vanilla'}]})
})
test('invented citation ID is rejected',async()=>{
 const provider=createAtlasOpenAIResearchProvider({apiKey:'test',model:'test-model',loadContext:async()=>context,
  fetchImpl:async()=>({ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({proposedText:'Invented',citations:[{id:2,claim:'unsupported'}]})}]}]})} as Response)})
 await assert.rejects(()=>provider(task),/Invalid research citation/)
})
test('no sources means no model request',async()=>{
 const provider=createAtlasOpenAIResearchProvider({apiKey:'test',model:'test-model',loadContext:async()=>({...context,sources:[]}),
  fetchImpl:async()=>{throw Error('must not call provider')}})
 await assert.rejects(()=>provider(task),/source evidence is missing/)
})
test('unsourced model response is rejected',async()=>{
 const provider=createAtlasOpenAIResearchProvider({apiKey:'test',model:'test-model',loadContext:async()=>context,
  fetchImpl:async()=>({ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({proposedText:'Unsupported',citations:[]})}]}]})} as Response)})
 await assert.rejects(()=>provider(task),/Research must include sources/)
})
