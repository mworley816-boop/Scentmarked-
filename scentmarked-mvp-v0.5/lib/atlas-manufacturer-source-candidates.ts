/** Research leads only: these URLs are not verified manufacturer-controlled domains.
 * They MUST NOT be used as the trusted automated fetch allowlist.
 */
export type AtlasSourceCandidate={
 brand:string
 hostname:string
 referenceUrl:string
 claimedRole:'brand-storefront'|'regional-distributor'
 status:'needs-independent-review'
}
export const ATLAS_MANUFACTURER_SOURCE_CANDIDATES:readonly AtlasSourceCandidate[]=[
 {
  brand:'Arabiyat Prestige',
  hostname:'arabiyatprestige.com',
  referenceUrl:'https://arabiyatprestige.com/',
  claimedRole:'brand-storefront',
  status:'needs-independent-review'
 },
 {
  brand:'Arabiyat Prestige',
  hostname:'arabiyatprestigeus.com',
  referenceUrl:'https://arabiyatprestigeus.com/pages/data-sharing-opt-out',
  claimedRole:'regional-distributor',
  status:'needs-independent-review'
 }
]
