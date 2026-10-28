import test from 'node:test'
import assert from 'node:assert/strict'
import {recordPrivateRetailerAudit} from '../lib/atlas-retailer-private-audit'
import type {AtlasRetailerCandidate} from '../lib/atlas-retailer-candidates'
const candidate:AtlasRetailerCandidate={
 perfume_id:'7712723c-9121-437c-a2f3-d1ee2c37f524',
 brand:'Arabiyat Sugar',perfume_name:'Strawberry Tres Leches',
 merchant_name:'Auroud Perfumes',
 product_url:'https://auroudperfumes.com/products/arabiyat-sugar-strawberry-tred-leches-eau-de-parfum-3-4fl-oz',
 source_url:'https://auroudperfumes.com/products/arabiyat-sugar-strawberry-tred-leches-eau-de-parfum-3-4fl-oz',
 evidence_note:'Test fixture; no live API submission.'
}
test('private audit refuses to silently succeed without a configured writer',async()=>{
 assert.deepEqual(await recordPrivateRetailerAudit(candidate,'duplicate'),{ok:false,reason:'private_audit_writer_not_configured'})
})
test('passes only approved evidence fields to a server-side writer',async()=>{
 let calls=0
 const result=await recordPrivateRetailerAudit(candidate,'duplicate',async record=>{
   calls++
   assert.equal(record.outcome,'duplicate')
   assert.equal(record.perfume_id,candidate.perfume_id)
   assert.equal(Object.hasOwn(record,'published'),false)
   assert.equal(Object.hasOwn(record,'secret'),false)
   return {ok:true}
 })
 assert.equal(calls,1)
 assert.deepEqual(result,{ok:true})
})
test('writer failures return a sanitized failure without exposing details',async()=>{
 assert.deepEqual(await recordPrivateRetailerAudit(candidate,'draft_created',async()=>{throw Error('private connection secret')}),{ok:false,reason:'private_audit_write_failed'})
})
