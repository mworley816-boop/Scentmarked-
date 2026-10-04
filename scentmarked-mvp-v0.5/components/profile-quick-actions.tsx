'use client'
import {useMemo,useState} from 'react'
import {createClient} from '@/lib/supabase/client'

export default function ProfileQuickActions({perfumeId,name,initialFavorite=false}:{perfumeId:string;name:string;initialFavorite?:boolean}){
 const [favorite,setFavorite]=useState(initialFavorite),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const supabase=useMemo(()=>createClient(),[])
 async function toggle(){
  if(busy)return
  setBusy(true);setMessage('')
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser()
   if(authError)throw authError
   if(!user){window.location.href='/login?next='+encodeURIComponent(window.location.pathname+window.location.search);return}
   if(favorite){
    const {error}=await supabase.from('collection_items').delete().eq('user_id',user.id).eq('perfume_id',perfumeId).eq('status','favorite')
    if(error)throw error
    setFavorite(false);setMessage('Removed from favorites.')
   }else{
    const {error}=await supabase.from('collection_items').upsert({user_id:user.id,perfume_id:perfumeId,status:'favorite'},{onConflict:'user_id,perfume_id,status',ignoreDuplicates:true})
    if(error)throw error
    setFavorite(true);setMessage('Added to favorites.')
   }
  }catch{setMessage('Could not update favorite. Please try again.')}
  finally{setBusy(false)}
 }
 async function share(){
  const url=window.location.href
  setMessage('')
  if(navigator.share){try{await navigator.share({title:name,url});return}catch(e:any){if(e?.name==='AbortError')return}}
  if(navigator.clipboard){try{await navigator.clipboard.writeText(url);setMessage('Link copied.');return}catch{}}
  setMessage('Could not share the link. Please copy it from your browser.')
 }
 const isError=message.startsWith('Could not')
 return <div><div className="profile-quick-actions"><button type="button" aria-label={busy?'Updating favorite':favorite?'Remove from favorites':'Add to favorites'} aria-pressed={favorite} aria-busy={busy} onClick={toggle} disabled={busy}>{favorite?'♥':'♡'}</button><button type="button" aria-label={'Share '+name} onClick={share}>↗</button></div>{message&&<span className="profile-action-message" role={isError?'alert':'status'}>{message}</span>}</div>
}
