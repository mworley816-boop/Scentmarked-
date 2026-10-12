import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasResearchSubmission} from '../lib/atlas-research-submission.ts'
import {createAtlasResearchReviewRecord,reviewAtlasResearchRecord} from '../lib/atlas-research-review.ts'
import {filterAtlasReviewQueue,summarizeAtlasReviewQueue} from '../lib/atlas-research-queue.ts'

const base={brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:['Vanilla']}
function record(id:string,submittedAt:string,duplicate=false){
 const result=prepareAtlasResearchSubmission(base,duplicate?[{brand:'Arabiyat',name:'Sugar'}]:[],id,submittedAt)
 if(!result.accepted)throw new Error('Expected valid candidate')
 return createAtlasResearchReviewRecord(result.submission)
}

test('queue filters pending source review and duplicates',()=>{
 const a=record('a','2026-10-11T15:00:00Z')
 const b=record('b','2026-10-11T16:00:00Z',true)
 assert.deepEqual(filterAtlasReviewQueue([a,b],'needs_source_review').map(x=>x.id),['a'])
 assert.deepEqual(filterAtlasReviewQueue([a,b],'duplicate').map(x=>x.id),['b'])
 assert.deepEqual(filterAtlasReviewQueue([a,b]).map(x=>x.id),['b','a'])
})

test('queue counts approved, rejected and unresolved submissions',()=>{
 const a=record('a','2026-10-11T15:00:00Z')
 const b=record('b','2026-10-11T16:00:00Z',true)
 const c=reviewAtlasResearchRecord(record('c','2026-10-11T17:00:00Z'),'approve','admin','2026-10-11T18:00:00Z','Manufacturer verified')
 const d=reviewAtlasResearchRecord(record('d','2026-10-11T19:00:00Z'),'reject','admin','2026-10-11T20:00:00Z','Not credible')
 assert.deepEqual(summarizeAtlasReviewQueue([a,b,c,d]),{total:4,needs_source_review:1,duplicate:1,approved:1,rejected:1})
})
