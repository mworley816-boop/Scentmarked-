'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MediaItem={name:string;url:string}

export default function SiteMediaUpload({name,label,initialUrl=''}:{name:string;label:string;initialUrl?:string}){
 const [url,setUrl]=useState(initialUrl),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [library,setLibrary]=useState<MediaItem[]>([]),[showLibrary,setShowLibrary]=useState(false),[libraryLoaded,setLibraryLoaded]=useState(false)
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
   setUrl(publicUrl);setLibraryLoaded(false)
  }catch(e){setError(e instanceof Error?e.message:'Upload failed.')}
  finally{setBusy(false)}
 }
 async function toggleLibrary(){
  if(showLibrary){setShowLibrary(false);return}
  setError('');setShowLibrary(true)
  if(libraryLoaded)return
  setBusy(true)
  try{
   const s=createClient()
   const result=await s.storage.from('site-media').list('content',{limit:100,sortBy:{column:'created_at',order:'desc'}})
   if(result.error)throw result.error
   setLibrary((result.data||[]).filter(file=>file.name&&file.name!=='.emptyFolderPlaceholder').map(file=>({
    name:file.name,url:s.storage.from('site-media').getPublicUrl('content/'+file.name).data.publicUrl
   })))
   setLibraryLoaded(true)
  }catch(e){setError(e instanceof Error?e.message:'Could not load media library.')}
  finally{setBusy(false)}
 }
 return <div className="site-media-upload">
  <label>{label}</label>
  {url&&<img src={url} alt="" style={{display:'block',width:'100%',maxWidth:420,height:180,objectFit:'cover',borderRadius:12,marginBottom:10}}/>}
  <input type="hidden" name={name} value={url}/>
  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/>
  <p>{busy?'Working…':'JPEG, PNG, WebP or AVIF · max 5 MB'}</p>
  <div className="result-actions">
   <button className="button ghost" type="button" disabled={busy} onClick={()=>void toggleLibrary()}>{showLibrary?'Hide Library':'Choose from Media Library'}</button>
   {url&&<button className="button ghost" type="button" onClick={()=>setUrl('')}>Remove from content</button>}
  </div>
  {showLibrary&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10,marginTop:12}}>
   {library.length?library.map(item=><button key={item.name} type="button" title={item.name} onClick={()=>{setUrl(item.url);setShowLibrary(false)}} style={{padding:0,border:url===item.url?'3px solid currentColor':'1px solid #ccc',borderRadius:10,overflow:'hidden',cursor:'pointer',background:'transparent'}}>
    <img src={item.url} alt="" style={{display:'block',width:'100%',height:90,objectFit:'cover'}}/>
   </button>):libraryLoaded?<p>No media uploaded yet.</p>:null}
  </div>}
  {error&&<p className="notice error">{error}</p>}
 </div>
}
