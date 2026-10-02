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
   const {error}=await supabase.auth.exchangeCodeForSession(code);
   if(!error)return NextResponse.redirect(new URL(next,url.origin));
  }catch{}
 }
 const login=new URL('/login',url.origin);
 login.searchParams.set('error','Could not confirm your sign in. Please try again.');
 login.searchParams.set('next',next);
 return NextResponse.redirect(login);
}
