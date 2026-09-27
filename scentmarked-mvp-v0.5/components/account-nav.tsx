'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AccountNav(){
 const supabase=useMemo(()=>createClient(),[])
 const [user,setUser]=useState<any>(null)
 const [isAdmin,setIsAdmin]=useState(false)
 const [ready,setReady]=useState(false)
 const [busy,setBusy]=useState(false)

 useEffect(()=>{
  let active=true

  async function syncAccount(nextUser:any){
   if(!active)return
   setUser(nextUser||null)
   if(!nextUser){setIsAdmin(false);setReady(true);return}
   const {data}=await supabase.from('profiles').select('is_admin').eq('id',nextUser.id).maybeSingle()
   if(active){setIsAdmin(data?.is_admin===true);setReady(true)}
  }

  supabase.auth.getSession().then(({data})=>syncAccount(data.session?.user||null)).catch(()=>{if(active)setReady(true)})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{void syncAccount(session?.user||null)})
  return()=>{active=false;subscription.unsubscribe()}
 },[supabase])

 async function signOut(){
  if(busy)return
  setBusy(true)
  try{await supabase.auth.signOut();setUser(null);setIsAdmin(false);window.location.href='/'}
  finally{setBusy(false)}
 }

 if(!ready)return <span className="nav-account-placeholder" aria-hidden="true"/>
 if(user)return <>
  {isAdmin&&<a className="nav-signin nav-admin" href="/admin">Admin</a>}
  <a className="nav-signin" href="/collection">My Marks</a>
  <button className="nav-join nav-signout" type="button" onClick={signOut} disabled={busy}>{busy?'Signing Out…':'Sign Out'}</button>
 </>
 return <><a className="nav-signin" href="/login">Sign In</a><a className="nav-join" href="/login">Join Free</a></>
}
