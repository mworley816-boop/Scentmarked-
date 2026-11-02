'use client'
import {useState} from 'react'
import Link from 'next/link'

export function AtlasImportDraftAction({id}:{id:string}){
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [perfumeId,setPerfumeId]=useState('')
 async function importDraft(){
  if(!window.confirm('Create an unpublished catalog draft from this approved Atlas research? This does not publish the perfume.'))return
  setBusy(true);setError('')
  try{
   const response=await fetch('/api/admin/atlas-research/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})})
   const result=await response.json()
   if(!response.ok){setError(result.error||'Import failed');return}
   setPerfumeId(result.perfumeId)
  }catch{setError('Import request failed. Try again.')}
  finally{setBusy(false)}
 }
 return <div style={{marginBlock:'0.75rem'}}>
  <button type="button" disabled={busy||!!perfumeId} onClick={importDraft}>{busy?'Importing…':perfumeId?'Draft created':'Create unpublished catalog draft'}</button>
  {perfumeId&&<p role="status">Draft created: {perfumeId}. <Link href={'/admin/perfumes/'+encodeURIComponent(perfumeId)+'/edit'}>Review catalog entry</Link></p>}
  {error&&<p role="alert">{error}</p>}
 </div>
}
