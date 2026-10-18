'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const options=[['owned','Own It','✓'],['want','Want It','＋'],['tried','Tried It','◌']] as const
const statusLabels:Record<string,string>={owned:'Owned',want:'Want It',tried:'Tried It'}

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
   // Read the current database state before toggling to avoid stale UI state
   // causing a second tab or device to delete or duplicate the wrong mark.
   const {data:existing,error:readError}=await supabase.from('collection_items').select('status').eq('user_id',user.id).eq('perfume_id',perfumeId).eq('status',status).maybeSingle()
   if(readError)throw readError
   if(existing){
    const {error}=await supabase.from('collection_items').delete().eq('user_id',user.id).eq('perfume_id',perfumeId).eq('status',status)
    if(error)throw error
   }else{
    const {error}=await supabase.from('collection_items').upsert({user_id:user.id,perfume_id:perfumeId,status},{onConflict:'user_id,perfume_id,status',ignoreDuplicates:true})
    if(error)throw error
   }
   // Verify the persisted state after the mutation, including concurrent changes.
   const {data:current,error:verifyError}=await supabase.from('collection_items').select('status').eq('user_id',user.id).eq('perfume_id',perfumeId)
   if(verifyError){
    // The write succeeded; a follow-up read failure must not tell the member it failed.
    setSaved(previous=>existing?previous.filter(value=>value!==status):[...new Set([...previous,status])])
    setMessage('Your mark was saved, but its latest status could not be refreshed. Reload to verify.')
    return
   }
   const currentStatuses=(current||[]).map(row=>row.status)
   setSaved(currentStatuses)
   setMessage(currentStatuses.includes(status)?`Marked as ${statusLabels[status]||status}.`:`Removed ${statusLabels[status]||'mark'}.`)
  }catch{setMessage('Could not update your Marks. Please try again.')}
  finally{setBusy(null)}
 }
 return <div><div className="mark-actions" aria-label="Mark this scent">{options.map(([value,label,icon])=><button type="button" disabled={busy!==null} aria-pressed={saved.includes(value)} className={saved.includes(value)?'mark active':'mark'} onClick={()=>toggle(value)} key={value}><span aria-hidden="true">{saved.includes(value)?'✓':icon}</span>{busy===value?'Saving…':label}</button>)}</div>{message&&<p className="muted" role={message.startsWith("Could not")?"alert":"status"}>{message}</p>}</div>
}
