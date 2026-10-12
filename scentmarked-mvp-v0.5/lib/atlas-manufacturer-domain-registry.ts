import {assessAtlasFetchTarget} from './atlas-source-evidence.ts'

/** An administrator-reviewed domain registry, not an ownership verification service.
 * Never accept domain allowlists from a research submission or arbitrary client input.
 */
export type AtlasManufacturerDomain={brand:string;hostname:string}
export function assessAtlasManufacturerDomain(input:{
 brand:string
 sourceUrl:string
 registry:readonly AtlasManufacturerDomain[]
}):{allowed:boolean;reasons:string[]}{
 const reasons:string[]=[]
 const target=assessAtlasFetchTarget(input.sourceUrl)
 reasons.push(...target.reasons)
 if(!input.brand.trim())reasons.push('Brand is required')
 if(!target.allowed)return {allowed:false,reasons}
 const hostname=new URL(input.sourceUrl).hostname.toLowerCase()
 const brand=input.brand.trim().toLocaleLowerCase('en-US')
 const matched=input.registry.some(entry=>{
  const reviewedHost=entry.hostname.toLowerCase()
  // Registry values must be bare DNS hostnames, never URLs or wildcard patterns.
  if(!/^[a-z0-9-]+(?:\\.[a-z0-9-]+)+$/.test(reviewedHost))return false
  if(reviewedHost.split('.').some(label=>label.startsWith('-')||label.endsWith('-')))return false
  return entry.brand.trim().toLocaleLowerCase('en-US')===brand&&reviewedHost===hostname
 })
 if(!matched)reasons.push('Manufacturer domain has not been reviewed for this brand')
 return {allowed:reasons.length===0,reasons}
}
