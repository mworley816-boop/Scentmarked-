import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const metadata={title:'Reset Password',robots:{index:false,follow:false}}

const resetErrors:Record<string,string>={'password-too-short':'Password must be at least 12 characters.','password-mismatch':'Passwords do not match.','update-failed':'Password could not be updated. Please request a new recovery link and try again.','session-expired':'This recovery session is missing or has expired. Please request a new recovery link.'}

async function updatePassword(formData:FormData){
 'use server'
 const password=String(formData.get('password')||'')
 const confirm=String(formData.get('confirm')||'')
 if(password.length<12)redirect('/reset-password?error=password-too-short')
 if(password!==confirm)redirect('/reset-password?error=password-mismatch')
 let updateFailed=false
 try{
  const supabase=await createClient()
  const {data:{user},error:userError}=await supabase.auth.getUser()
  const cookieStore=await cookies()
  const recoveryUserId=cookieStore.get('scent_password_recovery')?.value
  if(userError||!user||recoveryUserId!==user.id)redirect('/reset-password?error=session-expired')
  const {error}=await supabase.auth.updateUser({password})
  updateFailed=!!error
  if(!updateFailed)cookieStore.delete('scent_password_recovery')
 }catch(error:any){
  if(error?.digest)throw error
  updateFailed=true
 }
 if(updateFailed)redirect('/reset-password?error=update-failed')
 redirect('/login?message=password-updated')
}

export default async function ResetPassword({searchParams}:{searchParams:Promise<{error?:string}>}){
 const p=await searchParams
 const error=p.error?resetErrors[p.error]:undefined
 let user=null
 try{
  const supabase=await createClient()
  const result=await supabase.auth.getUser()
  const cookieStore=await cookies()
  const recoveryUserId=cookieStore.get('scent_password_recovery')?.value
  user=result.data.user&&recoveryUserId===result.data.user.id?result.data.user:null
 }catch{}
 return <main className="auth-page"><section className="auth-shell reset-shell"><div className="auth-story"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Choose a new password.</h1><p>Use the secure recovery link from your email, then create a new password for your Scentmarked account.</p><div className="auth-bottle">S</div></div><div className="auth-panel"><a className="auth-logo" href="/">Scentmarked<small>KNOW THE NOTES. FIND THE MATCH.</small></a><h2>Reset password</h2>{error&&<div className="notice error" role="alert">{error}</div>}{user?<form className="auth-card"><label>New password<input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="At least 12 characters"/></label><label>Confirm password<input name="confirm" type="password" required minLength={12} autoComplete="new-password"/></label><div className="auth-buttons"><button formAction={updatePassword}>Update Password</button></div></form>:<><div className="notice error" role="alert">This recovery session is missing or has expired.</div><p><a className="button" href="/login">Request another link</a></p></>}</div></section></main>
}
