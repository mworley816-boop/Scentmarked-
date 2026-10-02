'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const options=[['owned','Own It','✓'],['want','Want It','＋'],['tried','Tried It','◌']] as const

export default function MarkScent({perfumeId,initial=[]}:{perfumeId:string,initial?:string[]}){
 const [saved,setSaved]=useState<string[]>(initial)
 const [busy,setBusy]=useState<string|null>(null)
 const [message,setMessage]=useState('')
 const supabase=useMemo(()=>createClient(),[])

 async function toggle(status:string){
  if(busy)return
  setBusy(status);setMessage('')
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser()
   if(authError||!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname+window.location.search)}`;return}
   if(saved.includes(status)){
    const {error}=await supabase.from('collection_items').delete().eq('user_id',user.id).eq('perfume_id',perfumeId).eq('status',status)
    if(error)throw error
    setSaved(v=>v.filter(x=>x!==status))
   }else{
    const {error}=await supabase.from('collection_items').insert({user_id:user.id,perfume_id:perfumeId,status})
    if(error)throw error
    setSaved(v=>v.includes(status)?v:[...v,status])
   }
  }catch{setMessage('Could not update your Marks. Please try again.')}
  finally{setBusy(null)}
 }
 return <div><div className="mark-actions" aria-label="Mark this scent">{options.map(([value,label,icon])=><button type="button" disabled={busy!==null} aria-pressed={saved.includes(value)} className={saved.includes(value)?'mark active':'mark'} onClick={()=>toggle(value)} key={value}><span aria-hidden="true">{saved.includes(value)?'✓':icon}</span>{busy===value?'Saving…':label}</button>)}</div>{message&&<p className="muted" role={message.startsWith("Could not")?"alert":"status"}>{message}</p>}</div>
}
