import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeNext(value:string|null){
 const next=value||'/collection';
 if(!next.startsWith('/')||next.startsWith('//'))return '/collection';
 const pathname=next.split(/[?#]/,1)[0];
 if(pathname==='/login'||pathname==='/reset-password'||pathname.startsWith('/auth/'))return '/collection';
 return next;
}
export async function GET(request:Request){
 const url=new URL(request.url);
 const next=safeNext(url.searchParams.get('next'));
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
