import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasResearchResponse,ATLAS_MAX_SOURCE_BYTES,ATLAS_MAX_REDIRECTS} from '../lib/atlas-research-response-policy.ts'

test('accepts bounded HTML responses',()=>{
 assert.equal(assessAtlasResearchResponse({status:200,contentType:'text/html; charset=utf-8',contentLength:'200'}).allowed,true)
 assert.equal(assessAtlasResearchResponse({status:200,contentType:'application/xhtml+xml',contentLength:null}).allowed,true)
})
test('rejects non-HTML, errors, invalid lengths, and oversized sources',()=>{
 const base={status:200,contentType:'text/html',contentLength:'100'}
 for(const input of [{...base,status:302},{...base,status:500},{...base,contentType:'application/pdf'},{...base,contentType:null},{...base,contentLength:'-1'},{...base,contentLength:'abc'},{...base,contentLength:String(ATLAS_MAX_SOURCE_BYTES+1)}]){
  assert.equal(assessAtlasResearchResponse(input).allowed,false,JSON.stringify(input))
 }
 assert.equal(ATLAS_MAX_REDIRECTS,3)
})
