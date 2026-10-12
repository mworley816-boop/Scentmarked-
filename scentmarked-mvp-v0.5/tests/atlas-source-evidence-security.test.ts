import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasSourceEvidence} from '../lib/atlas-source-evidence.ts'

const candidate={brand:'Arabiyat',name:'Example',manufacturerUrl:'https://manufacturer.example/perfume',sourceNotes:[]}
const evidence={manufacturerUrl:candidate.manufacturerUrl,observedUrl:candidate.manufacturerUrl,pageTitle:'Example fragrance',fetchedAt:new Date().toISOString()}

test('rejects evidence referring to a different submitted source',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,manufacturerUrl:'https://different.example'})
 assert.equal(result.verified,false)
 assert.ok(result.reasons.some(reason=>reason.includes('does not match')))
})

test('rejects custom-port observed source URLs',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'https://manufacturer.example:8443/perfume'})
 assert.equal(result.verified,false)
})

test('rejects evidence timestamps older than one year',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,fetchedAt:'2020-01-01T00:00:00Z'})
 assert.equal(result.verified,false)
})
