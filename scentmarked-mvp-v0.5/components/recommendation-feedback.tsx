'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Feedback='more_like_this'|'less_like_this'

export default function RecommendationFeedback({perfumeId,initialFeedback=null,label='Was this recommendation useful?',refreshAfterChange=false}:{perfumeId:string;initialFeedback?:Feedback|null;label?:string;refreshAfterChange?:boolean}){
 const supabase=useMemo(()=>createClient(),[])
 const router=useRouter()
 const [feedback,setFeedback]=useState<Feedback|null>(initialFeedback)
 const [busy,setBusy]=useState<Feedback|null>(null)
 const [message,setMessage]=useState('')
 useEffect(()=>{let live=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user||initialFeedback)return;const {data}=await supabase.from('recommendation_feedback').select('feedback').eq('user_id',user.id).eq('perfume_id',perfumeId).maybeSingle();if(live&&data?.feedback)setFeedback(data.feedback as Feedback)})();return()=>{live=false}},[supabase,perfumeId,initialFeedback])
 async function choose(next:Feedback){
  if(busy)return
  setBusy(next);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname+window.location.search)}`;return}
   if(feedback===next){
    const {error}=await supabase.from('recommendation_feedback').delete().eq('user_id',user.id).eq('perfume_id',perfumeId)
    if(error)throw error
    setFeedback(null);setMessage('Feedback cleared.');if(refreshAfterChange)router.refresh()
   }else{
    const {error}=await supabase.from('recommendation_feedback').upsert({user_id:user.id,perfume_id:perfumeId,feedback:next,updated_at:new Date().toISOString()},{onConflict:'user_id,perfume_id'})
    if(error)throw error
    setFeedback(next);setMessage(next==='more_like_this'?'We’ll remember that you want more recommendations like this.':'We’ll remember that you want fewer recommendations like this.');if(refreshAfterChange)router.refresh()
   }
  }catch{setMessage('Could not save your feedback. Please try again.')}
  finally{setBusy(null)}
 }
 return <div className="recommendation-feedback" aria-label="Recommendation feedback"><span>{label}</span><div><button type="button" className={feedback==='more_like_this'?'active':''} aria-pressed={feedback==='more_like_this'} disabled={!!busy} onClick={()=>choose('more_like_this')}>{busy==='more_like_this'?'Saving…':'More Like This'}</button><button type="button" className={feedback==='less_like_this'?'active':''} aria-pressed={feedback==='less_like_this'} disabled={!!busy} onClick={()=>choose('less_like_this')}>{busy==='less_like_this'?'Saving…':'Less Like This'}</button></div>{message&&<small role={message.startsWith("Could not")?"alert":"status"}>{message}</small>}</div>
}
