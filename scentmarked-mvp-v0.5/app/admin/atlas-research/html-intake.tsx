'use client'

import {useState,type FormEvent,type ChangeEvent} from 'react'
import {prepareAtlasHtmlResearch} from '@/lib/atlas-html-research-pipeline'

export function AtlasHtmlIntake(){
 const [brand,setBrand]=useState('')
 const [name,setName]=useState('')
 const [sourceUrl,setSourceUrl]=useState('')
 const [html,setHtml]=useState('')
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 const [readingFile,setReadingFile]=useState(false)
 const [importedFile,setImportedFile]=useState('')
 async function importHtml(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0]
  event.target.value=''
  if(!file)return
  setPreview(null);setMessage('');setImportedFile('')
  if(!/\.html?$/i.test(file.name)){setMessage('Choose an .html or .htm file.');return}
  if(file.size>900000){setMessage('HTML file exceeds the 900 KB import limit.');return}
  setReadingFile(true)
  try{
   const content=await file.text()
   if(!content.trim()){setMessage('HTML file is empty.');return}
   if(!/<(?:!doctype\s+html|html|head|body|title|main|article)\b/i.test(content)){
    setMessage('Selected file does not appear to contain an HTML page.');return
   }
   setHtml(content)
   setImportedFile(file.name)
   setMessage('HTML imported. Preview the extracted notes before submitting.')
  }catch{setMessage('Unable to read the selected HTML file.')}
  finally{setReadingFile(false)}
 }

 const [preview,setPreview]=useState<{title:string;notes:string[];missing:string[]}|null>(null)
 function inspect(){
  setPreview(null);setMessage('')
  try{
   const result=prepareAtlasHtmlResearch({candidate:{brand,name,manufacturerUrl:sourceUrl,sourceNotes:[]},sourceUrl,capturedAt:new Date().toISOString(),response:{status:200,contentType:'text/html',contentLength:null},html})
   const notes=result.queueCandidate.sourceNotes
   const missing=['Top','Heart','Base'].filter(tier=>!notes.some(note=>note.startsWith(tier+': ')))
   setPreview({title:result.pageTitle,notes,missing})
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to preview research')}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  if(!preview){setMessage('Preview the extracted notes before submitting.');return}
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
   setMessage('Submitted user-supplied HTML for review. Refresh the queue to see the new entry. Source ownership and HTTP response are not verified.')
   setHtml('');setPreview(null);setImportedFile('')
  }catch{setMessage('Network error. Try again.')}
  finally{setBusy(false)}
 }
 return <section aria-labelledby="atlas-html-intake-title">
  <h2 id="atlas-html-intake-title">Submit manufacturer HTML for review</h2>
  <p>Paste HTML you have permission to use from a manufacturer page. This form does not retrieve websites or verify their ownership. The HTML is user-supplied, and the response status and content type are placeholders, not verified HTTP evidence. Every submission requires review.</p>
  <form onSubmit={submit} onChange={()=>setPreview(null)}>
   <label>Brand <input required maxLength={120} value={brand} onChange={e=>setBrand(e.target.value)} /></label>
   <label>Perfume name <input required maxLength={160} value={name} onChange={e=>setName(e.target.value)} /></label>
   <label>Manufacturer HTTPS URL <input required type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} /></label>
   <label>Import a saved HTML page <input type="file" accept=".html,.htm,text/html" disabled={busy||readingFile} onChange={importHtml} /></label>
   {importedFile&&<p>Imported file: {importedFile}. Confirm the manufacturer URL matches this saved page before submission.</p>}
   <label>Page HTML <textarea required rows={8} maxLength={900000} value={html} onChange={e=>{setHtml(e.target.value);setImportedFile('')}} /></label>
   <button type="button" disabled={busy||readingFile} onClick={inspect}>Preview extracted notes</button>
   {preview&&<div aria-live="polite"><h3>Review extraction: {preview.title}</h3><ul>{preview.notes.map((note,index)=><li key={index}>{note}</li>)}</ul>{preview.missing.length>0&&<p role="status">Not found in supplied HTML: {preview.missing.join(', ')} notes. This does not prove those notes are absent from the fragrance.</p>}<p>These notes are unverified and will require source review.</p></div>}
   <button type="submit" disabled={busy||readingFile||!preview}>{busy?'Submitting…':'Submit for review'}</button>
   {message&&<p role="status">{message}</p>}
  </form>
 </section>
}
