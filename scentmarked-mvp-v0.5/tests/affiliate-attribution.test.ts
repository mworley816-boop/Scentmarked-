import test from 'node:test'
import assert from 'node:assert/strict'
import { affiliateAttribution } from '../lib/affiliate-attribution.ts'

test('affiliate attribution calculates placement and perfume EPC',()=>{const a=affiliateAttribution([{offer_id:1,perfume_id:'p1',placement:'profile_featured'},{offer_id:1,perfume_id:'p1',placement:'profile_featured'},{offer_id:2,perfume_id:'p2',placement:'profile_more'}],[{status:'confirmed',gross_cents:500,fee_cents:0,affiliate_offer_id:1,affiliate_merchant:'Store A',affiliate_placement:'profile_featured',perfume_id:'p1'},{status:'refunded',gross_cents:300,fee_cents:0,affiliate_offer_id:2,affiliate_merchant:'Store B',affiliate_placement:'profile_more',perfume_id:'p2'}]);const p=a.placements.get('profile_featured')!;assert.equal(p.clicks,2);assert.equal(p.conversions,1);assert.equal(p.conversionRate,.5);assert.equal(p.epcCents,250);assert.equal(a.perfumes.get('p1')!.earningsCents,500);assert.equal(a.merchants.get('Store A')!.clicks,2)})
