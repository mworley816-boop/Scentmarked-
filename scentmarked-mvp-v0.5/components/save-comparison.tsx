'use client'
import { useMemo,useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SaveComparison({aId,bId,initialSaved=false,refreshAfterChange=false}:{aId:string;bId:string;initialSaved?:boolean;refreshAfterChange?:boolean}){
 const supabase=useMemo(()=>createClient(),[]),router=useRouter()
 const [saved,setSaved]=useState(initialSaved),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function toggle(){
  if(busy)return
  setBusy(true);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href='/login?next='+encodeURIComponent(window.location.pathname+window.location.search);return}
   const [perfume_a_id,perfume_b_id]=[aId,bId].sort()
   if(saved){const {error}=await supabase.from('saved_comparisons').delete().eq('user_id',user.id).eq('perfume_a_id',perfume_a_id).eq('perfume_b_id',perfume_b_id);if(error)throw error;setSaved(false);setMessage('Comparison removed.');if(refreshAfterChange)router.refresh()}
   else{const {error}=await supabase.from('saved_comparisons').insert({user_id:user.id,perfume_a_id,perfume_b_id});if(error)throw error;setSaved(true);setMessage('Comparison saved.');if(refreshAfterChange)router.refresh()}
  }catch{setMessage('Could not update this comparison. Please try again.')}finally{setBusy(false)}
 }
 return <div className="save-comparison"><button type="button" className={'button ghost'+(saved?' active':'')} aria-pressed={saved} disabled={busy} onClick={toggle}>{busy?'Saving…':saved?'Saved Comparison':'Save Comparison'}</button>{message&&<small role={message.startsWith("Could not")?"alert":"status"}>{message}</small>}</div>
}
