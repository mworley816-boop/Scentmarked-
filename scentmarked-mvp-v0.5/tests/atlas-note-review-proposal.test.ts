import test from 'node:test'
import assert from 'node:assert/strict'
import {buildAtlasNoteReviewProposal} from '../lib/atlas-note-review-proposal.ts'

const candidate={brand:'Example',name:'Rose',manufacturerUrl:'https://example.com/rose',sourceNotes:[]}
test('builds a source-linked pending-review proposal',()=>{
 const result=buildAtlasNoteReviewProposal(candidate,'Top Notes: Pear, Bergamot','https://example.com/rose',new Date().toISOString())
 assert.equal(result.status,'needs_source_review')
 assert.deepEqual(result.notes.top,['Pear','Bergamot'])
 assert.deepEqual(result.notes.base,[])
})
test('rejects missing notes and mismatched evidence',()=>{
 const now=new Date().toISOString()
 assert.throws(()=>buildAtlasNoteReviewProposal(candidate,'Sweet perfume','https://example.com/rose',now),/No explicitly/)
 assert.throws(()=>buildAtlasNoteReviewProposal(candidate,'Top Notes: Pear','https://example.com/other',now),/does not match/)
 assert.throws(()=>buildAtlasNoteReviewProposal(candidate,'Top Notes: Pear','https://example.com/rose','invalid'),/timestamp/)
})
