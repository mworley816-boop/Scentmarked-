import test from 'node:test'
import assert from 'node:assert/strict'
import { safeCsvCell, centsAmount, financialDateRange } from '../lib/financial-export.ts'
test('escapes csv and blocks spreadsheet formulas',()=>{assert.equal(safeCsvCell('hello, world'),'"hello, world"');assert.equal(safeCsvCell('=1+1'),"'=1+1");assert.equal(safeCsvCell('@cmd'),"'@cmd")})
test('formats cents',()=>assert.equal(centsAmount(12345),'123.45'))
test('normalizes reversed date ranges',()=>assert.deepEqual(financialDateRange('2026-10-31','2026-10-01'),{from:'2026-10-01',to:'2026-10-31'}))
