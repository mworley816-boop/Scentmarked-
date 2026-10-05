import { login, signup, requestPasswordReset } from './actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeAuthNext } from '@/lib/auth-redirect'
export const metadata={title:'Sign In or Join',description:'Sign in to Scentmarked or create an account to save fragrances and manage My Marks.',robots:{index:false,follow:false}}
const errorMessages:Record<string,string>={
 'credentials-required':'Email and password are required.',
 'invalid-email':'Enter a valid email address.',
 'invalid-credentials':'Email or password is incorrect.',
 'signin-unavailable':'Sign in is temporarily unavailable. Please try again.',
 'email-required':'Enter your email address first.',
 'recovery-failed':'Password recovery could not be started. Please try again.',
 'recovery-unavailable':'Password recovery is temporarily unavailable. Please try again.',
 'password-too-short':'Password must be at least 12 characters.',
 'signup-failed':'Account creation could not be completed. Please check your details and try again.',
 'signup-unavailable':'Account creation is temporarily unavailable. Please try again.',
 'callback-failed':'Could not confirm your sign in. Please try again.'
}
const statusMessages:Record<string,string>={
 'recovery-sent':'If an account exists for that email, a password reset link has been sent.',
 'confirm-email':'Check your email and confirm your account. After confirmation, Scentmarked will finish signing you in.',
 'password-updated':'Password updated. You can sign in now.'
}
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string,message?:string,next?:string,signup?:string}>}) {
 const p=await searchParams; const finishingSignup=p.signup==='finish'&&p.message!=='confirm-email'; const next=safeAuthNext(p.next); const error=p.error?errorMessages[p.error]:undefined; const message=p.message?statusMessages[p.message]:undefined
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(user)redirect(next)
 return <main className="auth-page"><section className="auth-shell">
  <div className="auth-story"><p className="eyebrow">YOUR SCENTED JOURNEY</p><h1>More than scents.<br/>A more informed you.</h1><p>Create your Scentmarked account to collect fragrances, remember what you've tried, and keep your next discoveries close.</p><div className="auth-bottle">S</div><i>Know the notes.<br/>Find the match.</i></div>
  <div className="auth-panel"><a className="auth-logo" href="/">Scentmarked<small>KNOW THE NOTES. FIND THE MATCH.</small></a><h2>{finishingSignup?'Your scent profile is ready':'Welcome to Scentmarked'}</h2><p>{finishingSignup?'Create your free account to reveal your personalized matches and save your scent profile.':'Sign in or create your free account.'}</p>{error&&<div className="notice error" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}
   {!finishingSignup&&<form className="auth-card" action={login}><input type="hidden" name="next" value={next}/><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required autoComplete="current-password" placeholder="Password"/></label><div className="auth-buttons"><button type="submit">Sign In</button></div><button className="forgot-password" formAction={requestPasswordReset} formNoValidate>Forgot password?</button></form>}
   <h3>{finishingSignup?'Create your account to see your results':'Create an account'}</h3><form className="auth-card" action={signup}><input type="hidden" name="next" value={next}/><label>Display name <span>optional</span><input name="display_name" autoComplete="name" maxLength={80} placeholder="Your name"/></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="At least 12 characters"/></label><div className="auth-buttons"><button className="secondary" type="submit">{finishingSignup?'Create Account & See My Matches':'Join Free'}</button></div></form>{finishingSignup&&<p><a href="/login">Already have an account? Sign in instead.</a></p>}<p className="auth-fine">Your collection stays private unless you choose to share it later.</p>
  </div></section></main>
}