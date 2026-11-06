import test from 'node:test'
import assert from 'node:assert/strict'
import {validateAtlasResearchEvidence,type AtlasResearchEvidence} from '../lib/atlas-research-evidence.ts'
const draft:AtlasResearchEvidence={
 perfumeId:'perfume-1',taskKind:'research_description',
 proposedText:'Draft description, not approved',
 sources:[{url:'https://example.org/source',claim:'Source supports the proposed description'}]
}
test('research evidence stays a draft requiring review',()=>{
 const result=validateAtlasResearchEvidence(draft)
 assert.equal(result.status,'draft_requires_review')
 assert.equal(result.evidence.proposedText,'Draft description, not approved')
})
test('unsupported and unsourced findings are rejected',()=>{
 assert.throws(()=>validateAtlasResearchEvidence({...draft,sources:[]}),/include sources/)
 assert.throws(()=>validateAtlasResearchEvidence({...draft,sources:[{url:'http://example.org',claim:'Claim'}]}),/HTTPS/)
 assert.throws(()=>validateAtlasResearchEvidence({...draft,sources:[{url:'https://example.org',claim:''}]}),/citation/)
})
test('graphic references require graphics task and rights status',()=>{
 assert.throws(()=>validateAtlasResearchEvidence({...draft,imageReference:{url:'https://example.org/image.png',rightsStatus:'unverified'}}),/graphics review/)
 const result=validateAtlasResearchEvidence({...draft,taskKind:'research_graphic',imageReference:{url:'https://example.org/image.png',rightsStatus:'unverified'}})
 assert.equal(result.status,'draft_requires_review')
 assert.equal(result.evidence.imageReference?.rightsStatus,'unverified')
})
