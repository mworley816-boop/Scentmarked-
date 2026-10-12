import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasResearchSubmission} from '../lib/atlas-research-submission.ts'

const candidate={brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:['Vanilla']}
const submittedAt='2026-10-11T15:00:00.000Z'

test('new Atlas submission is prepared for source review without approval',()=>{
 const result=prepareAtlasResearchSubmission(candidate,[],'job-1',submittedAt)
 assert.equal(result.accepted,true)
 if(!result.accepted)return
 assert.equal(result.submission.decision,'needs_source_review')
 assert.equal(result.submission.reviewedBy,null)
 assert.equal(result.submission.reviewedAt,null)
})

test('duplicates are retained for review rather than silently inserted',()=>{
 const result=prepareAtlasResearchSubmission(candidate,[{brand:'Arabiyat',name:'Sugar'}],'job-2',submittedAt)
 assert.equal(result.accepted,true)
 if(result.accepted)assert.equal(result.submission.decision,'duplicate')
})

test('invalid input and missing identifiers never produce submissions',()=>{
 assert.equal(prepareAtlasResearchSubmission({...candidate,manufacturerUrl:'http://example.com'},[],'job-3',submittedAt).accepted,false)
 assert.equal(prepareAtlasResearchSubmission(candidate,[],'',submittedAt).accepted,false)
 assert.equal(prepareAtlasResearchSubmission(candidate,[],'job-4','bad date').accepted,false)
})
