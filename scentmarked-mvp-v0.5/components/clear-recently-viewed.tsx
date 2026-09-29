'use client'
import { useMemo,useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClearRecentlyViewed(){
 const supabase=useMemo(()=>createClient(),[]),router=useRouter()
 const [busy,setBusy]=useState(false),[confirming,setConfirming]=useState(false),[message,setMessage]=useState('')
 async function clear(){
  if(busy)return
  setBusy(true);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href='/login?next='+encodeURIComponent(window.location.pathname+window.location.search);return}
   const {error}=await supabase.from('recently_viewed_perfumes').delete().eq('user_id',user.id)
   if(error)throw error
   setConfirming(false);setMessage('Recently viewed history cleared.');router.refresh()
  }catch{setMessage('Could not clear your history. Please try again.')}
  finally{setBusy(false)}
 }
 return <div className="clear-history">{confirming?<><span>Clear all recently viewed fragrances?</span><button type="button" className="button ghost" disabled={busy} onClick={clear}>{busy?'Clearing…':'Yes, clear history'}</button><button type="button" disabled={busy} onClick={()=>setConfirming(false)}>Cancel</button></>:<button type="button" className="button ghost" onClick={()=>setConfirming(true)}>Clear Recently Viewed</button>}{message&&<small role="status">{message}</small>}</div>
}
