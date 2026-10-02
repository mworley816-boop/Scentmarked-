'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/site'

function safeNext(value:FormDataEntryValue|null){
 const next=typeof value==='string'?value:'/collection'
 return next.startsWith('/')&&!next.startsWith('//')?next:'/collection'
}
function validEmail(email:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function loginUrl(kind:'error'|'message',message:string,next:string){
 return `/login?${kind}=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`
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
 const next=safeNext(formData.get('next'))
 if(!email||!password)redirect(loginUrl('error','Email and password are required.',next))
 if(!validEmail(email))redirect(loginUrl('error','Enter a valid email address.',next))
 try{
  const supabase=await createClient()
  const {error}=await supabase.auth.signInWithPassword({email,password})
  if(error)redirect(loginUrl('error','Email or password is incorrect.',next))
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','Sign in is temporarily unavailable. Please try again.',next))
 }
 redirect(next)
}

export async function requestPasswordReset(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const next=safeNext(formData.get('next'))
 if(!email)redirect(loginUrl('error','Enter your email address first.',next))
 if(!validEmail(email))redirect(loginUrl('error','Enter a valid email address.',next))
 try{
  const supabase=await createClient()
  const origin=await siteOrigin()
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`})
  if(error)redirect(loginUrl('error','Password recovery could not be started. Please try again.',next))
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','Password recovery is temporarily unavailable. Please try again.',next))
 }
 redirect(loginUrl('message','If an account exists for that email, a password reset link has been sent.',next))
}

export async function signup(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const password=String(formData.get('password')||'')
 const displayName=String(formData.get('display_name')||'').trim().slice(0,80)
 const next=safeNext(formData.get('next'))
 if(!email||!password)redirect(loginUrl('error','Email and password are required.',next))
 if(!validEmail(email))redirect(loginUrl('error','Enter a valid email address.',next))
 if(password.length<12)redirect(loginUrl('error','Password must be at least 12 characters.',next))
 try{
  const supabase=await createClient()
  const origin=await siteOrigin()
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:`${origin}/auth/callback?next=${encodeURIComponent(next)}`}})
  if(error)redirect(loginUrl('error','Account creation could not be completed. Please check your details and try again.',next))
  if(data.session)redirect(next)
 }catch(error:any){
  if(error?.digest)throw error
  redirect(loginUrl('error','Account creation is temporarily unavailable. Please try again.',next))
 }
 redirect(loginUrl('message','Check your email to confirm your account, then sign in.',next))
}
