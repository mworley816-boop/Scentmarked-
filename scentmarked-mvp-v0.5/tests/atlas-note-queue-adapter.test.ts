import test from 'node:test'
import assert from 'node:assert/strict'
import {buildAtlasNoteReviewProposal} from '../lib/atlas-note-review-proposal.ts'
import {atlasNoteProposalToCandidate} from '../lib/atlas-note-queue-adapter.ts'

const candidate={brand:'Example',name:'Rose',manufacturerUrl:'https://example.com/rose',sourceNotes:[]}
test('preserves explicit note tiers in queue sourceNotes',()=>{
 const proposal=buildAtlasNoteReviewProposal(candidate,'Top Notes: Pear, Bergamot\nHeart Notes: Jasmine\nBase Notes: Musk',candidate.manufacturerUrl,new Date().toISOString())
 const queued=atlasNoteProposalToCandidate(proposal)
 assert.deepEqual(queued.sourceNotes,['Top: Pear','Top: Bergamot','Heart: Jasmine','Base: Musk'])
 assert.equal(queued.manufacturerUrl,candidate.manufacturerUrl)
})
test('rejects changed source and invalid note payloads',()=>{
 const proposal=buildAtlasNoteReviewProposal(candidate,'Top Notes: Pear',candidate.manufacturerUrl,new Date().toISOString())
 assert.throws(()=>atlasNoteProposalToCandidate({...proposal,evidence:{...proposal.evidence,sourceUrl:'https://other.example'}}),/Source mismatch/)
 assert.throws(()=>atlasNoteProposalToCandidate({...proposal,notes:{top:['x'.repeat(120)],middle:[],base:[]}}),/Invalid extracted note/)
})
