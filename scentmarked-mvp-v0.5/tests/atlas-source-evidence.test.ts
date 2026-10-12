import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasSourceEvidence} from '../lib/atlas-source-evidence.ts'

const candidate={brand:'Arabiyat',name:'Example',manufacturerUrl:'https://manufacturer.example/perfume',sourceNotes:[]}
const evidence={manufacturerUrl:candidate.manufacturerUrl,observedUrl:candidate.manufacturerUrl,pageTitle:'Example fragrance',fetchedAt:'2026-01-01T00:00:00Z'}

test('accepts consistent HTTPS evidence metadata without claiming manufacturer ownership',()=>{
 const result=assessAtlasSourceEvidence(candidate,evidence)
 assert.equal(result.verified,true)
 assert.deepEqual(result.reasons,[])
})

test('flags mismatched observed host and missing title',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'https://unrelated.example/item',pageTitle:''})
 assert.equal(result.verified,false)
 assert.ok(result.reasons.some(reason=>reason.includes('host')))
 assert.ok(result.reasons.some(reason=>reason.includes('title')))
})

test('rejects unsafe observed URL and invalid timestamp',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'http://manufacturer.example',fetchedAt:'not-a-date'})
 assert.equal(result.verified,false)
 assert.ok(result.reasons.length>=2)
})
