'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'

export function AtlasReviewActions({id,decision}:{id:string;decision:string}){
 const router=useRouter()
 const [note,setNote]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function review(action:'approve'|'reject'){
  setBusy(true);setMessage('')
  try{
   const response=await fetch('/api/admin/atlas-research/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,action,note})})
   const result=await response.json()
   if(!response.ok){setMessage(result.error||'Review failed');return}
   router.refresh()
  }catch{setMessage('Review request failed. Try again.')}
  finally{setBusy(false)}
 }
 return <div>
  <label htmlFor={'atlas-review-note-'+id}>Review notes</label>
  <textarea id={'atlas-review-note-'+id} value={note} onChange={e=>setNote(e.target.value)} maxLength={4000} placeholder="Document source verification or rejection reason" />
  <div>
   <button type="button" disabled={busy||!note.trim()||decision==='duplicate'} onClick={()=>review('approve')}>Approve</button>
   <button type="button" disabled={busy} onClick={()=>review('reject')}>Reject</button>
  </div>
  {decision==='duplicate'&&<p>Duplicates must be reconciled before approval.</p>}
  {message&&<p role="alert">{message}</p>}
 </div>
}
