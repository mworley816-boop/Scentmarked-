import {retrieveAtlasManufacturerHtml,type AtlasVettedTransport} from './atlas-research-transport-contract.ts'
import {extractAtlasPageMetadata} from './atlas-page-metadata.ts'
import {buildAtlasNoteReviewProposal,type AtlasNoteReviewProposal} from './atlas-note-review-proposal.ts'
import type {PerfumeResearchCandidate} from './atlas-research-intake.ts'

/** Strip site chrome before searching for explicitly labeled product notes. */
export function atlasVisibleResearchText(html:string):string{
 return html.replace(/<(script|style|head|nav|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<\s*br\s*\/?\s*>|<\/?\s*(?:p|div|li|h[1-6])\b[^>]*>/gi,'\n')
  .replace(/<[^>]*>/g,' ').replace(/&amp;/gi,'&').replace(/&nbsp;/gi,' ')
}

/** Pure orchestration: only an audited transport may retrieve; never writes or publishes. */
export async function prepareAtlasAutomatedResearch(input:{candidate:PerfumeResearchCandidate;transport:AtlasVettedTransport}):Promise<{pageTitle:string;proposal:AtlasNoteReviewProposal}>{
 const {candidate,transport}=input
 const html=await retrieveAtlasManufacturerHtml({brand:candidate.brand,url:candidate.manufacturerUrl},transport)
 const metadata=extractAtlasPageMetadata(html,candidate.manufacturerUrl)
 if(!metadata.title)throw new Error('Manufacturer page title missing')
 const visible=atlasVisibleResearchText(html)
 const proposal=buildAtlasNoteReviewProposal(candidate,visible,candidate.manufacturerUrl,new Date().toISOString())
 return {pageTitle:metadata.title,proposal}
}
