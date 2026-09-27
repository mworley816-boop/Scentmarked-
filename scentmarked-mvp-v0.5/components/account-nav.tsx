'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AccountNav(){
 const supabase=useMemo(()=>createClient(),[])
 const [user,setUser]=useState<any>(null)
 const [ready,setReady]=useState(false)
 const [busy,setBusy]=useState(false)

 useEffect(()=>{
  let active=true
  supabase.auth.getSession().then(({data})=>{if(active){setUser(data.session?.user||null);setReady(true)}}).catch(()=>{if(active)setReady(true)})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active){setUser(session?.user||null);setReady(true)}})
  return()=>{active=false;subscription.unsubscribe()}
 },[supabase])

 async function signOut(){
  if(busy)return
  setBusy(true)
  try{await supabase.auth.signOut();setUser(null);window.location.href='/'}
  finally{setBusy(false)}
 }

 if(!ready)return <span className="nav-account-placeholder" aria-hidden="true"/>
 if(user)return <><a className="nav-signin" href="/collection">My Marks</a><button className="nav-join nav-signout" type="button" onClick={signOut} disabled={busy}>{busy?'Signing Out…':'Sign Out'}</button></>
 return <><a className="nav-signin" href="/login">Sign In</a><a className="nav-join" href="/login">Join Free</a></>
}
