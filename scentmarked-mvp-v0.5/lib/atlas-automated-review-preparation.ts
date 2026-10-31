import {prepareAtlasAutomatedResearch} from './atlas-automated-extraction.ts'
import {atlasNoteProposalToCandidate} from './atlas-note-queue-adapter.ts'
import {prepareAtlasResearchSubmission} from './atlas-research-submission.ts'
import {createAtlasResearchReviewRecord} from './atlas-research-review.ts'
import type {PerfumeResearchCandidate} from './atlas-research-intake.ts'
import type {AtlasVettedTransport} from './atlas-research-transport-contract.ts'

/** Orchestrates approved-source retrieval through a vetted transport, extraction,
 * duplicate classification and review-record preparation. No database writes.
 * The caller must independently check the full catalog and queue for duplicates.
 */
export async function prepareAtlasAutomatedReview(input:{
 candidate:PerfumeResearchCandidate
 transport:AtlasVettedTransport
 existing:ReadonlyArray<{brand:string;name:string}>
 id:string
 submittedAt:string
}){
 const research=await prepareAtlasAutomatedResearch({candidate:input.candidate,transport:input.transport})
 const extracted=atlasNoteProposalToCandidate(research.proposal)
 const submission=prepareAtlasResearchSubmission(extracted,input.existing,input.id,input.submittedAt)
 if(!submission.accepted)throw new Error('Automated research submission invalid: '+submission.errors.join('; '))
 return {pageTitle:research.pageTitle,record:createAtlasResearchReviewRecord(submission.submission)}
}
