'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MediaItem={name:string;url:string}
const PAGE_SIZE=100

export default function SiteMediaUpload({name,label,initialUrl='',guidance=''}:{name:string;label:string;initialUrl?:string;guidance?:string}){
 const [url,setUrl]=useState(initialUrl),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [library,setLibrary]=useState<MediaItem[]>([]),[showLibrary,setShowLibrary]=useState(false),[libraryLoaded,setLibraryLoaded]=useState(false)
 const [hasMore,setHasMore]=useState(false),[storageOffset,setStorageOffset]=useState(0),[search,setSearch]=useState(''),[activeSearch,setActiveSearch]=useState('')
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
   setUrl(publicUrl);setLibrary([]);setLibraryLoaded(false);setHasMore(false);setStorageOffset(0)
  }catch(e){setError(e instanceof Error?e.message:'Upload failed.')}
  finally{setBusy(false)}
 }
 async function loadLibrary(offset=0,term=activeSearch){
  setError('');setBusy(true)
  try{
   const s=createClient()
   const result=await s.storage.from('site-media').list('content',{limit:PAGE_SIZE,offset,sortBy:{column:'created_at',order:'desc'},...(term?{search:term}:{})})
   if(result.error)throw result.error
   const items=(result.data||[]).filter(file=>file.name&&file.name!=='.emptyFolderPlaceholder').map(file=>({
    name:file.name,url:s.storage.from('site-media').getPublicUrl('content/'+file.name).data.publicUrl
   }))
   setLibrary(current=>offset===0?items:[...current,...items.filter(item=>!current.some(existing=>existing.name===item.name))])
   setHasMore((result.data||[]).length===PAGE_SIZE);setStorageOffset(offset+(result.data||[]).length);setLibraryLoaded(true)
  }catch(e){setError(e instanceof Error?e.message:'Could not load media library.')}
  finally{setBusy(false)}
 }
 async function toggleLibrary(){
  if(showLibrary){setShowLibrary(false);return}
  setShowLibrary(true)
  if(!libraryLoaded)await loadLibrary(0)
 }
 async function runSearch(){const term=search.trim();setActiveSearch(term);setLibrary([]);setStorageOffset(0);setHasMore(false);await loadLibrary(0,term)}
 async function clearSearch(){setSearch('');setActiveSearch('');setLibrary([]);setStorageOffset(0);setHasMore(false);await loadLibrary(0,'')}
 const shown=library
 return <div className="site-media-upload">
  <div className="site-media-label"><label>{label}</label>{guidance&&<small>{guidance}</small>}</div>
  <div className={'site-media-current '+(url?'has-image':'empty')}>{url?<><img src={url} alt=""/><div><span>CURRENT IMAGE</span><strong>Ready to save</strong><small>Upload a replacement or choose another image from the library.</small></div></>:<div><span>NO IMAGE SELECTED</span><strong>Add artwork</strong><small>Upload a new image or reuse an existing Media Library asset.</small></div>}</div>
  <input type="hidden" name={name} value={url}/>
  <label className="site-media-file"><span>{url?'Replace with upload':'Upload image'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file)}}/><small>{busy?'Working…':'JPEG, PNG, WebP or AVIF · max 5 MB'}</small></label>
  <div className="result-actions">
   <button className="button ghost" type="button" disabled={busy} onClick={()=>void toggleLibrary()}>{showLibrary?'Hide Library':'Choose from Media Library'}</button>
   {url&&<button className="button ghost" type="button" onClick={()=>setUrl('')}>Remove from content</button>}
  </div>
  {showLibrary&&<div className="site-media-library">
   <form onSubmit={e=>{e.preventDefault();void runSearch()}} className="result-actions site-media-search"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search media filenames…"/><button className="button ghost" type="submit" disabled={busy}>Search</button>{activeSearch&&<button className="button ghost" type="button" disabled={busy} onClick={()=>void clearSearch()}>Clear</button>}</form>
   <p className="muted">{library.length} media file{library.length===1?'':'s'} loaded{activeSearch?' for “'+activeSearch+'”':''}.</p>
   <div className="site-media-grid">
    {shown.length?shown.map(item=><button key={item.name} type="button" title={item.name} onClick={()=>{setUrl(item.url);setShowLibrary(false)}} className={url===item.url?'selected':''}>
     <img src={item.url} alt="" />
    </button>):libraryLoaded?<p>{activeSearch?'No media matches that filename.':'No media uploaded yet.'}</p>:null}
   </div>
   {hasMore&&<div className="result-actions" ><button className="button ghost" type="button" disabled={busy} onClick={()=>void loadLibrary(storageOffset,activeSearch)}>{busy?'Loading…':'Load more media'}</button><span className="muted">Loads the next {PAGE_SIZE} files.</span></div>}
  </div>}
  {error&&<p className="notice error">{error}</p>}
 </div>
}
