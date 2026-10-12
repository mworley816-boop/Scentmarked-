import {extractAtlasNoteSections,type AtlasNoteSections} from './atlas-note-extraction.ts'
import {validatePerfumeResearchCandidate,type PerfumeResearchCandidate} from './atlas-research-intake.ts'

/** Pure proposal builder: no database writes or automatic publishing. */
export type AtlasNoteReviewProposal={
 candidate:PerfumeResearchCandidate
 notes:AtlasNoteSections
 evidence:{sourceUrl:string;capturedAt:string}
 status:'needs_source_review'
}
export function buildAtlasNoteReviewProposal(
 candidate:unknown,
 sourceText:string,
 sourceUrl:string,
 capturedAt:string
):AtlasNoteReviewProposal{
 const checked=validatePerfumeResearchCandidate(candidate)
 if(!checked.normalized)throw new Error('Invalid research candidate')
 if(sourceUrl!==checked.normalized.manufacturerUrl)throw new Error('Source URL does not match candidate')
 const timestamp=Date.parse(capturedAt)
 if(!Number.isFinite(timestamp)||timestamp>Date.now()+60_000||timestamp<Date.now()-365*24*60*60*1000)throw new Error('Invalid capture timestamp')
 if(sourceText.length>1_000_000)throw new Error('Research text exceeds limit')
 const notes=extractAtlasNoteSections(sourceText)
 if(!notes.top.length&&!notes.middle.length&&!notes.base.length)throw new Error('No explicitly labeled notes found')
 return {candidate:checked.normalized,notes,evidence:{sourceUrl,capturedAt},status:'needs_source_review'}
}
