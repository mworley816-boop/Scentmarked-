import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasResearchSubmission} from '../lib/atlas-research-submission.ts'
import {createAtlasResearchReviewRecord,reviewAtlasResearchRecord} from '../lib/atlas-research-review.ts'
import {submitAtlasResearchForReview,loadAtlasResearchQueue} from '../lib/atlas-research-repository.ts'
import type {AtlasResearchStoredRow} from '../lib/atlas-research-storage.ts'

const candidate={brand:'Arabiyat',name:'Sugar',manufacturerUrl:'https://example.com/sugar',sourceNotes:['Vanilla']}
const timestamp='2026-10-11T15:00:00Z'
function record(id:string){
 const prepared=prepareAtlasResearchSubmission(candidate,[],id,timestamp)
 if(!prepared.accepted)throw new Error('Expected valid research')
 return createAtlasResearchReviewRecord(prepared.submission)
}

test('repository adapter stores and reloads unreviewed research',async()=>{
 const rows:AtlasResearchStoredRow[]=[]
 const store={async list(){return [...rows]},async insert(row:AtlasResearchStoredRow){rows.push(row)}}
 await submitAtlasResearchForReview(store,record('research-1'))
 const loaded=await loadAtlasResearchQueue(store)
 assert.equal(loaded.length,1)
 assert.equal(loaded[0].status,'needs_source_review')
 await assert.rejects(submitAtlasResearchForReview(store,record('research-1')),/already exists/)
})

test('repository adapter refuses already reviewed submissions',async()=>{
 const rows:AtlasResearchStoredRow[]=[]
 const store={async list(){return rows},async insert(row:AtlasResearchStoredRow){rows.push(row)}}
 const reviewed=reviewAtlasResearchRecord(record('research-2'),'approve','admin',timestamp,'Manufacturer verified')
 await assert.rejects(submitAtlasResearchForReview(store,reviewed),/Only unreviewed/)
 assert.equal(rows.length,0)
})
