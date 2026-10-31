import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasAutomatedReview} from '../lib/atlas-automated-review-preparation.ts'

test('automatic review preparation never invokes transport for unreviewed source',async()=>{
 let invoked=false
 await assert.rejects(prepareAtlasAutomatedReview({
  candidate:{brand:'Arabiyat Sugar',name:'Strawberry Tres Leches',manufacturerUrl:'https://example.com/item',sourceNotes:[]},
  transport:{retrieve:async()=>{invoked=true;throw new Error('Unexpected fetch')}},
  existing:[],id:'test-id',submittedAt:new Date().toISOString()
 }),/not approved/)
 assert.equal(invoked,false)
})
