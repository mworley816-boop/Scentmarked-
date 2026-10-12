import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasResearchBatch} from '../lib/atlas-research-worker.ts'

test('research worker separates valid candidates from invalid sources',()=>{
 const result=prepareAtlasResearchBatch([
  {brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:['Vanilla']},
  {brand:'',name:'Unknown',manufacturerUrl:'http://example.com',sourceNotes:[]}
 ])
 assert.equal(result.accepted.length,1)
 assert.equal(result.rejected.length,1)
 assert.equal(result.rejected[0].index,1)
})

test('research worker rejects oversized batches',()=>{
 const source={brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:[]}
 assert.throws(()=>prepareAtlasResearchBatch(Array(26).fill(source)),/exceeds size limit/)
 assert.throws(()=>prepareAtlasResearchBatch([],101),/Invalid batch limit/)
})
