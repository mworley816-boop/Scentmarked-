import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateAtlasWorstCaseReserveMicros} from '../lib/atlas-budget-reservation-bound.ts'
const rates={inputUsdMicrosPerMillion:1000000,cachedInputUsdMicrosPerMillion:250000,outputUsdMicrosPerMillion:4000000}
test('conservative reserve includes full input and output ceilings',()=>{
 assert.equal(calculateAtlasWorstCaseReserveMicros({maxInputTokens:1000,maxOutputTokens:800,rates}),4200)
})
test('uses higher input price if cached input tier is higher',()=>{
 assert.equal(calculateAtlasWorstCaseReserveMicros({maxInputTokens:1000,maxOutputTokens:800,rates:{...rates,cachedInputUsdMicrosPerMillion:2000000}}),5200)
})
test('rejects unknown or zero paid pricing and invalid ceilings',()=>{
 assert.throws(()=>calculateAtlasWorstCaseReserveMicros({maxInputTokens:1000,maxOutputTokens:800,rates:{...rates,outputUsdMicrosPerMillion:0}}),/rates/)
 assert.throws(()=>calculateAtlasWorstCaseReserveMicros({maxInputTokens:0,maxOutputTokens:800,rates}),/ceilings/)
 assert.throws(()=>calculateAtlasWorstCaseReserveMicros({maxInputTokens:Number.MAX_SAFE_INTEGER,maxOutputTokens:800,rates}),/overflow/)
})
