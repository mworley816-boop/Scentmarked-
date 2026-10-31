import {writeFileSync} from 'node:fs'
import {createAtlasPinnedNodeTransport} from '../lib/atlas-pinned-node-transport.ts'
import {prepareAtlasAutomatedResearch} from '../lib/atlas-automated-extraction.ts'
import {assessAtlasAutomatedResearchSource} from '../lib/atlas-research-source-registry.ts'
import {validatePerfumeResearchCandidate} from '../lib/atlas-research-intake.ts'

/** GitHub Actions dry run: produces an artifact only. No DB credentials or writes. */
async function main(){
 const brand=(process.env.ATLAS_BRAND??'').trim()
 const name=(process.env.ATLAS_PERFUME_NAME??'').trim()
 const manufacturerUrl=(process.env.ATLAS_SOURCE_URL??'').trim()
 if(!brand||!name||!manufacturerUrl)throw Error('Brand, perfume name and source URL are required')
 if(brand.length>120||name.length>180||manufacturerUrl.length>1000)throw Error('Research input exceeds limits')
 const source=assessAtlasAutomatedResearchSource(brand,manufacturerUrl)
 if(!source.allowed)throw Error('Manufacturer source is not reviewed: '+source.reasons.join('; '))
 const candidate={brand,name,manufacturerUrl,sourceNotes:[]}
 const validation=validatePerfumeResearchCandidate(candidate)
 if(!validation.normalized)throw Error('Research input invalid: '+validation.errors.join('; '))
 const result=await prepareAtlasAutomatedResearch({candidate:validation.normalized,transport:createAtlasPinnedNodeTransport(brand)})
 const output={
  warning:'UNVERIFIED DRAFT ONLY. Duplicate checks require the complete catalog and queue. Do not publish or auto-submit.',
  sourceUrl:manufacturerUrl,pageTitle:result.pageTitle,
  proposal:result.proposal
 }
 writeFileSync('atlas-manufacturer-research-draft.json',JSON.stringify(output,null,2)+'\n',{mode:0o600})
 console.log('Atlas manufacturer research draft prepared for offline human review; no database writes.')
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Atlas research failed');process.exitCode=1})
