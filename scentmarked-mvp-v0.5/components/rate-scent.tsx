'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const scale=[1,2,3,4,5]
type Rating={overall:number;longevity:number|null;projection:number|null;sweetness:number|null;review:string|null}
export default function RateScent({perfumeId}:{perfumeId:string}){
 const supabase=useMemo(()=>createClient(),[]),router=useRouter()
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[rating,setRating]=useState<Rating|null>(null)
 useEffect(()=>{let live=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data}=await supabase.from('ratings').select('overall,longevity,projection,sweetness,review').eq('user_id',user.id).eq('perfume_id',perfumeId).maybeSingle();if(live&&data)setRating(data as Rating)})();return()=>{live=false}},[supabase,perfumeId])
 async function submit(formData:FormData){
  if(busy)return;setBusy(true);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}
   const num=(key:string)=>Number(formData.get(key)||0),overall=num('overall'),longevity=num('longevity'),projection=num('projection'),sweetness=num('sweetness')
   if(!scale.includes(overall)){setMessage('Choose an overall rating from 1 to 5.');return}
   const review=String(formData.get('review')||'').trim()
   const payload:any={user_id:user.id,perfume_id:perfumeId,overall,longevity:scale.includes(longevity)?longevity:null,projection:scale.includes(projection)?projection:null,sweetness:scale.includes(sweetness)?sweetness:null,review:review||null}
   const {error}=await supabase.from('ratings').upsert(payload,{onConflict:'user_id,perfume_id'})
   if(error)throw error
   setRating(payload);setMessage('Your rating is marked.');router.refresh()
  }catch{setMessage('Could not save your rating. Please try again.')}
  finally{setBusy(false)}
 }
 const picker=(name:string,label:string,current?:number|null,required=false)=><label>{label}<select name={name} required={required} defaultValue={current||''} key={name+'-'+(current||'')}><option value="">Choose</option>{scale.map(n=><option key={n} value={n}>{n}/5</option>)}</select></label>
 return <section className="rating-card"><p className="eyebrow">COMMUNITY</p><h2>{rating?'Update your rating':'Rate this scent'}</h2><p>Share your own wear experience. Your ratings stay separate from verified fragrance facts.</p><form action={submit} className="rating-form">{picker('overall','Overall rating',rating?.overall,true)}{picker('longevity','Longevity',rating?.longevity)}{picker('projection','Projection',rating?.projection)}{picker('sweetness','Sweetness',rating?.sweetness)}<label className="rating-review">Review<textarea name="review" rows={4} maxLength={1000} placeholder="What did it smell like on you?" defaultValue={rating?.review||''} key={'review-'+(rating?.review||'')}/></label><button className="button" disabled={busy}>{busy?'Saving…':rating?'Update Rating':'Submit Rating'}</button></form>{message&&<p className="muted" role="status">{message}</p>}</section>
}
