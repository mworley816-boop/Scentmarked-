import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcileAffiliateRow, affiliateReconciliationSummary } from '../lib/affiliate-reconciliation.ts'

const base:any={source_name:'network',external_id:'A',gross_cents:500,fee_cents:0,currency:'USD',status:'confirmed',occurred_at:'2026-10-05T00:00:00Z',affiliate_offer_id:null,affiliate_click_id:8,affiliate_merchant:null,affiliate_placement:null,perfume_id:null}
const clicks:any[]=[{id:8,offer_id:4,perfume_id:'p1',placement:'profile_featured'}]
const offers:any[]=[{id:4,perfume_id:'p1',merchant_name:'Store'}]

test('marks incomplete rows with exact tracking data as enrichable',()=>assert.equal(reconcileAffiliateRow(base,clicks,offers).state,'enrichable'))
test('flags conflicting imported perfume for review',()=>{const r=reconcileAffiliateRow({...base,perfume_id:'p2'},clicks,offers);assert.equal(r.state,'conflict');assert.ok(r.reasons.includes('perfume_click_conflict'))})
test('flags missing click references as conflicts',()=>assert.equal(reconcileAffiliateRow({...base,affiliate_click_id:99},clicks,offers).state,'conflict'))
test('marks rows without usable tracking data unresolved',()=>assert.equal(reconcileAffiliateRow({...base,affiliate_click_id:null},clicks,offers).state,'unresolved'))
test('summarizes reconciliation states',()=>{const rows:any[]=[base,{...base,external_id:'B',perfume_id:'p2'},{...base,external_id:'C',affiliate_click_id:null}];assert.deepEqual(affiliateReconciliationSummary(rows,clicks,offers),{complete:0,enrichable:1,conflict:1,unresolved:1})})
