'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/site'
import { safeAuthNext } from '@/lib/auth-redirect'
import { cookies } from 'next/headers'
import { applyOnboardingHandoff,decodeOnboardingHandoff,onboardingCookie } from '@/lib/onboarding-handoff'


function validEmail(email:string){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function loginUrl(kind:'error'|'message',code:string,next:string,finishSignup=false){
 return `/login?${kind}=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}${finishSignup?'&signup=finish':''}`
}
export async function login(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const password=String(formData.get('password')||'')
 const next=safeAuthNext(formData.get('next'))
 if(!email||!password)redirect(loginUrl('error','credentials-required',next))
 if(!validEmail(email))redirect(loginUrl('error','invalid-email',next))
 try{
  const supabase=await createClient()
  const {data,error}=await supabase.auth.signInWithPassword({email,password})
  if(error)redirect(loginUrl('error','invalid-credentials',next))
  const jar=await cookies(),handoff=decodeOnboardingHandoff(jar.get(onboardingCookie)?.value)
  if(handoff&&data.user){
   const applied=await applyOnboardingHandoff(supabase,data.user.id,handoff)
   if(applied){jar.delete(onboardingCookie);redirect('/matches?profile=ready')}
   redirect('/onboarding?error=save-failed')
  }
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','signin-unavailable',next))
 }
 redirect(next)
}

export async function requestPasswordReset(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const next=safeAuthNext(formData.get('next'))
 if(!email)redirect(loginUrl('error','email-required',next))
 if(!validEmail(email))redirect(loginUrl('error','invalid-email',next))
 try{
  const supabase=await createClient()
  const origin=siteUrl
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`})
  if(error)redirect(loginUrl('error','recovery-failed',next))
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','recovery-unavailable',next))
 }
 redirect(loginUrl('message','recovery-sent',next))
}

export async function signup(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const password=String(formData.get('password')||'')
 const displayName=String(formData.get('display_name')||'').trim().slice(0,80)
 const next=safeAuthNext(formData.get('next'))
 const onboarding='/onboarding'
 const finishSignup=(await cookies()).has(onboardingCookie)
 if(!email||!password)redirect(loginUrl('error','credentials-required',next,finishSignup))
 if(!validEmail(email))redirect(loginUrl('error','invalid-email',next,finishSignup))
 if(password.length<12)redirect(loginUrl('error','password-too-short',next,finishSignup))
 try{
  const supabase=await createClient()
  const origin=siteUrl
  const jar=await cookies(),hasHandoff=!!decodeOnboardingHandoff(jar.get(onboardingCookie)?.value),callbackNext=hasHandoff?'/matches?profile=ready':onboarding
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:`${origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`}})
  if(error)redirect(loginUrl('error','signup-failed',next,finishSignup))
  if(data.session){
   const jar=await cookies(),handoff=decodeOnboardingHandoff(jar.get(onboardingCookie)?.value)
   if(handoff&&data.user){
    const applied=await applyOnboardingHandoff(supabase,data.user.id,handoff)
    if(applied){jar.delete(onboardingCookie);redirect('/matches?profile=ready')}
    redirect('/onboarding?error=save-failed')
   }
   redirect(onboarding)
  }
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','signup-unavailable',next,finishSignup))
 }
 redirect(loginUrl('message','confirm-email',next,finishSignup))
}
