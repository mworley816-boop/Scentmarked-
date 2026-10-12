import type {AtlasResearchReviewRecord} from './atlas-research-review'

export type AtlasResearchStoredRow={
 id:string
 brand:string
 perfume_name:string
 manufacturer_url:string
 source_notes:string[]
 status:AtlasResearchReviewRecord['status']
 submitted_at:string
 reviewed_at:string|null
 reviewed_by:string|null
 review_note:string|null
}

export function serializeAtlasResearchRow(record:AtlasResearchReviewRecord):AtlasResearchStoredRow{
 return {
  id:record.id,brand:record.candidate.brand,perfume_name:record.candidate.name,
  manufacturer_url:record.candidate.manufacturerUrl,source_notes:[...record.candidate.sourceNotes],
  status:record.status,submitted_at:record.submittedAt,reviewed_at:record.reviewedAt,
  reviewed_by:record.reviewedBy,review_note:record.reviewNote
 }
}

export function deserializeAtlasResearchRow(row:AtlasResearchStoredRow):AtlasResearchReviewRecord{
 return {
  id:row.id,candidate:{brand:row.brand,name:row.perfume_name,manufacturerUrl:row.manufacturer_url,sourceNotes:[...row.source_notes]},
  decision:row.status==='duplicate'?'duplicate':'needs_source_review',
  status:row.status,submittedAt:row.submitted_at,reviewedAt:row.reviewed_at,
  reviewedBy:row.reviewed_by,reviewNote:row.review_note
 }
}
