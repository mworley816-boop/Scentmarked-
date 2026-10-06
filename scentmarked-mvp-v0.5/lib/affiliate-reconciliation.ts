import type { AffiliateImportRow } from './affiliate-import'
import type { AffiliateClickLookup, AffiliateOfferLookup } from './affiliate-enrichment'

export type AffiliateReconciliationState='complete'|'enrichable'|'conflict'|'unresolved'
export type AffiliateReconciliationResult={state:AffiliateReconciliationState;reasons:string[]}

export function reconcileAffiliateRow(row:AffiliateImportRow,clicks:AffiliateClickLookup[],offers:AffiliateOfferLookup[]):AffiliateReconciliationResult{
 const click=row.affiliate_click_id?clicks.find(x=>x.id===row.affiliate_click_id):undefined
 const offerId=row.affiliate_offer_id||click?.offer_id||null
 const offer=offerId?offers.find(x=>x.id===offerId):undefined
 const reasons:string[]=[]
 if(row.affiliate_click_id&&!click)reasons.push('click_not_found')
 if(row.affiliate_offer_id&&!offer)reasons.push('offer_not_found')
 if(row.affiliate_offer_id&&click?.offer_id&&row.affiliate_offer_id!==click.offer_id)reasons.push('offer_click_conflict')
 if(row.perfume_id&&click?.perfume_id&&row.perfume_id!==click.perfume_id)reasons.push('perfume_click_conflict')
 if(row.perfume_id&&offer?.perfume_id&&row.perfume_id!==offer.perfume_id)reasons.push('perfume_offer_conflict')
 if(row.affiliate_placement&&click?.placement&&row.affiliate_placement!==click.placement)reasons.push('placement_click_conflict')
 if(row.affiliate_merchant&&offer?.merchant_name&&row.affiliate_merchant!==offer.merchant_name)reasons.push('merchant_offer_conflict')
 if(reasons.length)return {state:'conflict',reasons}
 const complete=Boolean(row.affiliate_click_id&&row.affiliate_offer_id&&row.affiliate_merchant&&row.affiliate_placement&&row.perfume_id)
 if(complete)return {state:'complete',reasons:[]}
 const canFill=Boolean(click&&(click.offer_id||click.perfume_id||click.placement)||offer&&(offer.perfume_id||offer.merchant_name))
 return {state:canFill?'enrichable':'unresolved',reasons:canFill?['exact_tracking_data_available']:['insufficient_tracking_data']}
}

export function affiliateReconciliationSummary(rows:AffiliateImportRow[],clicks:AffiliateClickLookup[],offers:AffiliateOfferLookup[]){
 const results=rows.map(row=>reconcileAffiliateRow(row,clicks,offers))
 return {complete:results.filter(x=>x.state==='complete').length,enrichable:results.filter(x=>x.state==='enrichable').length,conflict:results.filter(x=>x.state==='conflict').length,unresolved:results.filter(x=>x.state==='unresolved').length}
}

export const affiliateReconciliationReasonLabels:Record<string,string>={
 click_not_found:'Tracked click was not found.',
 offer_not_found:'Referenced affiliate offer was not found.',
 offer_click_conflict:'Offer does not match the tracked click.',
 perfume_click_conflict:'Perfume does not match the tracked click.',
 perfume_offer_conflict:'Perfume does not match the affiliate offer.',
 placement_click_conflict:'Placement does not match the tracked click.',
 merchant_offer_conflict:'Merchant does not match the affiliate offer.',
 exact_tracking_data_available:'Exact tracking data is available to safely fill missing attribution.',
 insufficient_tracking_data:'There is not enough exact tracking data to complete this attribution.'
}
export function affiliateReconciliationReasonLabel(reason:string){return affiliateReconciliationReasonLabels[reason]||reason.replaceAll('_',' ')}
