import type {AtlasResearchReviewRecord} from './atlas-research-review'

export type AtlasReviewQueueFilter='all'|'needs_source_review'|'duplicate'|'approved'|'rejected'

export function filterAtlasReviewQueue(
 records:ReadonlyArray<AtlasResearchReviewRecord>,
 status:AtlasReviewQueueFilter='all'
):AtlasResearchReviewRecord[]{
 return records.filter(record=>status==='all'||record.status===status).sort((a,b)=>{
  const dateComparison=b.submittedAt.localeCompare(a.submittedAt)
  return dateComparison||a.id.localeCompare(b.id)
 })
}

export function summarizeAtlasReviewQueue(records:ReadonlyArray<AtlasResearchReviewRecord>){
 const counts={total:records.length,needs_source_review:0,duplicate:0,approved:0,rejected:0}
 for(const record of records)counts[record.status]++
 return counts
}
