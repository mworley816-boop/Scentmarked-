import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasResearchSubmission} from '../lib/atlas-research-submission.ts'
import {createAtlasResearchReviewRecord,reviewAtlasResearchRecord} from '../lib/atlas-research-review.ts'

const candidate={brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:['Vanilla']}
const now='2026-10-11T15:00:00.000Z'

function pending(existing:ReadonlyArray<{brand:string,name:string}>=[]){
 const result=prepareAtlasResearchSubmission(candidate,existing,'research-1',now)
 if(!result.accepted)throw new Error('Expected valid submission')
 return createAtlasResearchReviewRecord(result.submission)
}

test('research begins pending review without an approver',()=>{
 const record=pending()
 assert.equal(record.status,'needs_source_review')
 assert.equal(record.reviewedBy,null)
})

test('approval requires reviewer and verification notes',()=>{
 assert.throws(()=>reviewAtlasResearchRecord(pending(),'approve','admin-1',now,''),/verification notes/)
 assert.throws(()=>reviewAtlasResearchRecord(pending(),'approve','',now,'Verified'),/Reviewer/)
 const approved=reviewAtlasResearchRecord(pending(),'approve','admin-1',now,'Checked official manufacturer page')
 assert.equal(approved.status,'approved')
 assert.equal(approved.reviewedBy,'admin-1')
 assert.throws(()=>reviewAtlasResearchRecord(approved,'reject','admin-2',now,'No'),/already been reviewed/)
})

test('duplicates cannot be approved without reconciliation',()=>{
 assert.throws(()=>reviewAtlasResearchRecord(pending([{brand:'Arabiyat',name:'Sugar'}]),'approve','admin-1',now,'Checked'),/reconciliation/)
})

test('research can be rejected with an audit trail',()=>{
 const rejected=reviewAtlasResearchRecord(pending(),'reject','admin-1',now,'Unreliable source')
 assert.equal(rejected.status,'rejected')
 assert.equal(rejected.reviewNote,'Unreliable source')
})
