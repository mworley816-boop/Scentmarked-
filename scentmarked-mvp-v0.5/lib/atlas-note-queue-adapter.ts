import type {AtlasNoteReviewProposal} from './atlas-note-review-proposal.ts'
import {validatePerfumeResearchCandidate,type PerfumeResearchCandidate} from './atlas-research-intake.ts'

/** Adapt extracted note proposals to the existing queue's sourceNotes field.
 * Preserve review-only semantics; no direct catalog writes.
 */
export function atlasNoteProposalToCandidate(proposal:AtlasNoteReviewProposal):PerfumeResearchCandidate{
 if(proposal.status!=='needs_source_review')throw new Error('Proposal requires source review')
 if(proposal.evidence.sourceUrl!==proposal.candidate.manufacturerUrl)throw new Error('Source mismatch')
 const entries:string[]=[]
 for(const [label,notes] of [['Top',proposal.notes.top],['Heart',proposal.notes.middle],['Base',proposal.notes.base]] as const){
  for(const note of notes){
   const value=label+': '+note.trim()
   if(value.length>120||!note.trim())throw new Error('Invalid extracted note')
   entries.push(value)
  }
 }
 if(entries.length===0||entries.length>100)throw new Error('Invalid extracted note count')
 const candidate={...proposal.candidate,sourceNotes:entries}
 const validated=validatePerfumeResearchCandidate(candidate)
 if(!validated.normalized)throw new Error('Invalid queue candidate')
 return validated.normalized
}
