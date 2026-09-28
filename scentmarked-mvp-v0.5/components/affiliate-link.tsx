'use client'

import { createClient } from '@/lib/supabase/client'

export default function AffiliateLink({offerId,perfumeId,placement,href,className,children}:{offerId:number;perfumeId:string;placement:'profile_featured'|'profile_more';href:string;className?:string;children:React.ReactNode}){
 const track=()=>{try{const s=createClient();void s.from('affiliate_clicks').insert({offer_id:offerId,perfume_id:perfumeId,placement})}catch{}}
 return <a className={className} href={href} target="_blank" rel="sponsored noreferrer" onClick={track}>{children}</a>
}
