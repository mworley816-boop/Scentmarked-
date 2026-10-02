import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeAuthNext } from '@/lib/auth-redirect';


export async function GET(request:Request){
 const url=new URL(request.url);
 const next=safeAuthNext(url.searchParams.get('next'));
 const code=url.searchParams.get('code');
 if(code){
  try{
   const supabase=await createClient();
   const {data,error}=await supabase.auth.exchangeCodeForSession(code);
   if(!error){
    const response=NextResponse.redirect(new URL(next,url.origin));
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
