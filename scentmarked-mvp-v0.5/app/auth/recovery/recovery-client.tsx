'use client'

import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'

export default function RecoveryClient(){
 const [error,setError]=useState('')
 useEffect(()=>{
  let active=true
  async function finish(){
   try{
    const supabase=createClient()
    const hash=new URLSearchParams(window.location.hash.slice(1))
    const query=new URLSearchParams(window.location.search)
    const accessToken=hash.get('access_token')
    const refreshToken=hash.get('refresh_token')
    const code=query.get('code')
    const errorCode=hash.get('error_code')||query.get('error_code')
    if(errorCode)throw new Error('The recovery link is invalid or expired.')
    if(accessToken&&refreshToken){
     const {error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken})
     if(error)throw error
    }else if(code){
     const {error}=await supabase.auth.exchangeCodeForSession(code)
     if(error)throw error
    }else{
     throw new Error('No recovery credentials were found in this link.')
    }
    // Remove one-time credentials from browser history before navigating.
    window.history.replaceState(null,'','/auth/recovery')
    const response=await fetch('/auth/recovery/complete',{method:'POST',credentials:'same-origin'})
    if(!response.ok)throw new Error('Could not verify the recovery session.')
    window.location.replace('/reset-password')
   }catch{
    if(active)setError('This recovery link could not be verified. Please request a new password-reset email.')
   }
  }
  void finish()
  return ()=>{active=false}
 },[])
 return error?<><p role="alert">{error}</p><a href="/login">Request another link</a></>:<p role="status">Verifying your recovery link…</p>
}
