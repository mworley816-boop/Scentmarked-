import test from 'node:test'
import assert from 'node:assert/strict'
import { rankAffiliateRevenue } from '../lib/revenue-breakdowns.ts'

const rows:any[]=[
 {revenue_type:'affiliate',gross_cents:10000,fee_cents:1000,status:'paid',source_name:'Network A',affiliate_merchant:'Shop A',affiliate_placement:'profile',perfume_id:'p1'},
 {revenue_type:'affiliate',gross_cents:5000,fee_cents:0,status:'confirmed',source_name:'Network A',affiliate_merchant:'Shop B',affiliate_placement:'compare',perfume_id:'p2'},
 {revenue_type:'affiliate',gross_cents:8000,fee_cents:1000,status:'paid',source_name:'Network B',affiliate_merchant:'Shop A',affiliate_placement:'profile',perfume_id:'p1'},
 {revenue_type:'affiliate',gross_cents:50000,fee_cents:0,status:'refunded',source_name:'Network C',affiliate_merchant:'Shop C',affiliate_placement:'home',perfume_id:'p3'},
 {revenue_type:'sponsorship',gross_cents:90000,fee_cents:0,status:'paid',source_name:'Sponsor',affiliate_merchant:null,affiliate_placement:null,perfume_id:null}
]
test('ranks affiliate networks by net revenue and counts transactions',()=>{
 const result=rankAffiliateRevenue(rows,'source_name')
 assert.deepEqual(result,[{key:'Network A',netCents:14000,transactions:2},{key:'Network B',netCents:7000,transactions:1}])
})
test('ranks merchants, placements and perfumes while excluding refunded and non-affiliate rows',()=>{
 assert.equal(rankAffiliateRevenue(rows,'affiliate_merchant')[0].key,'Shop A')
 assert.deepEqual(rankAffiliateRevenue(rows,'affiliate_placement')[0],{key:'profile',netCents:16000,transactions:2})
 assert.deepEqual(rankAffiliateRevenue(rows,'perfume_id')[0],{key:'p1',netCents:16000,transactions:2})
})
test('respects ranking limit',()=>assert.equal(rankAffiliateRevenue(rows,'source_name',1).length,1))
