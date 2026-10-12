'use client'

import {useState,type FormEvent} from 'react'

export function AtlasHtmlIntake(){
 const [brand,setBrand]=useState('')
 const [name,setName]=useState('')
 const [sourceUrl,setSourceUrl]=useState('')
 const [html,setHtml]=useState('')
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  setBusy(true);setMessage('')
  try{
   const response=await fetch('/api/admin/atlas-research/submit',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     candidate:{brand,name,manufacturerUrl:sourceUrl,sourceNotes:[]},
     sourceUrl,sourceHtml:html,capturedAt:new Date().toISOString(),
     response:{status:200,contentType:'text/html',contentLength:null}
    })
   })
   const result=await response.json() as {error?:string;details?:unknown;status?:string}
   if(!response.ok){setMessage(result.error??'Submission failed');return}
   setMessage('Submitted for review. Refresh the queue to see the new entry.')
   setHtml('')
  }catch{setMessage('Network error. Try again.')}
  finally{setBusy(false)}
 }
 return <section aria-labelledby="atlas-html-intake-title">
  <h2 id="atlas-html-intake-title">Submit manufacturer HTML for review</h2>
  <p>Paste HTML you have permission to use from a manufacturer page. This form does not retrieve websites or verify their ownership. Every submission requires review.</p>
  <form onSubmit={submit}>
   <label>Brand <input required maxLength={120} value={brand} onChange={e=>setBrand(e.target.value)} /></label>
   <label>Perfume name <input required maxLength={160} value={name} onChange={e=>setName(e.target.value)} /></label>
   <label>Manufacturer HTTPS URL <input required type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} /></label>
   <label>Page HTML <textarea required rows={8} maxLength={900000} value={html} onChange={e=>setHtml(e.target.value)} /></label>
   <button type="submit" disabled={busy}>{busy?'Submitting…':'Submit for review'}</button>
   {message&&<p role="status">{message}</p>}
  </form>
 </section>
}
