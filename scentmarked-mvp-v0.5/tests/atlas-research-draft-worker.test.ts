import test from 'node:test'
import assert from 'node:assert/strict'
import type {SupabaseClient} from '@supabase/supabase-js'
import {runAtlasResearchDraftWorker} from '../lib/atlas-research-draft-worker.ts'
const task={task_id:'task',perfume_id:'perfume',task_kind:'research_graphic',lease_token:'lease',leased_until:'2099-01-01T00:00:00Z'}
test('graphics research writes private evidence and stops awaiting review',async()=>{
 const calls:string[]=[]
 const client={rpc:async(name:string)=>{
  calls.push(name)
  if(name==='atlas_claim_employee_task')return {data:[task],error:null}
  if(name==='atlas_save_employee_evidence_draft')return {data:'draft-id',error:null}
  if(name==='atlas_finish_employee_task')return {data:true,error:null}
  throw Error('unexpected RPC')
 }} as unknown as SupabaseClient
 const result=await runAtlasResearchDraftWorker(client,async()=>({
  proposedText:'Reference photo candidate; no rights verified',
  sources:[{url:'https://example.org/bottle',claim:'Reference bottle image'}],
  imageReference:{url:'https://example.org/bottle.jpg',rightsStatus:'unverified'}
 }))
 assert.equal(result.status,'awaiting_review')
 assert.deepEqual(calls,['atlas_claim_employee_task','atlas_save_employee_evidence_draft','atlas_finish_employee_task'])
})
test('invalid or unsourced research never writes a draft',async()=>{
 const calls:string[]=[]
 const client={rpc:async(name:string)=>{
  calls.push(name)
  if(name==='atlas_claim_employee_task')return {data:[{...task,task_kind:'verify_sources'}],error:null}
  if(name==='atlas_finish_employee_task')return {data:true,error:null}
  throw Error('must not save invalid evidence')
 }} as unknown as SupabaseClient
 const result=await runAtlasResearchDraftWorker(client,async()=>({proposedText:'Unsupported',sources:[]}))
 assert.equal(result.status,'retry_or_failed')
 assert.deepEqual(calls,['atlas_claim_employee_task','atlas_finish_employee_task'])
})
test('failed draft persistence cannot mark task completed',async()=>{
 const calls:string[]=[]
 const client={rpc:async(name:string)=>{
  calls.push(name)
  if(name==='atlas_claim_employee_task')return {data:[{...task,task_kind:'verify_sources'}],error:null}
  if(name==='atlas_save_employee_evidence_draft')return {data:null,error:{message:'lease expired'}}
  if(name==='atlas_finish_employee_task')return {data:true,error:null}
  throw Error('unexpected RPC')
 }} as unknown as SupabaseClient
 const result=await runAtlasResearchDraftWorker(client,async()=>({
  proposedText:'Supported proposal',
  sources:[{url:'https://example.org/source',claim:'Source supports claim'}]
 }))
 assert.equal(result.status,'retry_or_failed')
 assert.deepEqual(calls,['atlas_claim_employee_task','atlas_save_employee_evidence_draft','atlas_finish_employee_task'])
})
