import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeAuthNext } from '@/lib/auth-redirect';
import { applyOnboardingHandoff,decodeOnboardingHandoff,onboardingCookie,parseOnboardingHandoff } from '@/lib/onboarding-handoff';


export async function GET(request:Request){
 const url=new URL(request.url);
 const next=safeAuthNext(url.searchParams.get('next'));
 const code=url.searchParams.get('code');
 if(code){
  try{
   const supabase=await createClient();
   const {data,error}=await supabase.auth.exchangeCodeForSession(code);
   if(!error){
    const cookieHandoff=decodeOnboardingHandoff(request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(onboardingCookie+'='))?.slice(onboardingCookie.length+1));
    const metadataHandoff=parseOnboardingHandoff(data.user?.user_metadata?.onboarding_profile);
    const handoff=cookieHandoff||metadataHandoff;
    const applied=handoff&&data.user?await applyOnboardingHandoff(supabase,data.user.id,handoff):false;
    if(applied&&data.user?.user_metadata?.onboarding_profile){
     const metadata={...(data.user.user_metadata||{})};
     delete metadata.onboarding_profile;
     const {error:metadataError}=await supabase.auth.updateUser({data:metadata});
     if(metadataError)console.error('Could not clear temporary onboarding metadata',metadataError.message);
    }
    const requestedPath=next.split(/[?#]/,1)[0];
    const destination=handoff&&requestedPath==='/matches'&&!applied?'/onboarding?error=save-failed':next;
    const response=NextResponse.redirect(new URL(destination,url.origin));
    if(applied)response.cookies.delete(onboardingCookie);
    if(next.split(/[?#]/,1)[0]==='/reset-password'&&data.user){
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
