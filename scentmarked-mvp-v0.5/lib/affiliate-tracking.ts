export type AffiliatePlacement='profile_featured'|'profile_more'

export function affiliateClickPayload(offerId:number,perfumeId:string,placement:AffiliatePlacement){
 return {offer_id:offerId,perfume_id:perfumeId,placement}
}

export function validAffiliateUrl(value:string){
 try{
  const url=new URL(value)
  return url.protocol==='https:'||url.protocol==='http:'
 }catch{return false}
}
