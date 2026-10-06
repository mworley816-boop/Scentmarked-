import type { AffiliateImportRow } from './affiliate-import'

export type AffiliateClickLookup={id:number;offer_id:number|null;perfume_id:string|null;placement:string|null}
export type AffiliateOfferLookup={id:number;perfume_id:string|null;merchant_name:string|null}
export function enrichAffiliateRows(rows:AffiliateImportRow[],clicks:AffiliateClickLookup[],offers:AffiliateOfferLookup[]){
 const clickById=new Map(clicks.map(x=>[x.id,x])),offerById=new Map(offers.map(x=>[x.id,x]))
 return rows.map(row=>{const click=row.affiliate_click_id?clickById.get(row.affiliate_click_id):undefined
  const offerId=row.affiliate_offer_id||click?.offer_id||null,offer=offerId?offerById.get(offerId):undefined
  return {...row,affiliate_offer_id:offerId,affiliate_click_id:row.affiliate_click_id,affiliate_merchant:row.affiliate_merchant||offer?.merchant_name||null,affiliate_placement:row.affiliate_placement||click?.placement||null,perfume_id:row.perfume_id||click?.perfume_id||offer?.perfume_id||null}
 })
}
