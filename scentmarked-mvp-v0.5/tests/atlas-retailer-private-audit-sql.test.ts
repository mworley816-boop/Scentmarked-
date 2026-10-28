import test from 'node:test'
import assert from 'node:assert/strict'
import {buildPrivateRetailerAuditInsert,createPrivateAuditWriter} from '../lib/atlas-retailer-private-audit-sql.ts'
import type {RetailerAuditInput} from '../lib/atlas-retailer-private-audit'
const record:RetailerAuditInput={
 perfume_id:'7712723c-9121-437c-a2f3-d1ee2c37f524',brand:'Arabiyat Sugar',
 perfume_name:'Strawberry Tres Leches',merchant_name:'Auroud Perfumes',
 product_url:'https://auroudperfumes.com/products/example',
 source_url:'https://auroudperfumes.com/products/example',
 evidence_note:"test'); drop table perfumes; --",outcome:'duplicate'
}
test('research text remains a parameter, never SQL source',()=>{
 const q=buildPrivateRetailerAuditInsert(record)
 assert.equal(q.values[6],record.evidence_note)
 assert.equal(q.text.includes(record.evidence_note),false)
 assert.match(q.text,/atlas_private\.retailer_evidence_audit/)
 assert.match(q.text,/now\(\)/)
})
test('writer confirms exactly one inserted row',async()=>{
 const writer=createPrivateAuditWriter(async q=>{assert.equal(q.values[7],'duplicate');return {rows:[{id:1}]}})
 assert.deepEqual(await writer(record),{ok:true})
})
test('writer rejects unconfirmed inserts',async()=>{
 const writer=createPrivateAuditWriter(async()=>({rows:[]}))
 assert.deepEqual(await writer(record),{ok:false,reason:'audit_insert_not_confirmed'})
})
test('rejects unknown outcomes',()=>{
 assert.throws(()=>buildPrivateRetailerAuditInsert({...record,outcome:'published' as RetailerAuditInput['outcome']}))
})
