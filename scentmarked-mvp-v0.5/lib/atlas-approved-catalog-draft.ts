/** Explicitly approved research can become a catalog-entry draft, never a direct write.
 * Preserve source evidence and require a separate publishing decision.
 */
export type AtlasApprovedQueueRow={
 id:string;brand:string;perfume_name:string;manufacturer_url:string
 source_notes:unknown;status:string;reviewed_by:string|null;reviewed_at:string|null;review_note:string|null
}
export type AtlasCatalogDraft={
 researchId:string;brand:string;name:string;sourceUrl:string;sourceNotes:string[]
 review:{reviewedBy:string;reviewedAt:string;verificationNote:string}
 publicationStatus:'draft_requires_catalog_approval'
}
export function prepareAtlasApprovedCatalogDraft(row:AtlasApprovedQueueRow):AtlasCatalogDraft{
 if(row.status!=='approved')throw new Error('Research must be approved before catalog handoff')
 if(!row.reviewed_by?.trim()||!row.reviewed_at||!Number.isFinite(Date.parse(row.reviewed_at))||!row.review_note?.trim())
  throw new Error('Verified reviewer, timestamp, and source note are required')
 if(!row.id.trim()||!row.brand.trim()||!row.perfume_name.trim())throw new Error('Incomplete research identity')
 const url=new URL(row.manufacturer_url)
 if(url.protocol!=='https:'||url.username||url.password||url.port)throw new Error('Invalid source URL')
 if(!Array.isArray(row.source_notes)||row.source_notes.length===0||row.source_notes.length>100||
  !row.source_notes.every((n:unknown)=>typeof n==='string'&&n.trim().length>0&&n.length<=120))
  throw new Error('Invalid research notes')
 return {
  researchId:row.id,brand:row.brand.trim(),name:row.perfume_name.trim(),
  sourceUrl:url.href,sourceNotes:row.source_notes.map((n:string)=>n.trim()),
  review:{reviewedBy:row.reviewed_by,reviewedAt:row.reviewed_at,verificationNote:row.review_note},
  publicationStatus:'draft_requires_catalog_approval'
 }
}
