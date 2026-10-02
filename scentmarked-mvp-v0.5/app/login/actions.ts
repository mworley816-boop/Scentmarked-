'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/site'
import { safeAuthNext } from '@/lib/auth-redirect'


function validEmail(email:string){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function loginUrl(kind:'error'|'message',code:string,next:string){
 return `/login?${kind}=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
}
async function siteOrigin(){
 const h=await headers()
 const host=h.get('x-forwarded-host')||h.get('host')
 const proto=h.get('x-forwarded-proto')||'https'
 if(host)return `${proto}://${host}`
 return siteUrl
}

export async function login(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const password=String(formData.get('password')||'')
 const next=safeAuthNext(formData.get('next'))
 if(!email||!password)redirect(loginUrl('error','credentials-required',next))
 if(!validEmail(email))redirect(loginUrl('error','invalid-email',next))
 try{
  const supabase=await createClient()
  const {error}=await supabase.auth.signInWithPassword({email,password})
  if(error)redirect(loginUrl('error','invalid-credentials',next))
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
  const origin=await siteOrigin()
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
 if(!email||!password)redirect(loginUrl('error','credentials-required',next))
 if(!validEmail(email))redirect(loginUrl('error','invalid-email',next))
 if(password.length<12)redirect(loginUrl('error','password-too-short',next))
 try{
  const supabase=await createClient()
  const origin=await siteOrigin()
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:`${origin}/auth/callback?next=${encodeURIComponent(next)}`}})
  if(error)redirect(loginUrl('error','signup-failed',next))
  if(data.session)redirect(next)
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','signup-unavailable',next))
 }
 redirect(loginUrl('message','confirm-email',next))
}
