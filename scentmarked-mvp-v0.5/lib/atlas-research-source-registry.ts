import {assessAtlasManufacturerDomain,type AtlasManufacturerDomain} from './atlas-manufacturer-domain-registry.ts'

/** Trusted, code-maintained registry for future manufacturer research automation.
 * Deliberately empty until brand ownership and allowed domains are reviewed.
 * Never populate this from client submissions or unverified search results.
 */
export const ATLAS_REVIEWED_MANUFACTURER_DOMAINS:readonly AtlasManufacturerDomain[]=Object.freeze([])

export function assessAtlasAutomatedResearchSource(brand:string,sourceUrl:string){
 return assessAtlasManufacturerDomain({
  brand,
  sourceUrl,
  registry:ATLAS_REVIEWED_MANUFACTURER_DOMAINS
 })
}
