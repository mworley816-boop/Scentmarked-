'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'

export default function RecoveryClient(){
 const [ready,setReady]=useState(false)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 useEffect(()=>{
  let active=true
  async function verify(){
   try{
    const supabase=createClient()
    const hash=new URLSearchParams(window.location.hash.slice(1))
    const query=new URLSearchParams(window.location.search)
    const accessToken=hash.get('access_token')
    const refreshToken=hash.get('refresh_token')
    const code=query.get('code')
    if(hash.has('error')||query.has('error'))throw new Error('Invalid recovery link')
    if(accessToken&&refreshToken){
     const {error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken})
     if(error)throw error
    }else if(code){
     const {error}=await supabase.auth.exchangeCodeForSession(code)
     if(error)throw error
    }else throw new Error('Missing recovery credentials')
    window.history.replaceState(null,'','/auth/recovery')
    if(active)setReady(true)
   }catch{
    if(active)setError('This recovery link could not be verified. Please request a new reset email.')
   }
  }
  void verify()
  return ()=>{active=false}
 },[])
 async function save(formData:FormData){
  const password=String(formData.get('password')||'')
  const confirm=String(formData.get('confirm')||'')
  if(password.length<12){setError('Use at least 12 characters.');return}
  if(password!==confirm){setError('Passwords do not match.');return}
  setBusy(true);setError('')
  try{
   const supabase=createClient()
   const {error}=await supabase.auth.updateUser({password})
   if(error)throw error
   await supabase.auth.signOut()
   window.location.replace('/login?message=password-updated')
  }catch{setError('Could not update the password. Request a new reset link and try again.');setBusy(false)}
 }
 if(!ready)return <>{error?<><p role="alert">{error}</p><a href="/login">Request another link</a></>:<p role="status">Verifying your recovery link…</p>}</>
 return <form action={save} className="auth-card"><h2>Choose a new password</h2>{error&&<p role="alert">{error}</p>}<label>New password<input type="password" name="password" minLength={12} required autoComplete="new-password"/></label><label>Confirm password<input type="password" name="confirm" minLength={12} required autoComplete="new-password"/></label><button disabled={busy} type="submit">{busy?'Updating…':'Update Password'}</button></form>
}
