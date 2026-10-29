import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeAuthNext } from '@/lib/auth-redirect';
import { isOnboardingCompletion } from '@/lib/onboarding-intent';
import { applyOnboardingHandoff,decodeOnboardingHandoff,onboardingCookie,parseOnboardingHandoff } from '@/lib/onboarding-handoff';


export async function GET(request:Request){
 const url=new URL(request.url);
 const next=safeAuthNext(url.searchParams.get('next'));
 const code=url.searchParams.get('code');
 const tokenHash=url.searchParams.get('token_hash');
 const emailType=url.searchParams.get('type');
 const isRecovery=emailType==='recovery'||next.split(/[?#]/,1)[0]==='/reset-password';
 if(code||tokenHash){
  try{
   const supabase=await createClient();
   const {data,error}=code
    ?await supabase.auth.exchangeCodeForSession(code)
    :await supabase.auth.verifyOtp({token_hash:tokenHash!,type:isRecovery?'recovery':'email'});
   if(!error&&data.user){
    const cookieHandoff=decodeOnboardingHandoff(request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(onboardingCookie+'='))?.slice(onboardingCookie.length+1));
    const metadataHandoff=parseOnboardingHandoff(data.user?.user_metadata?.onboarding_profile);
    // Prefer preferences tied to the authenticated account over any stale shared-browser cookie.
    const requestedPath=next.split(/[?#]/,1)[0];
    // Only the signup confirmation flow may apply onboarding preferences.
    // Other callbacks, including password recovery, must leave the profile untouched.
    const completingOnboarding=isOnboardingCompletion(next);
    const handoff=completingOnboarding?(metadataHandoff||cookieHandoff):null;
    const applied=handoff&&data.user?await applyOnboardingHandoff(supabase,data.user.id,handoff):false;
    if(applied&&data.user?.user_metadata?.onboarding_profile){
     const metadata={...(data.user.user_metadata||{})};
     delete metadata.onboarding_profile;
     const {error:metadataError}=await supabase.auth.updateUser({data:metadata});
     if(metadataError)console.error('Could not clear temporary onboarding metadata',metadataError.message);
    }
    const destination=isRecovery?'/reset-password':handoff&&requestedPath==='/matches'&&!applied?'/onboarding?error=save-failed':next;
    const response=NextResponse.redirect(new URL(destination,url.origin));
    if(applied)response.cookies.delete(onboardingCookie);
    if(isRecovery){
     response.cookies.set('scent_password_recovery',data.user.id,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/reset-password',maxAge:900});
    }
    return response;
   }
  }catch{}
 }
 const login=new URL('/login',url.origin);
 login.searchParams.set('error','callback-failed');
 login.searchParams.set('next',next);
 return NextResponse.redirect(login);
}
