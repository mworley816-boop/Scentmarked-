import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasApprovedCatalogDraft} from '../lib/atlas-approved-catalog-draft.ts'

const row={
 id:'research-1',brand:'Arabiyat',perfume_name:'Sample',manufacturer_url:'https://example.com/perfume',
 source_notes:['Top: Strawberry','Heart: Caramel','Base: Vanilla'],status:'approved',
 reviewed_by:'admin-1',reviewed_at:'2026-10-31T12:00:00.000Z',review_note:'Verified source notes against product page'
}
test('approved Atlas research becomes an unpublished catalog draft',()=>{
 const draft=prepareAtlasApprovedCatalogDraft(row)
 assert.equal(draft.publicationStatus,'draft_requires_catalog_approval')
 assert.equal(draft.review.reviewedBy,'admin-1')
 assert.deepEqual(draft.sourceNotes,row.source_notes)
})
test('unreviewed and duplicate research cannot enter catalog handoff',()=>{
 for(const status of ['needs_source_review','duplicate','rejected']){
  assert.throws(()=>prepareAtlasApprovedCatalogDraft({...row,status}),/approved/)
 }
})
test('missing verification and unsafe source URL are rejected',()=>{
 assert.throws(()=>prepareAtlasApprovedCatalogDraft({...row,review_note:null}),/reviewer/)
 assert.throws(()=>prepareAtlasApprovedCatalogDraft({...row,manufacturer_url:'http://example.com'}),/source URL/)
})
