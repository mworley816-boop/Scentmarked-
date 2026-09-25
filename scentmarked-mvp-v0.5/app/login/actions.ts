'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : '/collection'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/collection'
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const next = safeNext(formData.get('next'))
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`)
  redirect(next)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const displayName = String(formData.get('display_name') || '').trim()
  const next = safeNext(formData.get('next'))
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(next)}` }
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`)
  if (data.session) redirect(next)
  redirect(`/login?message=${encodeURIComponent('Check your email to confirm your account, then sign in.')}&next=${encodeURIComponent(next)}`)
}
