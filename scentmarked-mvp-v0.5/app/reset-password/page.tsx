import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata={title:'Reset Password',robots:{index:false,follow:false}}

async function updatePassword(formData:FormData){
 'use server'
 const password=String(formData.get('password')||'')
 const confirm=String(formData.get('confirm')||'')
 if(password.length<12)redirect('/reset-password?error='+encodeURIComponent('Password must be at least 12 characters.'))
 if(password!==confirm)redirect('/reset-password?error='+encodeURIComponent('Passwords do not match.'))
 const supabase=await createClient()
 const {error}=await supabase.auth.updateUser({password})
 if(error)redirect('/reset-password?error='+encodeURIComponent('Password could not be updated. Please request a new recovery link and try again.'))
 redirect('/login?message='+encodeURIComponent('Password updated. You can sign in now.'))
}

export default async function ResetPassword({searchParams}:{searchParams:Promise<{error?:string}>}){
 const p=await searchParams
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 return <main className="auth-page"><section className="auth-shell reset-shell"><div className="auth-story"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Choose a new password.</h1><p>Use the secure recovery link from your email, then create a new password for your Scentmarked account.</p><div className="auth-bottle">S</div></div><div className="auth-panel"><a className="auth-logo" href="/">Scentmarked<small>KNOW THE NOTES. FIND THE MATCH.</small></a><h2>Reset password</h2>{p.error&&<div className="notice error" role="alert">{p.error}</div>}{user?<form className="auth-card"><label>New password<input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="At least 12 characters"/></label><label>Confirm password<input name="confirm" type="password" required minLength={12} autoComplete="new-password"/></label><div className="auth-buttons"><button formAction={updatePassword}>Update Password</button></div></form>:<><div className="notice error" role="alert">This recovery session is missing or has expired.</div><p><a className="button" href="/login">Request another link</a></p></>}</div></section></main>
}
