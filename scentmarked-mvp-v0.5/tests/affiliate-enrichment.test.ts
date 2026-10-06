import test from 'node:test'
import assert from 'node:assert/strict'
import { enrichAffiliateRows } from '../lib/affiliate-enrichment.ts'

const base:any={source_name:'network',external_id:'A',gross_cents:500,fee_cents:0,currency:'USD',status:'confirmed',occurred_at:'2026-10-05T00:00:00Z',affiliate_offer_id:null,affiliate_click_id:8,affiliate_merchant:null,affiliate_placement:null,perfume_id:null}
test('exact click and offer relationships enrich missing attribution',()=>{const [r]=enrichAffiliateRows([base],[{id:8,offer_id:4,perfume_id:'p1',placement:'profile_featured'}],[{id:4,perfume_id:'p1',merchant_name:'Store'}]);assert.equal(r.affiliate_offer_id,4);assert.equal(r.affiliate_merchant,'Store');assert.equal(r.affiliate_placement,'profile_featured');assert.equal(r.perfume_id,'p1')})
test('imported attribution is not overwritten',()=>{const [r]=enrichAffiliateRows([{...base,affiliate_merchant:'Network Store',affiliate_placement:'custom',perfume_id:'p2'}],[{id:8,offer_id:4,perfume_id:'p1',placement:'profile_featured'}],[{id:4,perfume_id:'p1',merchant_name:'Store'}]);assert.equal(r.affiliate_merchant,'Network Store');assert.equal(r.affiliate_placement,'custom');assert.equal(r.perfume_id,'p2')})
