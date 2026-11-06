import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasSourceContextLoader} from '../lib/atlas-source-context-loader.ts'
import type {ClaimedTask} from '../lib/atlas-worker-execution.ts'
const task:ClaimedTask={task_id:'t',perfume_id:'p',task_kind:'verify_sources',lease_token:'l',leased_until:'2099-01-01T00:00:00Z'}
const identity={id:'p',brand:'Brand',perfumeName:'Scent'}
test('keeps only matching HTTPS catalog sources and deduplicates',async()=>{
 const load=createAtlasSourceContextLoader({
  getPerfume:async()=>identity,
  getSources:async()=>[
   {perfumeId:'p',url:'https://example.org/notes',excerpt:'Vanilla'},
   {perfumeId:'p',url:'https://example.org/notes',excerpt:'Duplicate'},
   {perfumeId:'other',url:'https://example.org/other',excerpt:'Wrong perfume'},
   {perfumeId:'p',url:'http://example.org/insecure',excerpt:'Insecure'},
   {perfumeId:'p',url:'https://example.org/unverified',excerpt:'Unverified',verified:false}
  ]
 })
 assert.deepEqual(await load(task),{brand:'Brand',perfumeName:'Scent',sources:[{url:'https://example.org/notes',excerpt:'Vanilla'}]})
})
test('missing attributable sources fails closed',async()=>{
 const load=createAtlasSourceContextLoader({getPerfume:async()=>identity,getSources:async()=>[]})
 await assert.rejects(()=>load(task),/No usable source/)
})
test('cross-perfume identity mismatch fails closed',async()=>{
 const load=createAtlasSourceContextLoader({getPerfume:async()=>({...identity,id:'other'}),getSources:async()=>[]})
 await assert.rejects(()=>load(task),/identity is unavailable/)
})
