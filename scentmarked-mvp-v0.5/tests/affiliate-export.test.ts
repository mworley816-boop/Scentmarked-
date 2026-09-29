import test from 'node:test'
import assert from 'node:assert/strict'
import { affiliateExportLine, csvCell } from '../lib/affiliate-export.ts'

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
