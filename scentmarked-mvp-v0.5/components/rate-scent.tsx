'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const scale=[1,2,3,4,5]
export default function RateScent({perfumeId}:{perfumeId:string}){
 const supabase=useMemo(()=>createClient(),[])
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function submit(formData:FormData){
  if(busy)return
  setBusy(true);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}
   const num=(key:string)=>Number(formData.get(key)||0)
   const overall=num('overall'),longevity=num('longevity'),projection=num('projection'),sweetness=num('sweetness')
   if(!scale.includes(overall)){setMessage('Choose an overall rating from 1 to 5.');return}
   const review=String(formData.get('review')||'').trim()
   const payload:any={user_id:user.id,perfume_id:perfumeId,overall,review:review||null}
   if(scale.includes(longevity))payload.longevity=longevity
   if(scale.includes(projection))payload.projection=projection
   if(scale.includes(sweetness))payload.sweetness=sweetness
   const {error}=await supabase.from('ratings').upsert(payload,{onConflict:'user_id,perfume_id'})
   if(error)throw error
   setMessage('Your rating is marked. Refresh to see it in the community average.')
  }catch{setMessage('Could not save your rating. Please try again.')}
  finally{setBusy(false)}
 }
 const picker=(name:string,label:string,required=false)=><label>{label}<select name={name} required={required} defaultValue=""><option value="">Choose</option>{scale.map(n=><option key={n} value={n}>{n}/5</option>)}</select></label>
 return <section className="rating-card"><p className="eyebrow">COMMUNITY</p><h2>Rate this scent</h2><p>Share your own wear experience. Your ratings stay separate from verified fragrance facts.</p><form action={submit} className="rating-form">{picker('overall','Overall rating',true)}{picker('longevity','Longevity')}{picker('projection','Projection')}{picker('sweetness','Sweetness')}<label className="rating-review">Review<textarea name="review" rows={4} maxLength={1000} placeholder="What did it smell like on you?"/></label><button className="button" disabled={busy}>{busy?'Saving…':'Submit Rating'}</button></form>{message&&<p className="muted" role="status">{message}</p>}</section>
}
