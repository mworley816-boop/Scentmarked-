'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitContact(formData:FormData){
 const website=String(formData.get('website')||'').trim()
 if(website)redirect('/contact?sent=1')
 const name=String(formData.get('name')||'').trim().slice(0,100)
 const email=String(formData.get('email')||'').trim().slice(0,254)
 const category=String(formData.get('category')||'general')
 const subject=String(formData.get('subject')||'').trim().slice(0,160)
 const message=String(formData.get('message')||'').trim().slice(0,4000)
 const allowed=new Set(['general','catalog','missing_fragrance','community','privacy','rights'])
 if(!name||!email||!subject||!message||!allowed.has(category))redirect('/contact?error='+encodeURIComponent('Complete all required fields.'))
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))redirect('/contact?error='+encodeURIComponent('Enter a valid email address.'))
 const s=await createClient();const {data:{user}}=await s.auth.getUser()
 const {error}=await s.from('contact_messages').insert({name,email,category,subject,message,user_id:user?.id||null})
 if(error)redirect('/contact?error='+encodeURIComponent('Your message could not be sent. Please try again.'))
 redirect('/contact?sent=1')
}
