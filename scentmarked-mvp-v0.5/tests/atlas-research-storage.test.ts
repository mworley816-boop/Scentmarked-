import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasResearchSubmission} from '../lib/atlas-research-submission.ts'
import {createAtlasResearchReviewRecord,reviewAtlasResearchRecord} from '../lib/atlas-research-review.ts'
import {serializeAtlasResearchRow,deserializeAtlasResearchRow} from '../lib/atlas-research-storage.ts'

const candidate={brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:['Vanilla','Amber']}
const timestamp='2026-10-11T15:00:00Z'

test('research submissions round-trip through storage representation',()=>{
 const prepared=prepareAtlasResearchSubmission(candidate,[],'research-1',timestamp)
 if(!prepared.accepted)throw new Error('Expected valid research submission')
 const original=createAtlasResearchReviewRecord(prepared.submission)
 assert.deepEqual(deserializeAtlasResearchRow(serializeAtlasResearchRow(original)),original)
})

test('review metadata survives storage serialization',()=>{
 const prepared=prepareAtlasResearchSubmission(candidate,[],'research-2',timestamp)
 if(!prepared.accepted)throw new Error('Expected valid research submission')
 const reviewed=reviewAtlasResearchRecord(createAtlasResearchReviewRecord(prepared.submission),'approve','admin-1',timestamp,'Verified manufacturer source')
 assert.deepEqual(deserializeAtlasResearchRow(serializeAtlasResearchRow(reviewed)),reviewed)
})
