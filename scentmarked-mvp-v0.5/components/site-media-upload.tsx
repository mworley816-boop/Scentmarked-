'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MediaItem={name:string;url:string}
const PAGE_SIZE=100

export default function SiteMediaUpload({name,label,initialUrl=''}:{name:string;label:string;initialUrl?:string}){
 const [url,setUrl]=useState(initialUrl),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [library,setLibrary]=useState<MediaItem[]>([]),[showLibrary,setShowLibrary]=useState(false),[libraryLoaded,setLibraryLoaded]=useState(false)
 const [hasMore,setHasMore]=useState(false),[search,setSearch]=useState('')
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
   setUrl(publicUrl);setLibrary([]);setLibraryLoaded(false);setHasMore(false)
  }catch(e){setError(e instanceof Error?e.message:'Upload failed.')}
  finally{setBusy(false)}
 }
 async function loadLibrary(offset=0){
  setError('');setBusy(true)
  try{
   const s=createClient()
   const result=await s.storage.from('site-media').list('content',{limit:PAGE_SIZE,offset,sortBy:{column:'created_at',order:'desc'}})
   if(result.error)throw result.error
   const items=(result.data||[]).filter(file=>file.name&&file.name!=='.emptyFolderPlaceholder').map(file=>({
    name:file.name,url:s.storage.from('site-media').getPublicUrl('content/'+file.name).data.publicUrl
   }))
   setLibrary(current=>offset===0?items:[...current,...items.filter(item=>!current.some(existing=>existing.name===item.name))])
   setHasMore((result.data||[]).length===PAGE_SIZE);setLibraryLoaded(true)
  }catch(e){setError(e instanceof Error?e.message:'Could not load media library.')}
  finally{setBusy(false)}
 }
 async function toggleLibrary(){
  if(showLibrary){setShowLibrary(false);return}
  setShowLibrary(true)
  if(!libraryLoaded)await loadLibrary(0)
 }
 const query=search.trim().toLowerCase(),shown=query?library.filter(item=>item.name.toLowerCase().includes(query)):library
 return <div className="site-media-upload">
  <label>{label}</label>
  {url&&<img src={url} alt="" style={{display:'block',width:'100%',maxWidth:420,height:180,objectFit:'cover',borderRadius:12,marginBottom:10}}/>}
  <input type="hidden" name={name} value={url}/>
  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file)}}/>
  <p>{busy?'Working…':'JPEG, PNG, WebP or AVIF · max 5 MB'}</p>
  <div className="result-actions">
   <button className="button ghost" type="button" disabled={busy} onClick={()=>void toggleLibrary()}>{showLibrary?'Hide Library':'Choose from Media Library'}</button>
   {url&&<button className="button ghost" type="button" onClick={()=>setUrl('')}>Remove from content</button>}
  </div>
  {showLibrary&&<div style={{marginTop:12}}>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search loaded media filenames…" style={{width:'100%',marginBottom:10}}/>
   <p className="muted">{library.length} media file{library.length===1?'':'s'} loaded{query?' · '+shown.length+' match'+(shown.length===1?'':'es'):''}.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10}}>
    {shown.length?shown.map(item=><button key={item.name} type="button" title={item.name} onClick={()=>{setUrl(item.url);setShowLibrary(false)}} style={{padding:0,border:url===item.url?'3px solid currentColor':'1px solid #ccc',borderRadius:10,overflow:'hidden',cursor:'pointer',background:'transparent'}}>
     <img src={item.url} alt="" style={{display:'block',width:'100%',height:90,objectFit:'cover'}}/>
    </button>):libraryLoaded?<p>{query?'No loaded media matches that filename.':'No media uploaded yet.'}</p>:null}
   </div>
   {hasMore&&<div className="result-actions" style={{marginTop:12}}><button className="button ghost" type="button" disabled={busy} onClick={()=>void loadLibrary(library.length)}>{busy?'Loading…':'Load more media'}</button><span className="muted">Loads the next {PAGE_SIZE} files.</span></div>}
  </div>}
  {error&&<p className="notice error">{error}</p>}
 </div>
}
