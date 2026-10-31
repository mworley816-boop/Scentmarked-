import {assessAtlasManufacturerDomain,type AtlasManufacturerDomain} from './atlas-manufacturer-domain-registry.ts'

/** Trusted, code-maintained registry for future manufacturer research automation.
 * Deliberately empty until each source's operator, public access conditions,\n * collection restrictions and intended factual reuse have been reviewed.\n * Manufacturer permission is not universally required for using public facts,\n * but this technical allowlist is not a legal determination or scraping license.
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
