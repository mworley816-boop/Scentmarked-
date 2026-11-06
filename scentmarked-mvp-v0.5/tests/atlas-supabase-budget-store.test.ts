import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasSupabaseBudgetStore} from '../lib/atlas-supabase-budget-store.ts'
test('reserves and settles through server-side RPCs',async()=>{
 const calls:Array<{name:string;args:unknown}>=[]
 const store=createAtlasSupabaseBudgetStore({rpc:async(name:string,args:unknown)=>{
  calls.push({name,args})
  return {data:name==='atlas_reserve_research_budget'
   ?{id:'reservation',reserved_usd_micros:500}:true,error:null}
 }} as never)
 assert.deepEqual(await store.reserve({day:'2026-11-06',limitUsdMicros:1000,amountUsdMicros:500}),{id:'reservation',reservedUsdMicros:500})
 await store.settle({reservationId:'reservation',actualUsdMicros:250})
 assert.deepEqual(calls.map(call=>call.name),['atlas_reserve_research_budget','atlas_settle_research_budget'])
})
test('denied reservation does not create a spend token',async()=>{
 const store=createAtlasSupabaseBudgetStore({rpc:async()=>({data:null,error:null})} as never)
 assert.equal(await store.reserve({day:'2026-11-06',limitUsdMicros:100,amountUsdMicros:100}),null)
})
test('rejects malformed reservation and failed settlement',async()=>{
 const store=createAtlasSupabaseBudgetStore({rpc:async(name:string)=>({
  data:name==='atlas_reserve_research_budget'?{id:'r',reserved_usd_micros:1}:false,error:null
 })} as never)
 await assert.rejects(store.reserve({day:'2026-11-06',limitUsdMicros:100,amountUsdMicros:50}),/Invalid Atlas budget reservation/)
 await assert.rejects(store.settle({reservationId:'r',actualUsdMicros:1}),/settlement failed/)
})
