'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
const options=[['owned','Own It'],['want','Want It'],['tried','Tried It'],['favorite','Favorite']] as const
export default function MarkScent({perfumeId,initial=[]}:{perfumeId:string,initial?:string[]}){
 const [saved,setSaved]=useState<string[]>(initial); const [busy,setBusy]=useState(false); const supabase=createClient()
 async function toggle(status:string){setBusy(true);const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return} if(saved.includes(status)){const {error}=await supabase.from('collection_items').delete().eq('user_id',user.id).eq('perfume_id',perfumeId).eq('status',status);if(!error)setSaved(v=>v.filter(x=>x!==status))}else{const {error}=await supabase.from('collection_items').insert({user_id:user.id,perfume_id:perfumeId,status});if(!error)setSaved(v=>[...v,status])}setBusy(false)}
 return <div className="mark-actions" aria-label="Mark this scent">{options.map(([value,label])=><button type="button" disabled={busy} className={saved.includes(value)?'mark active':'mark'} onClick={()=>toggle(value)} key={value}>{saved.includes(value)?'✓ ':''}{label}</button>)}</div>
}
