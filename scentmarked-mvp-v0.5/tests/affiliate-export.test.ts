import test from 'node:test'
import assert from 'node:assert/strict'
import { affiliateExportCutoff, affiliateExportLine, affiliateExportPeriod, csvCell } from '../lib/affiliate-export.ts'

test('csv cells quote commas and double embedded quotes',()=>{
 assert.equal(csvCell('Shop, Inc.'),'"Shop, Inc."')
 assert.equal(csvCell('Say "hello"'),'"Say ""hello"""')
})

test('csv cells serialize nullish values as empty quoted fields',()=>{
 assert.equal(csvCell(null),'""')
 assert.equal(csvCell(undefined),'""')
})

test('affiliate export lines serialize every value with csv escaping',()=>{
 assert.equal(
  affiliateExportLine(['2026-09-29T12:00:00Z','Shop, Inc.','Offer "A"',null]),
  '"2026-09-29T12:00:00Z","Shop, Inc.","Offer ""A""",""'
 )
})


test('affiliate export periods accept supported values and default invalid input to 30 days',()=>{
 assert.equal(affiliateExportPeriod('7'),'7')
 assert.equal(affiliateExportPeriod('30'),'30')
 assert.equal(affiliateExportPeriod('all'),'all')
 assert.equal(affiliateExportPeriod('90'),'30')
 assert.equal(affiliateExportPeriod(null),'30')
})

test('affiliate export cutoffs are deterministic for 7 and 30 day periods',()=>{
 const now=Date.parse('2026-09-29T12:00:00.000Z')
 assert.equal(affiliateExportCutoff('7',now),'2026-09-22T12:00:00.000Z')
 assert.equal(affiliateExportCutoff('30',now),'2026-08-30T12:00:00.000Z')
 assert.equal(affiliateExportCutoff('all',now),null)
})
