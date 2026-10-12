import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePerfumeResearchCandidate,hasResearchCatalogDuplicate,perfumeResearchIdentity,classifyPerfumeResearchCandidate } from '../lib/atlas-research-intake.ts'

const candidate={brand:' Arabiyat ',name:' Sugar ',manufacturerUrl:'https://example.com/perfume',sourceNotes:[' Vanilla ',' Amber ']}

test('valid research candidate is normalized without publishing',()=>{
 const result=validatePerfumeResearchCandidate(candidate)
 assert.equal(result.valid,true)
 assert.deepEqual(result.normalized,{brand:'Arabiyat',name:'Sugar',manufacturerUrl:candidate.manufacturerUrl,sourceNotes:['Vanilla','Amber']})
})

test('research candidates require an HTTPS manufacturer reference',()=>{
 for(const manufacturerUrl of ['http://example.com','javascript:alert(1)','https://user:pass@example.com','not a url']){
  assert.equal(validatePerfumeResearchCandidate({...candidate,manufacturerUrl}).valid,false)
 }
})

test('rejects invalid source notes and empty names',()=>{
 assert.equal(validatePerfumeResearchCandidate({...candidate,name:' '}).valid,false)
 assert.equal(validatePerfumeResearchCandidate({...candidate,sourceNotes:['']}).valid,false)
 assert.equal(validatePerfumeResearchCandidate({...candidate,sourceNotes:[42]}).valid,false)
})

test('detects brand and perfume duplicates independent of case and spacing',()=>{
 assert.equal(perfumeResearchIdentity(' ARABIYAT  ',' SUGAR '),'arabiyat::sugar')
 assert.equal(hasResearchCatalogDuplicate(candidate,[{brand:'arabiyat',name:'sugar'}]),true)
 assert.equal(hasResearchCatalogDuplicate(candidate,[{brand:'Arabiyat',name:'Other'}]),false)
})

test('valid new research remains pending source review',()=>{
 const result=classifyPerfumeResearchCandidate(candidate,[])
 assert.equal(result.decision,'needs_source_review')
 assert.equal(result.candidate?.brand,'Arabiyat')
})

test('duplicate research is flagged rather than published',()=>{
 const result=classifyPerfumeResearchCandidate(candidate,[{brand:'Arabiyat',name:'Sugar'}])
 assert.equal(result.decision,'duplicate')
 assert.equal(result.errors.length,1)
})

test('invalid research cannot enter the review queue',()=>{
 const result=classifyPerfumeResearchCandidate({...candidate,manufacturerUrl:'http://example.com'},[])
 assert.equal(result.decision,'invalid')
 assert.equal(result.candidate,null)
})
