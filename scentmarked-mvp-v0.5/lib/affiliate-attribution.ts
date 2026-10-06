export type AffiliateRevenueRow={status:string;gross_cents:number;fee_cents:number;affiliate_offer_id?:number|null;affiliate_merchant?:string|null;affiliate_placement?:string|null;perfume_id?:string|null}
export type AffiliateClickRow={offer_id?:number|null;perfume_id?:string|null;placement?:string|null}
const valid=(x:AffiliateRevenueRow)=>!['refunded','void'].includes(x.status)
const net=(x:AffiliateRevenueRow)=>Math.max(0,Number(x.gross_cents||0)-Number(x.fee_cents||0))
export function affiliateAttribution(clicks:AffiliateClickRow[],revenue:AffiliateRevenueRow[]){
 const rows=revenue.filter(valid)
 const summarize=(clickCount:number,items:AffiliateRevenueRow[])=>{const conversions=items.length,earningsCents=items.reduce((s,x)=>s+net(x),0);return{clicks:clickCount,conversions,earningsCents,conversionRate:clickCount?conversions/clickCount:0,epcCents:clickCount?earningsCents/clickCount:0}}
 const merchants=new Map<string,ReturnType<typeof summarize>>(),placements=new Map<string,ReturnType<typeof summarize>>(),perfumes=new Map<string,ReturnType<typeof summarize>>()
 const merchantKeys=new Set(rows.map(x=>x.affiliate_merchant).filter(Boolean) as string[])
 for(const key of merchantKeys){const offerIds=new Set(rows.filter(x=>x.affiliate_merchant===key).map(x=>x.affiliate_offer_id).filter(Boolean));merchants.set(key,summarize(clicks.filter(x=>x.offer_id&&offerIds.has(x.offer_id)).length,rows.filter(x=>x.affiliate_merchant===key)))}
 const placementKeys=new Set([...clicks.map(x=>x.placement),...rows.map(x=>x.affiliate_placement)].filter(Boolean) as string[])
 for(const key of placementKeys)placements.set(key,summarize(clicks.filter(x=>x.placement===key).length,rows.filter(x=>x.affiliate_placement===key)))
 const perfumeKeys=new Set([...clicks.map(x=>x.perfume_id),...rows.map(x=>x.perfume_id)].filter(Boolean) as string[])
 for(const key of perfumeKeys)perfumes.set(key,summarize(clicks.filter(x=>x.perfume_id===key).length,rows.filter(x=>x.perfume_id===key)))
 return{merchants,placements,perfumes}
}
