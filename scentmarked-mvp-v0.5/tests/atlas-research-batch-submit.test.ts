import test from 'node:test'
import assert from 'node:assert/strict'
import {submitAtlasResearchBatch} from '../lib/atlas-research-batch-submit.ts'

const source=(name:string)=>({brand:'Arabiyat',name,manufacturerUrl:'https://example.com/'+name,sourceNotes:['Vanilla']})

test('batch submitter retains original indices and reports failures separately',async()=>{
 const calls:string[]=[]
 const result=await submitAtlasResearchBatch([
  source('First'),{brand:'',name:'Invalid',manufacturerUrl:'http://invalid',sourceNotes:[]},source('Second')
 ],async candidate=>{
  calls.push(candidate.name)
  if(candidate.name==='Second')throw new Error('Network unavailable')
  return {id:'research-1',status:'needs_source_review'}
 })
 assert.deepEqual(calls,['First','Second'])
 assert.deepEqual(result.submitted,[{index:0,id:'research-1',status:'needs_source_review'}])
 assert.equal(result.rejected[0].index,1)
 assert.deepEqual(result.failed,[{index:2,error:'Network unavailable'}])
})

test('batch submitter rejects more than 25 candidates',async()=>{
 await assert.rejects(submitAtlasResearchBatch(Array(26).fill(source('Test')),async()=>({id:'x',status:'needs_source_review'})),/exceeds size limit/)
})
