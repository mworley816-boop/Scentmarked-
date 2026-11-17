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

test('counting endpoint failure blocks model call and draft publication',async()=>{
 let counts=0,models=0,reserves=0,settles=0,writes=0
 let finished:{p_success:boolean;p_error:string|null}|null=null
 const sourceUrl='https://example.org/reference'
 const client={
  rpc:async(name:string,args?:Record<string,unknown>)=>{
   if(name==='atlas_claim_employee_task')return {data:[{
    task_id:'task',perfume_id:'perfume',task_kind:'research_description',
    lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'
   }],error:null}
   if(name==='atlas_finish_employee_task'){
    finished={p_success:args?.p_success as boolean,p_error:args?.p_error as string|null}
    return {data:true,error:null}
   }
   throw Error('unexpected RPC: '+name)
  },
  from:(table:string)=>({
   select:()=>({
    eq:()=>({
     maybeSingle:async()=>({data:table==='perfumes'?{id:'perfume',name:'Sample Scent',brand_id:'brand'}:{name:'Sample Brand'},error:null}),
     limit:async()=>({data:[{source_url:sourceUrl}],error:null})
    })
   }),
   insert:()=>{writes++;throw Error('draft write must not occur')}
  })
 } as never
 const run=createAtlasCountedMeteredResearchPipeline({
  client,apiKey:'test',model:'test-model',allowedHosts:['example.org'],rates,
  maxInputTokens:4096,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:8000,store:{
   reserve:async()=>{reserves++;return {id:'reservation',reservedUsdMicros:8000}},
   settle:async()=>{settles++}
  }},
  sourceFetch:(async()=>new Response('The fragrance lists vanilla and amber notes with a warm base.',{
   status:200,headers:{'content-type':'text/plain'}
  })) as typeof fetch,
  tokenCountFetch:(async()=>{counts++;return {ok:false,status:503} as Response}) as typeof fetch,
  modelFetch:(async()=>{models++;throw Error('model must not run')}) as typeof fetch
 })
 assert.deepEqual(await run(),{status:'retry_or_failed',taskId:'task'})
 assert.equal(counts,1)
 assert.equal(models,0)
 assert.equal(reserves,1)
 assert.equal(settles,0)
 assert.equal(writes,0)
 assert.deepEqual(finished,{p_success:false,p_error:'Atlas input token count request failed (503)'})
})

test('counted pipeline saves private evidence after model usage is settled',async()=>{
 const events:string[]=[]
 const sourceUrl='https://example.org/reference'
 let draft:Record<string,unknown>|null=null
 const client={
  rpc:async(name:string,args?:Record<string,unknown>)=>{
   events.push(name)
   if(name==='atlas_claim_employee_task')return {data:[{
    task_id:'task',perfume_id:'perfume',task_kind:'research_description',
    lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'
   }],error:null}
   if(name==='atlas_save_employee_evidence_draft'){
    draft=args??null
    return {data:'private-draft-id',error:null}
   }
   if(name==='atlas_finish_employee_task'){
    assert.equal(args?.p_success,true)
    return {data:true,error:null}
   }
   throw Error('unexpected RPC: '+name)
  },
  from:(table:string)=>({
   select:()=>({
    eq:()=>({
     maybeSingle:async()=>({data:table==='perfumes'?{id:'perfume',name:'Sample Scent',brand_id:'brand'}:{name:'Sample Brand'},error:null}),
     limit:async()=>({data:[{source_url:sourceUrl}],error:null})
    })
   })
  })
 } as never
 const run=createAtlasCountedMeteredResearchPipeline({
  client,apiKey:'test',model:'test-model',allowedHosts:['example.org'],rates,
  maxInputTokens:4096,maxOutputTokens:800,maxRequestBytes:8192,
  budget:{dailyLimitUsdMicros:10000,perRequestReserveUsdMicros:8000,store:{
   reserve:async()=>{events.push('reserve');return {id:'reservation',reservedUsdMicros:8000}},
   settle:async input=>{events.push('settle');assert.equal(input.reservationId,'reservation');assert.equal(input.actualUsdMicros,200)}
  }},
  sourceFetch:(async()=>new Response('The fragrance lists vanilla and amber notes with a warm base.',{
   status:200,headers:{'content-type':'text/plain'}
  })) as typeof fetch,
  tokenCountFetch:(async(url,init)=>{
   events.push('count')
   assert.equal(url,'https://api.openai.com/v1/responses/input_tokens')
   const body=JSON.parse(String(init?.body))
   assert.equal(body.model,'test-model')
   assert.match(body.input,/Sample Scent/)
   return {ok:true,json:async()=>({object:'response.input_tokens',input_tokens:120})} as Response
  }) as typeof fetch,
  modelFetch:(async(url,init)=>{
   events.push('model')
   assert.equal(url,'https://api.openai.com/v1/responses')
   assert.equal(JSON.parse(String(init?.body)).store,false)
   return {ok:true,json:async()=>({
    output:[{content:[{type:'output_text',text:JSON.stringify({
     proposedText:'Vanilla scent',citations:[{id:1,claim:'Vanilla is listed'}]
    })}]}],
    usage:{input_tokens:120,output_tokens:20,total_tokens:140}
   })} as Response
  }) as typeof fetch
 })
 assert.deepEqual(await run(),{status:'completed',taskId:'task'})
 assert.deepEqual(events.slice(-5),['count','model','settle','atlas_save_employee_evidence_draft','atlas_finish_employee_task'])
 const savedDraft=draft as Record<string,unknown>|null
 assert.ok(savedDraft,'Expected a private evidence draft to be saved')
 assert.equal(savedDraft.p_task_id,'task')
 assert.equal(savedDraft.p_proposed_text,'Vanilla scent')
 assert.deepEqual(savedDraft.p_sources,[{url:sourceUrl,claim:'Vanilla is listed'}])
 assert.equal(savedDraft.p_image_reference,null)
})
