'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const scale=[1,2,3,4,5]
const labels:Record<string,string[]>={
 overall:['Poor','Fair','Good','Very good','Excellent'],
 longevity:['Short','Light','Moderate','Long lasting','Very long lasting'],
 projection:['Intimate','Soft','Moderate','Strong','Room filling'],
 sweetness:['Dry','Low sweetness','Balanced','Sweet','Very sweet'],
}
type Rating={overall:number;longevity:number|null;projection:number|null;sweetness:number|null;review:string|null}
export default function RateScent({perfumeId}:{perfumeId:string}){
 const supabase=useMemo(()=>createClient(),[]),router=useRouter()
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[loadFailed,setLoadFailed]=useState(false),[message,setMessage]=useState(''),[rating,setRating]=useState<Rating|null>(null)
 useEffect(()=>{let live=true;setLoading(true);setLoadFailed(false);(async()=>{try{const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)return;const {data,error}=await supabase.from('ratings').select('overall,longevity,projection,sweetness,review').eq('user_id',user.id).eq('perfume_id',perfumeId).maybeSingle();if(error)throw error;if(live)setRating(data as Rating|null)}catch{if(live)setLoadFailed(true)}finally{if(live)setLoading(false)}})();return()=>{live=false}},[supabase,perfumeId])
 async function remove(){if(busy||loading||loadFailed||!rating)return;if(!window.confirm('Delete your rating and review for this fragrance?'))return;setBusy(true);setMessage('');try{const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname+window.location.search)}`;return}const {error}=await supabase.from('ratings').delete().eq('user_id',user.id).eq('perfume_id',perfumeId);if(error)throw error;setRating(null);setMessage('Your rating was deleted.');router.refresh()}catch{setMessage('Could not delete your rating. Please try again.')}finally{setBusy(false)}}
 async function submit(formData:FormData){
  if(busy||loading||loadFailed)return;setBusy(true);setMessage('')
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser()
   if(authError)throw authError
   if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname+window.location.search)}`;return}
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
 const picker=(name:string,label:string,current?:number|null,required=false)=><label><span>{label}</span><select name={name} required={required} defaultValue={current||''} key={name+'-'+(current||'')}><option value="">{required?'Choose a rating':'Not rated'}</option>{scale.map(n=><option key={n} value={n}>{n}/5 — {labels[name]?.[n-1]||n}</option>)}</select></label>
 return <section className="rating-card"><div className="rating-card-head"><div><p className="eyebrow">YOUR EXPERIENCE</p><h2>{rating?'Update your rating':'Rate this scent'}</h2></div><span className="rating-scale">1–5</span></div><p>Share your own wear experience. Use the descriptions beside each 1–5 score so community ratings stay consistent. Your ratings stay separate from verified fragrance facts.</p><form action={submit} className="rating-form" aria-busy={busy||loading}>{picker('overall','Overall rating',rating?.overall,true)}{picker('longevity','Longevity',rating?.longevity)}{picker('projection','Projection',rating?.projection)}{picker('sweetness','Sweetness',rating?.sweetness)}<label className="rating-review"><span>Review</span><textarea name="review" rows={4} maxLength={1000} placeholder="What did it smell like on you?" defaultValue={rating?.review||''} key={'review-'+(rating?.review||'')}/></label><div className="rating-actions"><button type="submit" className="button" disabled={busy||loading||loadFailed}>{loading?'Loading…':busy?'Saving…':rating?'Update Rating':'Submit Rating'}</button>{rating&&<button type="button" className="danger-link" disabled={busy} onClick={remove}>Delete my rating</button>}</div></form>{loadFailed&&<p className="muted" role="alert">Could not load your existing rating. Refresh before submitting so an earlier rating is not overwritten.</p>}{message&&<p className="muted" role={message.startsWith("Could not")||message.startsWith("Choose")?"alert":"status"}>{message}</p>}</section>
}
