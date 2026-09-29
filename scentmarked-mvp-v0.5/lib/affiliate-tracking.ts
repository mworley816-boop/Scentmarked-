export type AffiliatePlacement='profile_featured'|'profile_more'

export function affiliateClickPayload(offerId:number,perfumeId:string,placement:AffiliatePlacement){
 return {offer_id:offerId,perfume_id:perfumeId,placement}
}
