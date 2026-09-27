'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const scale=[1,2,3,4,5]
export default function ComparisonVote({aId,bId,aName,bName}:{aId:string;bId:string;aName:string;bName:string}){
 const supabase=useMemo(()=>createClient(),[])
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function submit(formData:FormData){
  if(busy)return
  setBusy(true);setMessage('')
  try{
   const {data:{user}}=await supabase.auth.getUser()
   if(!user){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname+window.location.search)}`;return}
   const similarity=Number(formData.get('similarity')||0)
   if(!scale.includes(similarity)){setMessage('Choose a similarity rating from 1 to 5.');return}
   const pick=(key:string)=>{const v=String(formData.get(key)||'');return v==='a'?aId:v==='b'?bId:null}
   const payload:any={user_id:user.id,perfume_a_id:aId,perfume_b_id:bId,similarity}
   const sweeter=pick('sweeter'),stronger=pick('stronger'),longer=pick('longer'),gourmand=pick('gourmand')
   if(sweeter)payload.sweeter=sweeter
   if(stronger)payload.stronger=stronger
   if(longer)payload.longer=longer
   if(gourmand)payload.more_gourmand=gourmand
   const {error}=await supabase.from('comparison_votes').insert(payload)
   if(error)throw error
   setMessage('Comparison marked. Thank you for adding your wear experience.')
  }catch{setMessage('Could not save your comparison. Please try again.')}
  finally{setBusy(false)}
 }
 const choice=(name:string,label:string)=><label>{label}<select name={name} defaultValue=""><option value="">No vote</option><option value="a">{aName}</option><option value="b">{bName}</option></select></label>
 return <section className="comparison-vote"><p className="eyebrow">COMMUNITY COMPARISON</p><h2>Have you worn both?</h2><p>Tell Scentmarked how these fragrances compare. Community votes are opinions, not verified manufacturer claims.</p><form action={submit} className="comparison-vote-form"><label>How similar are they?<select name="similarity" required defaultValue=""><option value="">Choose</option>{scale.map(n=><option value={n} key={n}>{n}/5</option>)}</select></label>{choice('sweeter','Which is sweeter?')}{choice('stronger','Which is stronger?')}{choice('longer','Which lasts longer?')}{choice('gourmand','Which is more gourmand?')}<button className="button" disabled={busy}>{busy?'Saving…':'Submit Comparison'}</button></form>{message&&<p className="muted" role="status">{message}</p>}</section>
}
