import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/collection'
  if (!next.startsWith('/') || next.startsWith('//')) next='/collection'
  if (code) { const supabase=await createClient(); const {error}=await supabase.auth.exchangeCodeForSession(code); if(!error) return NextResponse.redirect(`${origin}${next}`) }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not confirm your sign in. Please try again.')}`)
}
