'use client'

import { createClient } from '@/lib/supabase/client'
import { affiliateClickPayload, type AffiliatePlacement } from '@/lib/affiliate-tracking'

export default function AffiliateLink({offerId,perfumeId,placement,href,className,children}:{offerId:number;perfumeId:string;placement:AffiliatePlacement;href:string;className?:string;children:React.ReactNode}){
 const track=()=>{try{const s=createClient();void s.from('affiliate_clicks').insert(affiliateClickPayload(offerId,perfumeId,placement))}catch{}}
 return <a className={className} href={href} target="_blank" rel="sponsored noreferrer" onClick={track}>{children}</a>
}
