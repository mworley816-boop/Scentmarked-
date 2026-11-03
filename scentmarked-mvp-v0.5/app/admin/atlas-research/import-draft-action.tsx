'use client'
import {useState} from 'react'
import Link from 'next/link'

export function AtlasImportDraftAction({id}:{id:string}){
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [perfumeId,setPerfumeId]=useState('')
 const [summary,setSummary]=useState('')
 const [recordStatus,setRecordStatus]=useState('')
 async function importDraft(){
  if(!window.confirm('Create an unpublished catalog draft from this approved Atlas research? This does not publish the perfume.'))return
  setBusy(true);setError('');setSummary('')
  try{
   const response=await fetch('/api/admin/atlas-research/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})})
   const result=await response.json()
   if(!response.ok){setError(result.error||'Import failed');if(result.perfumeId)setPerfumeId(result.perfumeId);if(result.recordStatus)setRecordStatus(result.recordStatus);return}
   setRecordStatus('draft')
   setPerfumeId(result.perfumeId)
   setSummary(result.noteCount+' note links and '+result.sourceCount+' source references verified. Unpublished draft.')
  }catch{setError('Import request failed. Try again.')}
  finally{setBusy(false)}
 }
 return <div style={{marginBlock:'0.75rem'}}>
  <button type="button" disabled={busy||!!perfumeId} onClick={importDraft}>{busy?'Importing…':perfumeId?(recordStatus==='draft'?'Draft created':'Already imported'):'Create unpublished catalog draft'}</button>
  {perfumeId&&<p role="status">{recordStatus==='draft'?'Draft created':'Existing catalog record'}: {perfumeId}. <Link href={'/admin/perfumes/'+encodeURIComponent(perfumeId)+'/edit'}>Review catalog entry</Link></p>}
  {summary&&<p role="status">{summary}</p>}
  {error&&<p role="alert">{error}</p>}
 </div>
}
