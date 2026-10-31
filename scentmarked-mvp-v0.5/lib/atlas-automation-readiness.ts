import {ATLAS_REVIEWED_MANUFACTURER_DOMAINS,assessAtlasAutomatedResearchSource} from './atlas-research-source-registry.ts'

/** Read-only readiness assessment; does not perform network requests. */
export function assessAtlasAutomationReadiness(brand:string,sourceUrl:string){
 const source=assessAtlasAutomatedResearchSource(brand,sourceUrl)
 const checks=[
  {name:'Manufacturer domain reviewed',ready:source.allowed,details:source.reasons},
  {name:'Secure pinned-IP fetch transport',ready:false,details:['Not implemented; DNS checks alone do not prevent rebinding']},
  {name:'Bounded response streaming',ready:false,details:['Not connected to a production fetch transport']},
  {name:'Automatic extraction to approval queue',ready:false,details:['Current intake requires supplied source text or HTML']}
 ]
 return {ready:checks.every(check=>check.ready),reviewedDomainCount:ATLAS_REVIEWED_MANUFACTURER_DOMAINS.length,checks}
}
