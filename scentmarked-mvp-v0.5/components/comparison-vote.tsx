'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const scale=[1,2,3,4,5]
type Existing={similarity?:number;sweeter?:string|null;stronger?:string|null;longer?:string|null;more_gourmand?:string|null}
export default function ComparisonVote({aId,bId,aName,bName}:{aId:string;bId:string;aName:string;bName:string}){
 const supabase=useMemo(()=>createClient(),[])
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[existing,setExisting]=useState<Existing|null>(null)
 const [first,second]=[aId,bId].sort()
 useEffect(()=>{let live=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user||aId===bId)return;const {data}=await supabase.from('comparison_votes').select('similarity,sweeter,stronger,longer,more_gourmand').eq('user_id',user.id).eq('perfume_a_id',first).eq('perfume_b_id',second).maybeSingle();if(live&&data)setExisting(data)})();return()=>{live=false}},[supabase,aId,bId,first,second])
 if(aId===bId)return <section className="comparison-vote"><h2>Choose two different fragrances</h2><p>A fragrance cannot be compared with itself.</p></section>
 const value=(id?:string|null)=>id===aId?'a':id===bId?'b':''
 async function submit(formData:FormData){
  if(busy)return;setBusy(true);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname+window.location.search)}`;return}
   const similarity=Number(formData.get('similarity')||0)
   if(!scale.includes(similarity)){setMessage('Choose a similarity rating from 1 to 5.');return}
   const pick=(key:string)=>{const v=String(formData.get(key)||'');return v==='a'?aId:v==='b'?bId:null}
   const payload:any={user_id:user.id,perfume_a_id:first,perfume_b_id:second,similarity,sweeter:pick('sweeter'),stronger:pick('stronger'),longer:pick('longer'),more_gourmand:pick('gourmand')}
   const {error}=await supabase.from('comparison_votes').upsert(payload,{onConflict:'user_id,perfume_a_id,perfume_b_id'})
   if(error)throw error
   setExisting(payload);setMessage('Comparison marked. You can update your vote anytime.')
  }catch{setMessage('Could not save your comparison. Please try again.')}
  finally{setBusy(false)}
 }
 const choice=(name:string,label:string,current?:string|null)=><label>{label}<select name={name} defaultValue={value(current)} key={name+'-'+value(current)}><option value="">No vote</option><option value="a">{aName}</option><option value="b">{bName}</option></select></label>
 return <section className="comparison-vote"><p className="eyebrow">COMMUNITY COMPARISON</p><h2>{existing?'Update your comparison':'Have you worn both?'}</h2><p>Tell Scentmarked how these fragrances compare. Community votes are opinions, not verified manufacturer claims.</p><form action={submit} className="comparison-vote-form"><label>How similar are they?<select name="similarity" required defaultValue={existing?.similarity||''} key={'similarity-'+(existing?.similarity||'')}><option value="">Choose</option>{scale.map(n=><option value={n} key={n}>{n}/5</option>)}</select></label>{choice('sweeter','Which is sweeter?',existing?.sweeter)}{choice('stronger','Which is stronger?',existing?.stronger)}{choice('longer','Which lasts longer?',existing?.longer)}{choice('gourmand','Which is more gourmand?',existing?.more_gourmand)}<button className="button" disabled={busy}>{busy?'Saving…':existing?'Update Comparison':'Submit Comparison'}</button></form>{message&&<p className="muted" role="status">{message}</p>}</section>
}
