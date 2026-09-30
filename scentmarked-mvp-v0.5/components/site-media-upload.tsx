'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SiteMediaUpload({name,label,initialUrl=''}:{name:string;label:string;initialUrl?:string}){
 const [url,setUrl]=useState(initialUrl),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function upload(file:File){
  setError('')
  if(file.size>5*1024*1024){setError('Image must be 5 MB or smaller.');return}
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)){setError('Use JPEG, PNG, WebP or AVIF.');return}
  setBusy(true)
  try{
   const s=createClient(),ext=file.name.split('.').pop()?.toLowerCase()||'jpg'
   const path='content/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext
   const result=await s.storage.from('site-media').upload(path,file,{contentType:file.type,cacheControl:'3600'})
   if(result.error)throw result.error
   const publicUrl=s.storage.from('site-media').getPublicUrl(result.data.path).data.publicUrl
   setUrl(publicUrl)
  }catch(e){setError(e instanceof Error?e.message:'Upload failed.')}
  finally{setBusy(false)}
 }
 return <div className="site-media-upload">
  <label>{label}</label>
  {url&&<img src={url} alt="" style={{display:'block',width:'100%',maxWidth:420,height:180,objectFit:'cover',borderRadius:12,marginBottom:10}}/>}
  <input type="hidden" name={name} value={url}/>
  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/>
  <p>{busy?'Uploading…':'JPEG, PNG, WebP or AVIF · max 5 MB'}</p>
  {url&&<button className="button ghost" type="button" onClick={()=>setUrl('')}>Remove from content</button>}
  {error&&<p className="notice error">{error}</p>}
 </div>
}
