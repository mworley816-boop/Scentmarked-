import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasSupabaseQueueStore} from '../lib/atlas-research-supabase-store.ts'
import type {AtlasResearchStoredRow} from '../lib/atlas-research-storage.ts'

const row:AtlasResearchStoredRow={
 id:'research-1',brand:'Arabiyat',perfume_name:'Sugar',manufacturer_url:'https://example.com',
 source_notes:['Vanilla'],decision:'needs_source_review',status:'needs_source_review',
 submitted_at:'2026-10-11T15:00:00Z',reviewed_at:null,reviewed_by:null,review_note:null
}

test('Supabase queue adapter reads and inserts research rows',async()=>{
 const inserted:AtlasResearchStoredRow[]=[]
 const client={from(_table:'atlas_research_queue'){return {
  select(_columns:string){return {order:async(_column:string,_options:{ascending:boolean})=>({data:[row],error:null})}},
  insert:async(value:AtlasResearchStoredRow)=>{inserted.push(value);return {data:null,error:null}}
 }}}
 const store=createAtlasSupabaseQueueStore(client)
 assert.deepEqual(await store.list(),[row])
 await store.insert(row)
 assert.deepEqual(inserted,[row])
})

test('Supabase queue adapter surfaces read and write errors',async()=>{
 const client={from(_table:'atlas_research_queue'){return {
  select(_columns:string){return {order:async(_column:string,_options:{ascending:boolean})=>({data:null,error:{message:'read blocked'}})}},
  insert:async(_value:AtlasResearchStoredRow)=>({data:null,error:{message:'write blocked'}})
 }}}
 const store=createAtlasSupabaseQueueStore(client)
 await assert.rejects(store.list(),/read blocked/)
 await assert.rejects(store.insert(row),/write blocked/)
})
