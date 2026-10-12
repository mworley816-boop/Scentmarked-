'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'

type SubmissionResult={submitted:{index:number;id:string;status:string}[];failed:{index:number;error:string}[];rejected:{index:number;errors:string[]}[]}

export function AtlasBatchIntake(){
 const router=useRouter()
 const [input,setInput]=useState('')
 const [busy,setBusy]=useState(false)
 const [result,setResult]=useState<SubmissionResult|null>(null)
 const [error,setError]=useState('')
 async function submit(){
  setBusy(true);setError('');setResult(null)
  try{
   const sources:unknown=JSON.parse(input)
   if(!Array.isArray(sources)||sources.length>25||sources.length===0)throw new Error('Provide a JSON array of 1–25 research candidates')
   const submitted:SubmissionResult['submitted']=[]
   const failed:SubmissionResult['failed']=[]
   const rejected:SubmissionResult['rejected']=[]
   for(const [index,candidate] of sources.entries()){
    const response=await fetch('/api/admin/atlas-research/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate})})
    const body=await response.json()
    if(response.ok)submitted.push({index,id:body.id,status:body.status})
    else if(response.status===400)rejected.push({index,errors:body.details||[body.error||'Invalid candidate']})
    else failed.push({index,error:body.error||'Submission failed'})
   }
   setResult({submitted,failed,rejected})
   if(submitted.length)router.refresh()
  }catch(e){setError(e instanceof Error?e.message:'Unable to parse submissions')}
  finally{setBusy(false)}
 }
 return <section aria-label="Atlas research intake">
  <h2>Submit research candidates</h2>
  <p>Paste a JSON array (maximum 25). Each item needs brand, name, manufacturerUrl, and sourceNotes. Source URLs are not independently verified.</p>
  <textarea aria-label="Research candidates JSON" value={input} onChange={e=>setInput(e.target.value)} rows={8} placeholder={'[{"brand":"Arabiyat","name":"Example","manufacturerUrl":"https://example.com","sourceNotes":["Source needs verification"]}]'} />
  <button type="button" disabled={busy||!input.trim()} onClick={submit}>{busy?'Submitting…':'Submit to review queue'}</button>
  {error&&<p role="alert">{error}</p>}
  {result&&<div role="status"><p>Submitted: {result.submitted.length}; invalid: {result.rejected.length}; failed: {result.failed.length}</p>
   {result.rejected.map(item=><p key={'r'+item.index}>Item {item.index+1}: {item.errors.join('; ')}</p>)}
   {result.failed.map(item=><p key={'f'+item.index}>Item {item.index+1}: {item.error}</p>)}
  </div>}
 </section>
}
