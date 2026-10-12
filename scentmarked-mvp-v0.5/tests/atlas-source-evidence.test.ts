import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasSourceEvidence} from '../lib/atlas-source-evidence.ts'

const candidate={brand:'Arabiyat',name:'Example',manufacturerUrl:'https://manufacturer.example/perfume',sourceNotes:[]}
const evidence={manufacturerUrl:candidate.manufacturerUrl,observedUrl:candidate.manufacturerUrl,pageTitle:'Example fragrance',fetchedAt:new Date().toISOString()}

test('accepts consistent HTTPS evidence metadata without claiming manufacturer ownership',()=>{
 const result=assessAtlasSourceEvidence(candidate,evidence)
 assert.equal(result.metadataConsistent,true)
 assert.deepEqual(result.reasons,[])
})

test('flags mismatched observed host and missing title',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'https://unrelated.example/item',pageTitle:''})
 assert.equal(result.metadataConsistent,false)
 assert.ok(result.reasons.some(reason=>reason.includes('host')))
 assert.ok(result.reasons.some(reason=>reason.includes('title')))
})

test('rejects unsafe observed URL and invalid timestamp',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'http://manufacturer.example',fetchedAt:'not-a-date'})
 assert.equal(result.metadataConsistent,false)
 assert.ok(result.reasons.length>=2)
})

test('rejects local and IP-literal source hosts before automated fetching',()=>{
 for(const host of ['localhost','service.internal','127.0.0.1','[::1]','printer.local']){
  const url=`https://${host}/fragrance`
  const result=assessAtlasSourceEvidence({...candidate,manufacturerUrl:url},{...evidence,manufacturerUrl:url,observedUrl:url})
  assert.equal(result.metadataConsistent,false,`Expected ${host} to be rejected`)
  assert.ok(result.reasons.some(reason=>reason.includes('public domain')))
 }
})
