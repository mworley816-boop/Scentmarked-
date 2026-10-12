import {assessAtlasResearchResponse,type AtlasResponseMetadata} from './atlas-research-response-policy.ts'
import {assessAtlasFetchTarget} from './atlas-source-evidence.ts'
import {extractAtlasPageMetadata} from './atlas-page-metadata.ts'
import {buildAtlasNoteReviewProposal,type AtlasNoteReviewProposal} from './atlas-note-review-proposal.ts'
import {atlasNoteProposalToCandidate} from './atlas-note-queue-adapter.ts'
import type {PerfumeResearchCandidate} from './atlas-research-intake.ts'

/** Offline-only HTML intake: no network fetch or automatic publication. */
export function prepareAtlasHtmlResearch(input:{
 candidate:PerfumeResearchCandidate
 sourceUrl:string
 capturedAt:string
 response:AtlasResponseMetadata
 html:string
}):{pageTitle:string;proposal:AtlasNoteReviewProposal;queueCandidate:PerfumeResearchCandidate}{
 if(!assessAtlasFetchTarget(input.sourceUrl).allowed)throw new Error('Unsafe source URL')
 const response=assessAtlasResearchResponse(input.response)
 if(!response.allowed)throw new Error('Invalid source response: '+response.reasons.join(', '))
 if(new TextEncoder().encode(input.html).byteLength>1_000_000)throw new Error('Source HTML exceeds byte limit')
 const metadata=extractAtlasPageMetadata(input.html,input.sourceUrl)
 if(!metadata.title)throw new Error('Missing source page title')
 // Strip scripts/styles and tags, preserving block boundaries for explicit note labels.
 const visible=input.html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<\s*br\s*\/?\s*>|<\/\s*(?:p|div|li|h[1-6])\s*>/gi,'\n')
  .replace(/<[^>]*>/g,' ')
  .replace(/&amp;/gi,'&').replace(/&nbsp;/gi,' ')
 const proposal=buildAtlasNoteReviewProposal(input.candidate,visible,input.sourceUrl,input.capturedAt)
 return {pageTitle:metadata.title,proposal,queueCandidate:atlasNoteProposalToCandidate(proposal)}
}
