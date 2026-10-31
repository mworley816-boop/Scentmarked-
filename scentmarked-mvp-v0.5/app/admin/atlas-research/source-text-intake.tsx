'use client'
import {useState,type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

export function AtlasSourceTextIntake(){
 const router=useRouter()
 const [brand,setBrand]=useState('')
 const [name,setName]=useState('')
 const [url,setUrl]=useState('')
 const [sourceText,setSourceText]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  setBusy(true);setMessage('')
  try{
   const response=await fetch('/api/admin/atlas-research/submit',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({candidate:{brand,name,manufacturerUrl:url,sourceNotes:[]},sourceUrl:url,sourceText,capturedAt:new Date().toISOString()})
   })
   const result=await response.json() as {error?:string;details?:unknown;status?:string}
   if(!response.ok){
    const details=Array.isArray(result.details)?result.details.filter((x):x is string=>typeof x==='string').join('; '):''
    setMessage([result.error||'Submission failed',details].filter(Boolean).join(': '))
    return
   }
   setMessage('Research submitted for manual source review. Nothing was published.')
   setSourceText('')
   router.refresh()
  }catch{setMessage('Network error. Please try again.')}
  finally{setBusy(false)}
 }
 return <section aria-labelledby="atlas-text-intake-title">
  <h2 id="atlas-text-intake-title">Extract notes from source text</h2>
  <p>Paste text from a manufacturer page you are permitted to use. Include explicitly labeled Top, Heart/Middle and Base notes. Atlas extracts those notes into a review proposal; it does not fetch or verify the page, and nothing is published automatically.</p>
  <form onSubmit={submit}>
   <label>Brand<input required maxLength={120} value={brand} onChange={e=>setBrand(e.target.value)}/></label>
   <label>Perfume name<input required maxLength={180} value={name} onChange={e=>setName(e.target.value)}/></label>
   <label>Manufacturer HTTPS URL<input required type="url" value={url} onChange={e=>setUrl(e.target.value)}/></label>
   <label>Source text<textarea required rows={8} maxLength={1000000} value={sourceText} onChange={e=>setSourceText(e.target.value)} placeholder={'Top: strawberry, milk\nHeart: caramel, marshmallow\nBase: vanilla, musk'}/></label>
   <button type="submit" disabled={busy||!sourceText.trim()}>{busy?'Extracting and submitting…':'Extract notes for review'}</button>
   {message&&<p role="status">{message}</p>}
  </form>
 </section>
}
