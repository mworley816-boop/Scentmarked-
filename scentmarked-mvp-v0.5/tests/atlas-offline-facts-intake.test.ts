import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasOfflineFactsCandidate} from '../lib/atlas-research-intake.ts'

test('manually supplied factual notes become a review candidate without fetching',()=>{
 const result=prepareAtlasOfflineFactsCandidate({
  brand:'Arabiyat',name:'Sample',sourceUrl:'https://example.com/product',
  sourceText:'Top Notes: Strawberry, Milk\nHeart Notes: Caramel\nBase Notes: Vanilla'
 })
 assert.equal(result.valid,true)
 assert.deepEqual(result.normalized?.sourceNotes,['Strawberry','Milk','Caramel','Vanilla'])
})
test('offline intake rejects unlabeled marketing copy',()=>{
 const result=prepareAtlasOfflineFactsCandidate({
  brand:'Arabiyat',name:'Sample',sourceUrl:'https://example.com/product',
  sourceText:'A sweet fragrance with vanilla and strawberry.'
 })
 assert.equal(result.valid,false)
 assert.match(result.errors.join(' '),/No explicitly labeled/)
})
test('offline intake rejects oversized source text',()=>{
 const result=prepareAtlasOfflineFactsCandidate({
  brand:'Arabiyat',name:'Sample',sourceUrl:'https://example.com/product',
  sourceText:'x'.repeat(100001)
 })
 assert.equal(result.valid,false)
})
