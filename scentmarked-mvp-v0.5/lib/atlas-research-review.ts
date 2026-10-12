import type {AtlasResearchSubmission} from './atlas-research-submission'

export type AtlasResearchReviewStatus='needs_source_review'|'duplicate'|'approved'|'rejected'

export type AtlasResearchReviewRecord=AtlasResearchSubmission & {
 status:AtlasResearchReviewStatus
 reviewedAt:string|null
 reviewedBy:string|null
 reviewNote:string|null
}

export function createAtlasResearchReviewRecord(submission:AtlasResearchSubmission):AtlasResearchReviewRecord {
 return {...submission,status:submission.decision,reviewNote:null}
}

export function reviewAtlasResearchRecord(
 record:AtlasResearchReviewRecord,
 action:'approve'|'reject',
 reviewerId:string,
 reviewedAt:string,
 note:string
):AtlasResearchReviewRecord {
 if(record.status==='approved'||record.status==='rejected')throw new Error('Research submission has already been reviewed')
 if(record.status==='duplicate'&&action==='approve')throw new Error('Duplicate research requires reconciliation before approval')
 if(!reviewerId.trim()||!Number.isFinite(Date.parse(reviewedAt)))throw new Error('Reviewer and valid review timestamp are required')
 if(action==='approve'&&!note.trim())throw new Error('Approval requires source verification notes')
 return {...record,status:action==='approve'?'approved':'rejected',reviewedBy:reviewerId.trim(),reviewedAt,reviewNote:note.trim()||null}
}
