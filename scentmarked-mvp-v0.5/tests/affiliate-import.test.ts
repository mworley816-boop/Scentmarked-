import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAffiliateCommissionCsv, affiliateImportQuality } from '../lib/affiliate-import.ts'

test('affiliate CSV parses attributed commission rows',()=>{const r=parseAffiliateCommissionCsv('external_id,gross,fees,occurred_at,merchant,placement,offer_id,click_id\nA1,12.50,1.25,2026-10-05T12:00:00Z,Store,profile_featured,4,8','network');assert.equal(r.errors.length,0);assert.deepEqual(r.rows[0],{source_name:'network',external_id:'A1',gross_cents:1250,fee_cents:125,currency:'USD',status:'confirmed',occurred_at:'2026-10-05T12:00:00.000Z',affiliate_offer_id:4,affiliate_click_id:8,affiliate_merchant:'Store',affiliate_placement:'profile_featured',perfume_id:null})})
test('affiliate CSV rejects duplicate external transactions within the file',()=>{const r=parseAffiliateCommissionCsv('external_id,gross,occurred_at\nA1,5,2026-10-05\nA1,6,2026-10-05','network');assert.equal(r.rows.length,1);assert.match(r.errors[0],/duplicates/)})
test('affiliate CSV requires stable transaction fields',()=>{const r=parseAffiliateCommissionCsv('merchant,gross\nStore,5');assert.equal(r.rows.length,0);assert.match(r.errors[0],/external_id/)})

test('affiliate import quality exposes incomplete attribution',()=>{const r=parseAffiliateCommissionCsv('external_id,gross,occurred_at,merchant,placement,offer_id,click_id,perfume_id\nA1,5,2026-10-05,Store,profile_featured,4,8,p1\nA2,6,2026-10-05,,,,,','network');const q=affiliateImportQuality(r.rows);assert.equal(q.total,2);assert.equal(q.fullyAttributed,1);assert.equal(q.unattributed,1);assert.equal(q.attributionRate,.5)})
